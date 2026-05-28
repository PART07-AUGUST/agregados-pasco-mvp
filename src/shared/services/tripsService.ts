import { supabase } from './supabase';
import type { Viaje } from '../types';
import { offlineDb } from './offlineDb';

interface TripOrderRow {
  material: string | null;
  volumen_m3: number | string | null;
  destino: string | null;
  usuarios?: Array<{
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
  pedidos?: TripOrderRow[] | null;
  vehiculos?: TripVehicleRow[] | null;
  usuarios?: TripDriverRow[] | null;
}

export interface ViajeDetallado extends Viaje {
  clienteNombre?: string;
  material?: string;
  volumenM3?: number;
  destino?: string;
  placa?: string;
  conductorNombre?: string;
}

function mapTripRow(t: TripRow): ViajeDetallado {
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
    material: t.pedidos?.[0]?.material ?? undefined,
    volumenM3: t.pedidos?.[0]?.volumen_m3 ? Number(t.pedidos[0].volumen_m3) : undefined,
    destino: t.pedidos?.[0]?.destino ?? undefined,
    clienteNombre: t.pedidos?.[0]?.usuarios?.[0]?.nombre ?? undefined,
    placa: t.vehiculos?.[0]?.placa ?? undefined,
    conductorNombre: t.usuarios?.[0]?.nombre ?? undefined,
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
      const { error } = await supabase
        .from('viajes')
        .update({ estado })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error: unknown) {
      console.warn('Error de red al actualizar estado, guardando en cola offline:', error);
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
