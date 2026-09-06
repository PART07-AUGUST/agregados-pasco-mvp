-- Habilitar extensiones requeridas para encriptación y UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Agregar campos de control operativo para transporte pesado en public.usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS licencia_conducir TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;

-- Sincronizar emails existentes de auth.users a public.usuarios
UPDATE public.usuarios u
SET email = a.email
FROM auth.users a
WHERE u.id = a.id AND (u.email IS NULL OR u.email = '');

-- 2. Función RPC para que el Administrador cree credenciales de choferes de forma atómica
--    sin que se cierre su sesión en el navegador frontend.
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
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_admin_rol TEXT;
    v_new_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    -- Validar que el usuario que ejecuta sea Administrador
    SELECT rol INTO v_admin_rol FROM public.usuarios WHERE id = auth.uid();
    IF v_admin_rol IS DISTINCT FROM 'ADMINISTRADOR' THEN
        RAISE EXCEPTION 'Operación no autorizada. Solo los administradores pueden registrar conductores.';
    END IF;

    -- Validar formato y existencia de correo
    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)) THEN
        RAISE EXCEPTION 'El correo electrónico ya está registrado en el sistema.';
    END IF;

    -- Validar duplicidad de DNI
    IF EXISTS (SELECT 1 FROM public.usuarios WHERE dni = p_dni) THEN
        RAISE EXCEPTION 'Ya existe un usuario registrado con este DNI.';
    END IF;

    v_new_user_id := gen_random_uuid();
    v_encrypted_pw := crypt(p_password, gen_salt('bf'));

    -- Insertar credenciales en auth.users
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

    -- Insertar perfil en public.usuarios
    INSERT INTO public.usuarios (
        id,
        email,
        nombre,
        rol,
        dni,
        celular,
        licencia_conducir,
        activo,
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
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        nombre = EXCLUDED.nombre,
        celular = EXCLUDED.celular,
        dni = EXCLUDED.dni,
        licencia_conducir = EXCLUDED.licencia_conducir,
        activo = TRUE;

    -- Si se seleccionó un volquete, vincular inmediatamente
    IF p_vehiculo_id IS NOT NULL THEN
        UPDATE public.vehiculos
        SET conductor_id = v_new_user_id
        WHERE id = p_vehiculo_id;
    END IF;

    RETURN jsonb_build_object(
        'id', v_new_user_id,
        'email', lower(p_email),
        'nombre', p_nombre
    );
END;
$$;

-- Conceder permisos de ejecución para usuarios autenticados (la función valida el rol internamente)
GRANT EXECUTE ON FUNCTION public.admin_crear_conductor TO authenticated;
