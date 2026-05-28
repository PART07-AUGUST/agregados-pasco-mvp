-- Seed operativo e idempotente para usuarios base y políticas de Storage

UPDATE public.usuarios
SET rol = 'ADMINISTRADOR',
    nombre = 'Paolo Admin',
    dni = '74839201',
    celular = '987654321'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'admin@agregados.com'
);

UPDATE public.usuarios
SET rol = 'CONDUCTOR',
    nombre = 'Juan Conductor Pasco',
    dni = '87654321',
    celular = '912345678'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'conductor@agregados.com'
);

UPDATE public.usuarios
SET rol = 'CLIENTE',
    nombre = 'Constructora Los Andes S.A.C.',
    dni = '10203040',
    celular = '987123456',
    ruc = '20123456789'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'constructora@empresa.com'
);

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

DROP POLICY IF EXISTS "Permitir subidas en tickets-balanza" ON storage.objects;
CREATE POLICY "Permitir subidas en tickets-balanza"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'tickets-balanza');

DROP POLICY IF EXISTS "Permitir lectura en tickets-balanza" ON storage.objects;
CREATE POLICY "Permitir lectura en tickets-balanza"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tickets-balanza');

CREATE OR REPLACE FUNCTION public.asignar_viaje(
    p_pedido_id UUID,
    p_vehiculo_id UUID,
    p_conductor_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_viaje_id UUID;
    v_rol public.rol_usuario;
    v_vehicle_active BOOLEAN;
BEGIN
    SELECT public.obtener_rol_actual() INTO v_rol;
    IF v_rol != 'ADMINISTRADOR' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
