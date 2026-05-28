-- ==========================================
-- 🚛 AGREGADOS PASCO - ESQUEMA DE BASE DE DATOS MVP
-- Cerro de Pasco, Perú
-- ==========================================

-- 1. ENUMS DE DOMINIO
CREATE TYPE public.rol_usuario AS ENUM ('ADMINISTRADOR', 'CONDUCTOR', 'CLIENTE');
CREATE TYPE public.estado_pedido AS ENUM ('PENDIENTE', 'ASIGNADO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO');
CREATE TYPE public.estado_viaje AS ENUM ('PENDIENTE', 'EN_CAMINO', 'EN_BALANZA', 'ENTREGADO', 'CANCELADO');

-- 2. TABLA DE USUARIOS (PERFILES PÚBLICOS ENLAZADOS A AUTH.USERS)
CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    rol public.rol_usuario NOT NULL DEFAULT 'CLIENTE',
    dni TEXT NOT NULL UNIQUE,
    celular TEXT NOT NULL,
    ruc TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación obligatorias (CHECK Constraints)
    CONSTRAINT check_dni CHECK (dni ~ '^[0-9]{8}$'),
    CONSTRAINT check_celular CHECK (celular ~ '^9[0-9]{8}$'),
    CONSTRAINT check_ruc CHECK (ruc IS NULL OR ruc ~ '^[0-9]{11}$')
);

-- 3. TABLA DE VEHÍCULOS (FLOTA LOGÍSTICA)
CREATE TABLE public.vehiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa TEXT NOT NULL UNIQUE,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    capacidad_m3 NUMERIC NOT NULL,
    conductor_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación de placa peruana y capacidad positiva
    CONSTRAINT check_placa CHECK (placa ~ '^[A-Z0-9]{3}-[0-9]{3}$'),
    CONSTRAINT check_capacidad CHECK (capacidad_m3 > 0)
);

-- 4. TABLA DE PEDIDOS (SOLICITUDES DE MATERIAL)
CREATE TABLE public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    material TEXT NOT NULL,
    volumen_m3 NUMERIC NOT NULL,
    destino TEXT NOT NULL,
    estado public.estado_pedido NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Restricciones de negocio
    CONSTRAINT check_volumen CHECK (volumen_m3 > 0),
    CONSTRAINT check_material CHECK (material IN ('ARENA_FINA', 'ARENA_GRUESA', 'PIEDRA_1_2', 'PIEDRA_3_4', 'AFIRMADO', 'TIERRA_CHACRA'))
);

-- 5. TABLA DE VIAJES (DESPACHOS Y SEGUIMIENTO)
CREATE TABLE public.viajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
    conductor_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    estado public.estado_viaje NOT NULL DEFAULT 'PENDIENTE',
    peso_entrada_kg NUMERIC,
    peso_salida_kg NUMERIC,
    ticket_balanza_url TEXT,
    fecha_asignacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    fecha_entrega TIMESTAMP WITH TIME ZONE,
    
    -- Restricciones de pesajes positivos y consistencia secuencial
    CONSTRAINT check_peso_entrada CHECK (peso_entrada_kg IS NULL OR peso_entrada_kg > 0),
    CONSTRAINT check_peso_salida CHECK (peso_salida_kg IS NULL OR peso_salida_kg > 0),
    CONSTRAINT check_consistencia_pesos CHECK (peso_salida_kg IS NULL OR peso_entrada_kg IS NOT NULL)
);

-- ==========================================
-- 🔐 SEGURIDAD: TRIGGER DE AUTOCREACIÓN DE PERFIL PÚBLICO
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, nombre, rol, dni, celular, ruc)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'nombre', 'Nuevo Conductor/Cliente'),
        COALESCE((new.raw_user_meta_data->>'rol')::public.rol_usuario, 'CLIENTE'::public.rol_usuario),
        COALESCE(new.raw_user_meta_data->>'dni', '00000000'),
        COALESCE(new.raw_user_meta_data->>'celular', '900000000'),
        new.raw_user_meta_data->>'ruc'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar trigger a auth.users
