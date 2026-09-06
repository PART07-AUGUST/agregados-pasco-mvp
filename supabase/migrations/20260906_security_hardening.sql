-- ==============================================================================
-- 🛡️ MIGRACIÓN DE SEGURIDAD INTEGRAL (HARDENING) - SIS-AGREGADOS
-- Fecha: 2026-09-06
-- ==============================================================================

-- 1. CONTROL DE CAMBIO OBLIGATORIO DE CONTRASEÑA EN PRIMER INICIO
ALTER TABLE public.usuarios
ADD COLUMN IF NOT EXISTS requiere_cambio_password BOOLEAN DEFAULT FALSE;

-- ==============================================================================
-- 2. BLINDAJE DE SIGNUP: PREVENCIÓN DE ESCALADA DE PRIVILEGIOS
-- Garantiza que cualquier autoregistro sea forzosamente asignado con rol 'CLIENTE'
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    INSERT INTO public.usuarios (
        id, 
        nombre, 
        rol, 
        dni, 
        celular, 
        ruc,
        requiere_cambio_password
    )
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'nombre', 'Nuevo Usuario'),
        'CLIENTE'::public.rol_usuario, -- FORZADO: Jamás confiar en el payload de registro del cliente
        COALESCE(new.raw_user_meta_data->>'dni', '00000000'),
        COALESCE(new.raw_user_meta_data->>'celular', '900000000'),
        new.raw_user_meta_data->>'ruc',
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Asegurar vinculación del trigger en auth.users
DROP TRIGGER IF EXISTS trigger_handle_new_user ON auth.users;
CREATE TRIGGER trigger_handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. INMUTABILIDAD DE ROLES (PREVENCIÓN DE AUTO-ASIGNACIÓN VIA UPDATE)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.proteger_columna_rol()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    -- Si el rol está cambiando y el ejecutor NO es Administrador, abortar la transacción
    IF NEW.rol IS DISTINCT FROM OLD.rol THEN
        IF public.obtener_rol_actual() IS DISTINCT FROM 'ADMINISTRADOR' THEN
            RAISE EXCEPTION 'Operación denegada: Solo los administradores pueden modificar roles de usuario.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_proteger_columna_rol ON public.usuarios;
CREATE TRIGGER trigger_proteger_columna_rol
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.proteger_columna_rol();

-- ==============================================================================
-- 4. HARDENING DE FUNCIONES SECURITY DEFINER EXISTENTES (search_path seguro)
-- ==============================================================================

-- A. Función para obtener el rol del usuario autenticado
CREATE OR REPLACE FUNCTION public.obtener_rol_actual()
RETURNS public.rol_usuario 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_rol public.rol_usuario;
BEGIN
    SELECT rol INTO v_rol FROM public.usuarios WHERE id = auth.uid();
    RETURN v_rol;
END;
$$;

-- B. Transacción para Asignar Viaje
CREATE OR REPLACE FUNCTION public.asignar_viaje(
    p_pedido_id UUID,
    p_vehiculo_id UUID,
    p_conductor_id UUID
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_viaje_id UUID;
    v_rol public.rol_usuario;
    v_vehicle_active BOOLEAN;
BEGIN
    SELECT public.obtener_rol_actual() INTO v_rol;
    IF v_rol IS DISTINCT FROM 'ADMINISTRADOR' THEN
        RAISE EXCEPTION 'Operación denegada. Solo administradores pueden asignar viajes.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.pedidos
        WHERE id = p_pedido_id
          AND estado = 'PENDIENTE'
    ) THEN
        RAISE EXCEPTION 'El pedido no existe o ya ha sido asignado/cancelado.';
    END IF;

    SELECT activo
    INTO v_vehicle_active
    FROM public.vehiculos
    WHERE id = p_vehiculo_id;

    IF v_vehicle_active IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'El vehículo seleccionado no está activo o no existe.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.viajes
        WHERE vehiculo_id = p_vehiculo_id
          AND estado IN ('PENDIENTE', 'EN_CAMINO', 'EN_BALANZA')
    ) THEN
        RAISE EXCEPTION 'El vehículo seleccionado ya tiene un viaje activo.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.viajes
        WHERE conductor_id = p_conductor_id
          AND estado IN ('PENDIENTE', 'EN_CAMINO', 'EN_BALANZA')
    ) THEN
        RAISE EXCEPTION 'El conductor seleccionado ya tiene un viaje activo.';
    END IF;

    INSERT INTO public.viajes (pedido_id, vehiculo_id, conductor_id, estado)
    VALUES (p_pedido_id, p_vehiculo_id, p_conductor_id, 'PENDIENTE')
    RETURNING id INTO v_viaje_id;

    UPDATE public.vehiculos
    SET conductor_id = p_conductor_id
    WHERE id = p_vehiculo_id;

    UPDATE public.pedidos
    SET estado = 'ASIGNADO'
    WHERE id = p_pedido_id;

    RETURN v_viaje_id;
