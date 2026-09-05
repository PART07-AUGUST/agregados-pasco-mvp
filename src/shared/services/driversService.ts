import { supabase } from './supabase';
import type { ConductorDetallado, EstadoViaje } from '../types';

export interface CreateDriverPayload {
  email: string;
  password?: string;
  nombre: string;
  dni: string;
  celular: string;
  licenciaConducir?: string;
  vehiculoId?: string;
}

export interface UpdateDriverPayload {
  nombre?: string;
  dni?: string;
  celular?: string;
  licenciaConducir?: string;
  activo?: boolean;
  vehiculoId?: string | null;
}

interface RawUsuarioRow {
  id: string;
  email?: string | null;
  nombre: string;
  rol: string;
  dni?: string | null;
  celular?: string | null;
  ruc?: string | null;
  licencia_conducir?: string | null;
  activo?: boolean | null;
  created_at: string;
}

interface RawVehiculoRow {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  capacidad_m3: number | string;
  conductor_id: string | null;
}

interface RawViajeRow {
  id: string;
  conductor_id: string;
  estado: string;
  pedidos?: {
    destino: string | null;
    material: string | null;
  } | null;
}

export const driversService = {
  /**
   * Obtiene la lista completa de conductores con su volquete vinculado y viaje activo.
   */
  async getDrivers(): Promise<ConductorDetallado[]> {
    // 1. Obtener los usuarios con rol CONDUCTOR (con fallback resiliente si faltan columnas de migración)
    let usuarios: RawUsuarioRow[] = [];
    const { data: usuariosData, error: usuariosErr } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol, dni, celular, ruc, licencia_conducir, activo, created_at')
      .eq('rol', 'CONDUCTOR')
      .order('nombre', { ascending: true });

    if (usuariosErr) {
      console.warn('Columnas extendidas de conductor aún no migradas en Supabase, usando columnas base:', usuariosErr.message);
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('usuarios')
        .select('id, nombre, rol, dni, celular, ruc, created_at')
        .eq('rol', 'CONDUCTOR')
        .order('nombre', { ascending: true });

      if (fallbackErr) {
        console.error('Error cargando conductores base:', fallbackErr);
        return [];
      }
      usuarios = (fallbackData || []) as unknown as RawUsuarioRow[];
    } else {
      usuarios = (usuariosData || []) as unknown as RawUsuarioRow[];
    }

    if (usuarios.length === 0) return [];

    // 2. Obtener vehículos asignados y viajes activos en paralelo
    const [{ data: vehiculosData }, { data: viajesData }] = await Promise.all([
      supabase.from('vehiculos').select('id, placa, marca, modelo, capacidad_m3, conductor_id'),
      supabase
        .from('viajes')
        .select('id, conductor_id, estado, pedidos:pedido_id ( destino, material )')
        .in('estado', ['PENDIENTE', 'EN_CAMINO', 'EN_BALANZA']),
    ]);

    const vehiculos = (vehiculosData || []) as unknown as RawVehiculoRow[];
    const viajes = (viajesData || []) as unknown as RawViajeRow[];

    const vehicleMap = new Map<string, RawVehiculoRow>();
    vehiculos.forEach((v) => {
      if (v.conductor_id) {
        vehicleMap.set(v.conductor_id, v);
      }
    });

    const activeTripMap = new Map<string, RawViajeRow>();
    viajes.forEach((t) => {
      if (t.conductor_id) {
        activeTripMap.set(t.conductor_id, t);
      }
    });

    return usuarios.map((u) => {
      const v = vehicleMap.get(u.id);
      const t = activeTripMap.get(u.id);

      return {
        id: u.id,
        email: u.email || '',
        nombre: u.nombre,
        rol: 'CONDUCTOR',
        dni: u.dni || undefined,
        celular: u.celular || undefined,
        ruc: u.ruc || undefined,
        licenciaConducir: u.licencia_conducir || undefined,
        activo: u.activo !== false, // Por defecto true si no está especificado
        createdAt: u.created_at,
        vehiculoAsignado: v
          ? {
              id: v.id,
              placa: v.placa,
              marca: v.marca,
              modelo: v.modelo,
              capacidadM3: Number(v.capacidad_m3),
            }
          : undefined,
        viajeActivo: t
          ? {
              id: t.id,
              estado: t.estado as EstadoViaje,
              destino: t.pedidos?.destino || undefined,
              material: t.pedidos?.material || undefined,
            }
          : undefined,
      };
    });
  },

  /**
   * Crea un nuevo conductor invocando la función RPC de PostgreSQL con privilegios administradores.
   */
  async createDriver(payload: CreateDriverPayload): Promise<void> {
    const password = payload.password || `Pasco${payload.dni}!`; // Contraseña provisional robusta

    const { error } = await supabase.rpc('admin_crear_conductor', {
      p_email: payload.email.trim(),
      p_password: password,
      p_nombre: payload.nombre.trim(),
      p_dni: payload.dni.trim(),
      p_celular: payload.celular.trim(),
      p_licencia: payload.licenciaConducir?.trim() || null,
      p_vehiculo_id: payload.vehiculoId || null,
    });

    if (error) {
      throw error;
    }
  },

  /**
   * Actualiza los datos operativos de un conductor y su asignación vehicular.
   */
  async updateDriver(id: string, payload: UpdateDriverPayload): Promise<void> {
    const updates: Record<string, unknown> = {};

    if (payload.nombre !== undefined) updates.nombre = payload.nombre.trim();
    if (payload.dni !== undefined) updates.dni = payload.dni.trim();
    if (payload.celular !== undefined) updates.celular = payload.celular.trim();
    if (payload.licenciaConducir !== undefined) updates.licencia_conducir = payload.licenciaConducir.trim();
    if (payload.activo !== undefined) updates.activo = payload.activo;

    if (Object.keys(updates).length > 0) {
      const { error: userErr } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', id);

      if (userErr) throw userErr;
    }

    // Gestión de vehículo asignado
    if (payload.vehiculoId !== undefined) {
      // 1. Quitar conductor de vehículos anteriores
      await supabase
        .from('vehiculos')
        .update({ conductor_id: null })
        .eq('conductor_id', id);

      // 2. Si se especificó un nuevo vehículo, asignarlo
      if (payload.vehiculoId) {
        const { error: vErr } = await supabase
          .from('vehiculos')
          .update({ conductor_id: id })
          .eq('id', payload.vehiculoId);

        if (vErr) throw vErr;
      }
    }
  },

  /**
   * Cambia el estado activo/inactivo (disponibilidad operativa) de un conductor.
   */
  async toggleDriverStatus(id: string, activo: boolean): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo })
      .eq('id', id);

    if (error) throw error;
  },
};