CREATE OR REPLACE TRIGGER trigger_handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 🔐 SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Función auxiliar para obtener el rol del token JWT actual de forma segura
CREATE OR REPLACE FUNCTION public.obtener_rol_actual()
RETURNS public.rol_usuario AS $$
DECLARE
    v_rol public.rol_usuario;
BEGIN
    SELECT rol INTO v_rol FROM public.usuarios WHERE id = auth.uid();
    RETURN v_rol;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS en todas las tablas públicas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viajes ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para tabla 'usuarios'
CREATE POLICY "Permitir lectura a Administradores y al propio usuario" ON public.usuarios
    FOR SELECT USING (auth.uid() = id OR public.obtener_rol_actual() = 'ADMINISTRADOR');

CREATE POLICY "Permitir actualización a Administradores y al propio usuario" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id OR public.obtener_rol_actual() = 'ADMINISTRADOR');

CREATE POLICY "Permitir inserción solo a Administradores" ON public.usuarios
    FOR INSERT WITH CHECK (public.obtener_rol_actual() = 'ADMINISTRADOR');

-- 2. Políticas para tabla 'vehiculos'
CREATE POLICY "Permitir lectura a Administradores y Conductores" ON public.vehiculos
    FOR SELECT USING (public.obtener_rol_actual() IN ('ADMINISTRADOR', 'CONDUCTOR'));

CREATE POLICY "Permitir escritura completa solo a Administradores" ON public.vehiculos
    FOR ALL USING (public.obtener_rol_actual() = 'ADMINISTRADOR');

-- 3. Políticas para tabla 'pedidos'
CREATE POLICY "Lectura de pedidos para Admin y Clientes propios" ON public.pedidos
    FOR SELECT USING (public.obtener_rol_actual() = 'ADMINISTRADOR' OR (public.obtener_rol_actual() = 'CLIENTE' AND cliente_id = auth.uid()));

CREATE POLICY "Creación de pedidos para Admin y Clientes propios" ON public.pedidos
    FOR INSERT WITH CHECK (public.obtener_rol_actual() = 'ADMINISTRADOR' OR (public.obtener_rol_actual() = 'CLIENTE' AND cliente_id = auth.uid()));

CREATE POLICY "Modificación de pedidos solo para Administradores" ON public.pedidos
    FOR UPDATE USING (public.obtener_rol_actual() = 'ADMINISTRADOR');

-- 4. Políticas para tabla 'viajes'
CREATE POLICY "Lectura de viajes para Admin y Conductores asignados" ON public.viajes
    FOR SELECT USING (public.obtener_rol_actual() = 'ADMINISTRADOR' OR (public.obtener_rol_actual() = 'CONDUCTOR' AND conductor_id = auth.uid()));

CREATE POLICY "Escritura completa de viajes para Administradores" ON public.viajes
    FOR ALL USING (public.obtener_rol_actual() = 'ADMINISTRADOR');

CREATE POLICY "Conductor puede actualizar estado y balanza de su propio viaje" ON public.viajes
    FOR UPDATE USING (public.obtener_rol_actual() = 'CONDUCTOR' AND conductor_id = auth.uid())
    WITH CHECK (public.obtener_rol_actual() = 'CONDUCTOR' AND conductor_id = auth.uid());

-- ==========================================
-- 🧠 PROCESOS TRANSACCIONALES DE NEGOCIO (RPC)
-- ==========================================

