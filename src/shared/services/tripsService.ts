import { supabase } from './supabase';
import type { Viaje } from '../types';
import { offlineDb } from './offlineDb';

export interface ViajeDetallado extends Viaje {
  clienteNombre?: string;
  material?: string;
  volumenM3?: number;
  destino?: string;
  placa?: string;
  conductorNombre?: string;
}

export const tripsService = {
  /**
   * Obtiene la lista completa de viajes detallados (para Administradores).
   */
  async getTrips(): Promise<ViajeDetallado[]> {
    const { data, error } = await supabase
      .from('viajes')
      .select(`
        *,
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

    return (data || []).map((t: any) => ({
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
      material: t.pedidos?.material,
      volumenM3: t.pedidos?.volumen_m3 ? Number(t.pedidos.volumen_m3) : undefined,
      destino: t.pedidos?.destino,
      clienteNombre: t.pedidos?.usuarios?.nombre,
      placa: t.vehiculos?.placa,
      conductorNombre: t.usuarios?.nombre
    }));
  },

  /**
   * Ejecuta la transacción RPC para asignar un viaje de forma atómica.
   * Modifica pedidos, vehículos y crea el viaje en Supabase de forma atómica.
   */
  async assignTrip(pedidoId: string, vehiculoId: string, conductorId: string): Promise<string> {
    const { data, error } = await supabase.rpc('asignar_viaje', {
      p_pedido_id: pedidoId,
      p_vehiculo_id: vehiculoId,
      p_conductor_id: conductorId
    });

    if (error) {
      console.error('Error al asignar viaje mediante RPC:', error);
      throw error;
    }

    return data as string;
  },

  /**
   * Obtiene el viaje actualmente activo asignado a un conductor específico.
   * Cuenta con soporte offline total y proyección de estado local (Event Sourcing).
   */
  async getDriverActiveTrip(conductorId: string): Promise<ViajeDetallado | null> {
    let trip: ViajeDetallado | null = null;

    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('viajes')
          .select(`
            *,
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
          .maybeSingle();

        if (error) throw error;

        if (data) {
          trip = {
            id: data.id,
            pedidoId: data.pedido_id,
            vehiculoId: data.vehiculo_id,
            conductorId: data.conductor_id,
            estado: data.estado,
            pesoEntradaKg: data.peso_entrada_kg ? Number(data.peso_entrada_kg) : undefined,
            pesoSalidaKg: data.peso_salida_kg ? Number(data.peso_salida_kg) : undefined,
            ticketBalanzaUrl: data.ticket_balanza_url || undefined,
            fechaAsignacion: data.fecha_asignacion,
            fechaEntrega: data.fecha_entrega || undefined,
            material: data.pedidos?.material,
            volumenM3: data.pedidos?.volumen_m3 ? Number(data.pedidos.volumen_m3) : undefined,
            destino: data.pedidos?.destino,
            clienteNombre: data.pedidos?.usuarios?.nombre,
            placa: data.vehiculos?.placa
          };
          // Guardar en la caché local para soporte offline
          await offlineDb.cacheActiveTrip(trip.id, trip);
        }
      } catch (netErr) {
        console.warn('Fallo al obtener viaje activo remoto, usando caché offline:', netErr);
        trip = await offlineDb.getCachedActiveTrip();
      }
    } else {
      trip = await offlineDb.getCachedActiveTrip();
    }

    if (!trip) return null;

    // --- PROYECCIÓN DE ESTADO LOCAL (EVENT SOURCING) ---
    const pendingActions = await offlineDb.getPendingActions();
    const tripActions = pendingActions.filter(a => a.viajeId === trip!.id);

    for (const action of tripActions) {
      if (action.type === 'INICIAR_VIAJE') {
        trip.estado = 'EN_CAMINO';
      } else if (action.type === 'REGISTRAR_BALANZA') {
        trip.estado = 'EN_BALANZA';
        trip.pesoEntradaKg = action.payload.pesoEntrada;
        trip.pesoSalidaKg = action.payload.pesoSalida;
        
        // Obtener el blob de foto guardado localmente si existe
        const localPhoto = await offlineDb.getPendingPhoto(trip.id);
        if (localPhoto) {
          trip.ticketBalanzaUrl = URL.createObjectURL(localPhoto);
        } else {
          trip.ticketBalanzaUrl = 'local://offline_ticket_image';
        }
      } else if (action.type === 'CONFIRMAR_ENTREGA') {
        trip.estado = 'ENTREGADO';
      }
    }

    // Si la proyección determinó que el viaje ya se completó offline, no lo mostramos como activo
    if (trip.estado === 'ENTREGADO' || trip.estado === 'CANCELADO') {
      return null;
    }

    return trip;
  },

  /**
   * Actualiza el estado simple de un viaje (por ejemplo, cambiar de PENDIENTE a EN_CAMINO).
   */
  async updateTripState(id: string, estado: Viaje['estado']): Promise<void> {
    if (!navigator.onLine) {
      return this.updateTripStateOffline(id, estado);
    }

    try {
      const { error } = await supabase
        .from('viajes')
        .update({ estado })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.warn('Error de red al actualizar estado, guardando en cola offline:', err);
      return this.updateTripStateOffline(id, estado);
    }
  },

  /**
   * Guarda de forma offline el inicio de viaje.
   */
  async updateTripStateOffline(id: string, estado: Viaje['estado']): Promise<void> {
    if (estado === 'EN_CAMINO') {
      await offlineDb.enqueueAction('INICIAR_VIAJE', id);
    } else if (estado === 'ENTREGADO') {
      await offlineDb.enqueueAction('CONFIRMAR_ENTREGA', id);
    } else {
      throw new Error(`Estado ${estado} no soportado en cola offline simple.`);
    }
  },

  /**
   * Invoca el procedimiento RPC registrar_ticket_balanza de forma remota.
   */
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
      p_ticket_url: ticketUrl
    });

    if (error) {
      console.error('Error en RPC registrar_ticket_balanza:', error);
      throw error;
    }
  },

  /**
   * Guarda de forma offline los pesajes de balanza y la imagen binaria asociada.
   */
  async registerWeighingOffline(
    viajeId: string, 
    pesoEntrada: number, 
    pesoSalida: number, 
    file: File
  ): Promise<void> {
    // 1. Guardar la foto de forma binaria nativa en IndexedDB
    await offlineDb.savePendingPhoto(viajeId, file);
    
    // 2. Encolar la acción de pesaje con su carga útil en IndexedDB
    await offlineDb.enqueueAction('REGISTRAR_BALANZA', viajeId, {
      pesoEntrada,
      pesoSalida
    });
  },

  /**
   * Invoca el procedimiento RPC confirmar_entrega para marcar como entregado de forma remota.
   */
  async completeDelivery(viajeId: string): Promise<void> {
    if (!navigator.onLine) {
      return this.completeDeliveryOffline(viajeId);
    }

    try {
      const { error } = await supabase.rpc('confirmar_entrega', {
        p_viaje_id: viajeId
      });

      if (error) throw error;
    } catch (err) {
      console.warn('Error de red al confirmar entrega, guardando en cola offline:', err);
      return this.completeDeliveryOffline(viajeId);
    }
  },

  /**
   * Guarda de forma offline la confirmación de entrega en obra.
   */
  async completeDeliveryOffline(viajeId: string): Promise<void> {
    await offlineDb.enqueueAction('CONFIRMAR_ENTREGA', viajeId);
  }
};
