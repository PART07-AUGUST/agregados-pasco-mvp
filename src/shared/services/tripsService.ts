import { supabase } from './supabase';
import type { Viaje } from '../types';
import { offlineDb } from './offlineDb';
import { getSingleRelation, getJoinedNombre } from '../utils/supabaseRelations';

interface TripOrderRow {
  material: string | null;
  volumen_m3: number | string | null;
  destino: string | null;
  usuarios?: {
    nombre: string | null;
  } | Array<{
    nombre: string | null;
  }> | null;
}

interface TripVehicleRow {
  placa: string | null;
}

interface TripDriverRow {
  nombre: string | null;
}

interface TripRow {
  id: string;
  pedido_id: string;
  vehiculo_id: string;
  conductor_id: string;
  estado: Viaje['estado'];
  peso_entrada_kg: number | string | null;
  peso_salida_kg: number | string | null;
  ticket_balanza_url: string | null;
  fecha_asignacion: string;
  fecha_entrega: string | null;
  distancia_km?: number | string | null;
  desnivel_metros?: number | string | null;
  cantera_origen?: string | null;
  consumo_diesel_estimado?: number | string | null;
  consumo_diesel_real?: number | string | null;
  pedidos?: TripOrderRow | TripOrderRow[] | null;
  vehiculos?: TripVehicleRow | TripVehicleRow[] | null;
  usuarios?: TripDriverRow | TripDriverRow[] | null;
}

export interface ViajeDetallado extends Viaje {
  clienteNombre?: string;
  material?: string;
  volumenM3?: number;
  destino?: string;
  placa?: string;
  conductorNombre?: string;
}

export interface VehiculoDespachoOption {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  capacidadM3: number;
}

export interface ConductorDespachoOption {
  id: string;
  nombre: string;
  dni: string;
}

export interface DispatchResources {
  vehiculos: VehiculoDespachoOption[];
  conductores: ConductorDespachoOption[];
}

function mapTripRow(t: TripRow): ViajeDetallado {
  const pedido = getSingleRelation(t.pedidos);
  const vehiculo = getSingleRelation(t.vehiculos);
  const conductor = getSingleRelation(t.usuarios);

  return {
    id: t.id,
    pedidoId: t.pedido_id,
    vehiculoId: t.vehiculo_id,
    conductorId: t.conductor_id,
    estado: t.estado,
    pesoEntradaKg: t.peso_entrada_kg ? Number(t.peso_entrada_kg) : undefined,
    pesoSalidaKg: t.peso_salida_kg ? Number(t.peso_salida_kg) : undefined,
    ticketBalanzaUrl: t.ticket_balanza_url || undefined,
    fechaAsignacion: t.fecha_asignacion,
    fechaEntrega: t.fecha_entrega || undefined,
    distanciaKm: t.distancia_km != null ? Number(t.distancia_km) : undefined,
    desnivelMetros: t.desnivel_metros != null ? Number(t.desnivel_metros) : undefined,
    canteraOrigen: t.cantera_origen ?? undefined,
    consumoDieselEstimado: t.consumo_diesel_estimado != null ? Number(t.consumo_diesel_estimado) : undefined,
    consumoDieselReal: t.consumo_diesel_real != null ? Number(t.consumo_diesel_real) : undefined,
    material: pedido?.material ?? undefined,
    volumenM3: pedido?.volumen_m3 ? Number(pedido.volumen_m3) : undefined,
    destino: pedido?.destino ?? undefined,
    clienteNombre: getJoinedNombre(pedido?.usuarios) || undefined,
    placa: vehiculo?.placa ?? undefined,
    conductorNombre: conductor?.nombre ?? undefined,
  };
}