-- A. TRANSACCIÓN: Asignar Viaje (Administrador)
CREATE OR REPLACE FUNCTION public.asignar_viaje(
    p_pedido_id UUID,
    p_vehiculo_id UUID,
    p_conductor_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_viaje_id UUID;
    v_cliente_id UUID;
    v_rol public.rol_usuario;
BEGIN
    -- Validar rol del ejecutor
    SELECT public.obtener_rol_actual() INTO v_rol;
    IF v_rol != 'ADMINISTRADOR' THEN
        RAISE EXCEPTION 'Operación denegada. Solo administradores pueden asignar viajes.';
    END IF;

    -- Validar estado del pedido
    SELECT cliente_id INTO v_cliente_id FROM public.pedidos WHERE id = p_pedido_id AND estado = 'PENDIENTE';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido no existe o ya ha sido asignado/cancelado.';
    END IF;

    -- Crear el viaje de forma atómica
    INSERT INTO public.viajes (pedido_id, vehiculo_id, conductor_id, estado)
    VALUES (p_pedido_id, p_vehiculo_id, p_conductor_id, 'PENDIENTE')
    RETURNING id INTO v_viaje_id;

    -- Enlazar conductor al vehículo
    UPDATE public.vehiculos 
    SET conductor_id = p_conductor_id 
    WHERE id = p_vehiculo_id AND activo = TRUE;

    -- Actualizar estado del pedido
    UPDATE public.pedidos 
    SET estado = 'ASIGNADO' 
    WHERE id = p_pedido_id;

    RETURN v_viaje_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. TRANSACCIÓN: Registrar Ticket de Balanza (Conductor / Balancero)
CREATE OR REPLACE FUNCTION public.registrar_ticket_balanza(
    p_viaje_id UUID,
    p_peso_entrada NUMERIC,
    p_peso_salida NUMERIC,
    p_ticket_url TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_conductor_id UUID;
    v_rol public.rol_usuario;
BEGIN
    -- Obtener datos del viaje
    SELECT conductor_id INTO v_conductor_id FROM public.viajes WHERE id = p_viaje_id AND estado IN ('PENDIENTE', 'EN_CAMINO');
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Viaje no encontrado o en estado no apto para balanza.';
    END IF;

    -- Validar que el ejecutor sea el conductor asignado o el administrador
    SELECT public.obtener_rol_actual() INTO v_rol;
    IF v_rol != 'ADMINISTRADOR' AND auth.uid() != v_conductor_id THEN
        RAISE EXCEPTION 'Acceso no autorizado. No eres el conductor asignado a este viaje.';
    END IF;

    -- Actualizar atómicamente el pesaje y ticket del viaje
    UPDATE public.viajes
    SET peso_entrada_kg = p_peso_entrada,
        peso_salida_kg = p_peso_salida,
        ticket_balanza_url = p_ticket_url,
        estado = 'EN_BALANZA'
    WHERE id = p_viaje_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. TRANSACCIÓN: Confirmar Entrega en Obra (Conductor / Cliente)
CREATE OR REPLACE FUNCTION public.confirmar_entrega(
    p_viaje_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_pedido_id UUID;
    v_vehiculo_id UUID;
    v_conductor_id UUID;
    v_rol public.rol_usuario;
BEGIN
    -- Validar y obtener datos del viaje en balanza
    SELECT pedido_id, vehiculo_id, conductor_id INTO v_pedido_id, v_vehiculo_id, v_conductor_id 
    FROM public.viajes 
    WHERE id = p_viaje_id AND estado = 'EN_BALANZA';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El viaje no está registrado en balanza o ya ha sido entregado/cancelado.';
    END IF;

    -- Validar autorización (Conductor del viaje o Admin)
    SELECT public.obtener_rol_actual() INTO v_rol;
    IF v_rol != 'ADMINISTRADOR' AND auth.uid() != v_conductor_id THEN
        RAISE EXCEPTION 'Acceso no autorizado para confirmar la entrega de este viaje.';
    END IF;

    -- Registrar entrega del viaje
    UPDATE public.viajes
    SET estado = 'ENTREGADO',
        fecha_entrega = NOW()
    WHERE id = p_viaje_id;

    -- Actualizar estado del pedido final a entregado
    UPDATE public.pedidos
    SET estado = 'ENTREGADO'
    WHERE id = v_pedido_id;

    -- Liberar conductor del vehículo para futuros despachos
    UPDATE public.vehiculos
    SET conductor_id = NULL
    WHERE id = v_vehiculo_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