END;
$$;

-- C. Transacción para Registrar Ticket de Balanza
CREATE OR REPLACE FUNCTION public.registrar_ticket_balanza(
    p_viaje_id UUID,
    p_peso_entrada NUMERIC,
    p_peso_salida NUMERIC,
    p_ticket_url TEXT
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_conductor_id UUID;
    v_rol public.rol_usuario;
BEGIN
    SELECT conductor_id INTO v_conductor_id 
    FROM public.viajes 
    WHERE id = p_viaje_id AND estado IN ('PENDIENTE', 'EN_CAMINO');

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado o en estado no apto para balanza.';
    END IF;

    SELECT public.obtener_rol_actual() INTO v_rol;
    IF v_rol IS DISTINCT FROM 'ADMINISTRADOR' AND auth.uid() != v_conductor_id THEN
        RAISE EXCEPTION 'Acceso no autorizado. No eres el conductor asignado a este viaje.';
    END IF;

    UPDATE public.viajes
    SET peso_entrada_kg = p_peso_entrada,
        peso_salida_kg = p_peso_salida,
        ticket_balanza_url = p_ticket_url,
        estado = 'EN_BALANZA'
    WHERE id = p_viaje_id;

    RETURN TRUE;
END;
$$;

-- D. Transacción para Confirmar Entrega
CREATE OR REPLACE FUNCTION public.confirmar_entrega(
    p_viaje_id UUID
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_pedido_id UUID;
    v_vehiculo_id UUID;
    v_conductor_id UUID;
    v_rol public.rol_usuario;
BEGIN
    SELECT pedido_id, vehiculo_id, conductor_id 
    INTO v_pedido_id, v_vehiculo_id, v_conductor_id 
    FROM public.viajes 
    WHERE id = p_viaje_id AND estado = 'EN_BALANZA';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El viaje no está registrado en balanza o ya ha sido entregado/cancelado.';
    END IF;

    SELECT public.obtener_rol_actual() INTO v_rol;
    IF v_rol IS DISTINCT FROM 'ADMINISTRADOR' AND auth.uid() != v_conductor_id THEN
        RAISE EXCEPTION 'Acceso no autorizado para confirmar la entrega de este viaje.';
    END IF;

    UPDATE public.viajes
    SET estado = 'ENTREGADO',
        fecha_entrega = NOW()
    WHERE id = p_viaje_id;

    UPDATE public.pedidos
    SET estado = 'ENTREGADO'
    WHERE id = v_pedido_id;

    UPDATE public.vehiculos
    SET conductor_id = NULL
    WHERE id = v_vehiculo_id;

    RETURN TRUE;
END;
$$;

-- ==============================================================================
-- 5. RPC CREACIÓN SEGURA DE CONDUCTOR CON FLAG DE CAMBIO DE CONTRASEÑA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_crear_conductor(
    p_email TEXT,
    p_password TEXT,
    p_nombre TEXT,
    p_dni TEXT,
    p_celular TEXT,
    p_licencia TEXT DEFAULT NULL,
    p_vehiculo_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions, pg_temp
AS $$
DECLARE
    v_admin_rol TEXT;
    v_new_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    -- Validar privilegios de administrador
    SELECT rol INTO v_admin_rol FROM public.usuarios WHERE id = auth.uid();
    IF v_admin_rol IS DISTINCT FROM 'ADMINISTRADOR' THEN
        RAISE EXCEPTION 'Operación no autorizada. Solo los administradores pueden registrar conductores.';
    END IF;

    -- Validar unicidad de correo electrónico
    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)) THEN
        RAISE EXCEPTION 'El correo electrónico ya está registrado en el sistema.';
    END IF;

    -- Validar duplicidad de DNI
    IF EXISTS (SELECT 1 FROM public.usuarios WHERE dni = p_dni) THEN
        RAISE EXCEPTION 'Ya existe un usuario registrado con este DNI.';
    END IF;

    v_new_user_id := gen_random_uuid();
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));

    -- Crear usuario en auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud
    ) VALUES (
        v_new_user_id,
        '00000000-0000-0000-0000-000000000000',
        lower(p_email),
        v_encrypted_pw,
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('nombre', p_nombre, 'rol', 'CONDUCTOR', 'dni', p_dni),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    -- Crear perfil en public.usuarios con flag de cambio obligatorio activado
    INSERT INTO public.usuarios (
        id,
        email,
        nombre,
        rol,
        dni,
        celular,
        licencia_conducir,
        activo,
        requiere_cambio_password,
        created_at
    ) VALUES (
        v_new_user_id,
        lower(p_email),
        p_nombre,
        'CONDUCTOR',
        p_dni,
        p_celular,
        p_licencia,
        TRUE,
        TRUE, -- OBLIGATORIO: Cambiar contraseña en primer login
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        nombre = EXCLUDED.nombre,
        celular = EXCLUDED.celular,
        dni = EXCLUDED.dni,
        licencia_conducir = EXCLUDED.licencia_conducir,
        activo = TRUE,
        requiere_cambio_password = TRUE;

    -- Si se seleccionó un volquete, vincular inmediatamente
    IF p_vehiculo_id IS NOT NULL THEN
        UPDATE public.vehiculos
        SET conductor_id = v_new_user_id
        WHERE id = p_vehiculo_id;
    END IF;

    RETURN jsonb_build_object(
        'id', v_new_user_id,
        'email', lower(p_email),
        'nombre', p_nombre,
        'requiere_cambio_password', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_crear_conductor TO authenticated;

-- ==============================================================================
-- 6. RPC PARA CONFIRMAR CAMBIO DE CONTRASEÑA EN PRIMER ACCESO
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.marcar_password_actualizada()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    UPDATE public.usuarios
    SET requiere_cambio_password = FALSE
    WHERE id = auth.uid();

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.marcar_password_actualizada TO authenticated;

-- ==============================================================================
-- 7. REFORZAMIENTO DE POLÍTICAS EN STORAGE BUCKET 'tickets-balanza'
-- Resuelve: public_bucket_allows_listing
-- Los buckets públicos no requieren SELECT para acceder a URLs directas de imagen.
-- Restringimos el listado de archivos (SELECT) exclusivamente a Administradores.
-- ==============================================================================
DROP POLICY IF EXISTS "Permitir subidas en tickets-balanza" ON storage.objects;
CREATE POLICY "Permitir subidas en tickets-balanza"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'tickets-balanza'
    AND public.obtener_rol_actual() IN ('CONDUCTOR', 'ADMINISTRADOR')
    AND (LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp'))
);

DROP POLICY IF EXISTS "Permitir lectura en tickets-balanza" ON storage.objects;
DROP POLICY IF EXISTS "Permitir listar tickets-balanza solo a Administradores" ON storage.objects;
CREATE POLICY "Permitir listar tickets-balanza solo a Administradores"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'tickets-balanza'
    AND public.obtener_rol_actual() = 'ADMINISTRADOR'
);

-- ==============================================================================
-- 8. CIERRE DE PRIVILEGIOS DE EJECUCIÓN (LEAST PRIVILEGE)
-- Resuelve: anon_security_definer_function_executable y authenticated_security_definer_function_executable
-- ==============================================================================

-- A. Revocar ejecución de funciones de TRIGGER para que no puedan ser invocadas como RPCs
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.proteger_columna_rol() FROM PUBLIC, anon, authenticated;

-- B. Revocar acceso anónimo/público por defecto a todas las funciones RPC SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.obtener_rol_actual() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.asignar_viaje(UUID, UUID, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_ticket_balanza(UUID, NUMERIC, NUMERIC, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirmar_entrega(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_crear_conductor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.marcar_password_actualizada() FROM PUBLIC, anon;

-- C. Conceder ejecución de RPCs estrictamente a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.obtener_rol_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.asignar_viaje(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_ticket_balanza(UUID, NUMERIC, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_entrega(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_crear_conductor(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.marcar_password_actualizada() TO authenticated;