export const tripsService = {
  async getTrips(): Promise<ViajeDetallado[]> {
    const { data, error } = await supabase
      .from('viajes')
      .select(`
        id,
        pedido_id,
        vehiculo_id,
        conductor_id,
        estado,
        peso_entrada_kg,
        peso_salida_kg,
        ticket_balanza_url,
        fecha_asignacion,
        fecha_entrega,
        distancia_km,
        desnivel_metros,
        cantera_origen,
        consumo_diesel_estimado,
        consumo_diesel_real,
        pedidos:pedido_id (
          material,
          volumen_m3,
          destino,
          usuarios:cliente_id (
            nombre
          )
        ),
        vehiculos:vehiculo_id (
          placa
        ),
        usuarios:conductor_id (
          nombre
        )
      `)
      .order('fecha_asignacion', { ascending: false });

    if (error) {
      console.error('Error al obtener viajes:', error);
      throw error;
    }

    return (data as TripRow[] | null)?.map(mapTripRow) ?? [];
  },


  async assignTrip(pedidoId: string, vehiculoId: string, conductorId: string): Promise<string> {
    const { data, error } = await supabase.rpc('asignar_viaje', {
      p_pedido_id: pedidoId,
      p_vehiculo_id: vehiculoId,
      p_conductor_id: conductorId,
    });

    if (error) {
      console.error('Error al asignar viaje mediante RPC:', error);
      throw error;
    }

    return data as string;
  },

  async getAvailableDispatchResources(): Promise<DispatchResources> {
    const [{ data: vData, error: vErr }, { data: cData, error: cErr }, { data: activeTrips, error: activeErr }] =
      await Promise.all([
        supabase.from('vehiculos').select('id, placa, marca, modelo, capacidad_m3').eq('activo', true).order('placa', { ascending: true }),
        supabase.from('usuarios').select('id, nombre, dni').eq('rol', 'CONDUCTOR').order('nombre', { ascending: true }),
        supabase.from('viajes').select('vehiculo_id, conductor_id').in('estado', ['PENDIENTE', 'EN_CAMINO', 'EN_BALANZA']),
      ]);

    if (vErr) throw vErr;
    if (cErr) throw cErr;
    if (activeErr) throw activeErr;

    interface ActiveTripRow {
      vehiculo_id: string;
      conductor_id: string;
    }

    const activeVehicleIds = new Set((activeTrips as ActiveTripRow[] | null)?.map((trip) => trip.vehiculo_id) ?? []);
    const activeDriverIds = new Set((activeTrips as ActiveTripRow[] | null)?.map((trip) => trip.conductor_id) ?? []);

    const vehiculos: VehiculoDespachoOption[] = (
      (vData as Array<{ id: string; placa: string; marca: string; modelo: string; capacidad_m3: number | string }> | null) ?? []
    )
      .filter((vehicle) => !activeVehicleIds.has(vehicle.id))
      .map((vehicle) => ({
        id: vehicle.id,
        placa: vehicle.placa,
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        capacidadM3: Number(vehicle.capacidad_m3),
      }));

    const conductores: ConductorDespachoOption[] = (
      (cData as ConductorDespachoOption[] | null) ?? []
    ).filter((driver) => !activeDriverIds.has(driver.id));

    return { vehiculos, conductores };
  },

  async getDriverActiveTrip(conductorId: string): Promise<ViajeDetallado | null> {
    let trip: ViajeDetallado | null = null;

    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('viajes')
          .select(`
            id,
            pedido_id,
            vehiculo_id,
            conductor_id,
            estado,
            peso_entrada_kg,
            peso_salida_kg,
            ticket_balanza_url,
            fecha_asignacion,
            fecha_entrega,
            pedidos:pedido_id (
              material,
              volumen_m3,
              destino,
              usuarios:cliente_id (
                nombre
              )
            ),
            vehiculos:vehiculo_id (
              placa
            )
          `)
          .eq('conductor_id', conductorId)
          .in('estado', ['PENDIENTE', 'EN_CAMINO', 'EN_BALANZA'])
          .order('fecha_asignacion', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          trip = mapTripRow(data as TripRow);
          await offlineDb.cacheActiveTrip(conductorId, trip.id, trip);
        }
      } catch (networkError: unknown) {
        console.warn('Fallo al obtener viaje activo remoto, usando caché offline:', networkError);
        trip = await offlineDb.getCachedActiveTrip(conductorId);
      }
    } else {
      trip = await offlineDb.getCachedActiveTrip(conductorId);
    }

    if (!trip) {
      return null;
    }

    const pendingActions = await offlineDb.getPendingActions();
    const tripActions = pendingActions.filter((action) => action.viajeId === trip.id);

    for (const action of tripActions) {
      if (action.type === 'INICIAR_VIAJE') {
        trip.estado = 'EN_CAMINO';
        continue;
      }

      if (action.type === 'REGISTRAR_BALANZA') {
        trip.estado = 'EN_BALANZA';
        trip.pesoEntradaKg = action.payload.pesoEntrada;
        trip.pesoSalidaKg = action.payload.pesoSalida;

        const localPhoto = await offlineDb.getPendingPhoto(trip.id);
        trip.ticketBalanzaUrl = localPhoto ? URL.createObjectURL(localPhoto) : undefined;
        continue;
      }

      trip.estado = 'ENTREGADO';
    }

    if (trip.estado === 'ENTREGADO' || trip.estado === 'CANCELADO') {
      return null;
    }

    return trip;
  },

  async updateTripState(id: string, estado: Viaje['estado']): Promise<void> {
    if (!navigator.onLine) {
      return this.updateTripStateOffline(id, estado);
    }

    try {
      if (estado === 'EN_CAMINO') {
        const { error } = await supabase.rpc('iniciar_viaje', { p_viaje_id: id });
        if (error) {
          throw error;
        }
        return;
      }

      if (estado === 'ENTREGADO') {
        const { error } = await supabase.rpc('confirmar_entrega', { p_viaje_id: id });
        if (error) {
          throw error;
        }
        return;
      }

      const { error } = await supabase
        .from('viajes')
        .update({ estado })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      console.warn('Error al actualizar estado, aplicando fallback en cola offline:', error);
      return this.updateTripStateOffline(id, estado);
    }
  },

  async updateTripStateOffline(id: string, estado: Viaje['estado']): Promise<void> {
    if (estado === 'EN_CAMINO') {
      await offlineDb.enqueueAction('INICIAR_VIAJE', id);
      return;
    }

    if (estado === 'ENTREGADO') {
      await offlineDb.enqueueAction('CONFIRMAR_ENTREGA', id);
      return;
    }

    throw new Error(`Estado ${estado} no soportado en cola offline simple.`);
  },

  async registerWeighing(
    viajeId: string,
    pesoEntrada: number,
    pesoSalida: number,
    ticketUrl: string
  ): Promise<void> {
    const { error } = await supabase.rpc('registrar_ticket_balanza', {
      p_viaje_id: viajeId,
      p_peso_entrada: pesoEntrada,
      p_peso_salida: pesoSalida,
      p_ticket_url: ticketUrl,
    });

    if (error) {
      console.error('Error en RPC registrar_ticket_balanza:', error);
      throw error;
    }
  },

  async registerWeighingOffline(
    viajeId: string,
    pesoEntrada: number,
    pesoSalida: number,
    file: File
  ): Promise<void> {
    await offlineDb.savePendingPhoto(viajeId, file);
    await offlineDb.enqueueAction('REGISTRAR_BALANZA', viajeId, {
      pesoEntrada,
      pesoSalida,
    });
  },

  async completeDelivery(viajeId: string): Promise<void> {
    if (!navigator.onLine) {
      return this.completeDeliveryOffline(viajeId);
    }

    try {
      const { error } = await supabase.rpc('confirmar_entrega', {
        p_viaje_id: viajeId,
      });

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      console.warn('Error de red al confirmar entrega, guardando en cola offline:', error);
      return this.completeDeliveryOffline(viajeId);
    }
  },

  async completeDeliveryOffline(viajeId: string): Promise<void> {
    await offlineDb.enqueueAction('CONFIRMAR_ENTREGA', viajeId);
  },
};
