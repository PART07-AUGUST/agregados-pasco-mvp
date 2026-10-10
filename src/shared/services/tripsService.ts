import { apiClient } from './apiClient';
import { supabase } from './supabase';
import type { Viaje } from '../types';
import { offlineDb } from './offlineDb';
import { viajeMapper } from '../mappers/viajeMapper';
import type { PageResponse } from '../types/api/pageResponse';
import type { ViajeResponseDto } from '../types/api/viajeDto';

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

interface PedidoRowEnrichment {
  id: string;
  material: string | null;
  volumen_m3: number | string | null;
  destino: string | null;
  usuarios?: { nombre: string | null } | Array<{ nombre: string | null }> | null;
}

interface VehiculoRowEnrichment {
  id: string;
  placa: string;
}

interface ConductorRowEnrichment {
  id: string;
  nombre: string;
}

interface SupabaseTripRow {
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
  pedidos?: PedidoRowEnrichment | PedidoRowEnrichment[] | null;
  vehiculos?: { placa: string | null } | Array<{ placa: string | null }> | null;
  usuarios?: { nombre: string | null } | Array<{ nombre: string | null }> | null;
}

async function fetchEnrichmentData() {
  try {
    const [ordersResult, vehiclesResult, driversResult] = await Promise.all([
      supabase
        .from('pedidos')
        .select('id, material, volumen_m3, destino, usuarios:cliente_id (nombre)'),
      supabase
        .from('vehiculos')
        .select('id, placa'),
      supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('rol', 'CONDUCTOR'),
    ]);

    return {
      orders: (ordersResult.data || []) as unknown as PedidoRowEnrichment[],
      vehicles: (vehiclesResult.data || []) as unknown as VehiculoRowEnrichment[],
      drivers: (driversResult.data || []) as unknown as ConductorRowEnrichment[],
    };
  } catch {
    return {
      orders: [] as PedidoRowEnrichment[],
      vehicles: [] as VehiculoRowEnrichment[],
      drivers: [] as ConductorRowEnrichment[],
    };
  }
}

export const tripsService = {
  async getTrips(): Promise<ViajeDetallado[]> {
    const [tripsPage, enrichment] = await Promise.all([
      apiClient.get<PageResponse<ViajeResponseDto>>('/viajes?page=1&page_size=100'),
      fetchEnrichmentData(),
    ]);

    const orderMap = new Map<string, { material?: string; volumenM3?: number; destino?: string; clienteNombre?: string }>();
    enrichment.orders.forEach((o) => {
      const clienteNombre = Array.isArray(o.usuarios)
        ? o.usuarios[0]?.nombre ?? undefined
        : o.usuarios?.nombre ?? undefined;

      orderMap.set(o.id, {
        material: o.material ?? undefined,
        volumenM3: o.volumen_m3 != null ? Number(o.volumen_m3) : undefined,
        destino: o.destino ?? undefined,
        clienteNombre,
      });
    });

    const vehicleMap = new Map<string, string>();
    enrichment.vehicles.forEach((v) => {
      vehicleMap.set(v.id, v.placa);
    });

    const driverMap = new Map<string, string>();
    enrichment.drivers.forEach((d) => {
      driverMap.set(d.id, d.nombre);
    });

    return (tripsPage.items || []).map((dto: ViajeResponseDto) => {
      const orderInfo = orderMap.get(dto.pedido_id);
      const placa = vehicleMap.get(dto.vehiculo_id);
      const conductorNombre = driverMap.get(dto.conductor_id);

      return viajeMapper.toDomain(dto, {
        clienteNombre: orderInfo?.clienteNombre,
        material: orderInfo?.material,
        volumenM3: orderInfo?.volumenM3,
        destino: orderInfo?.destino,
        placa,
        conductorNombre,
      });
    });
  },

  async assignTrip(pedidoId: string, vehiculoId: string, conductorId: string): Promise<string> {
    const payload = viajeMapper.toCreateDto(pedidoId, vehiculoId, conductorId);
    const res = await apiClient.post<ViajeResponseDto>('/viajes', payload);
    return res.id;
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
          const t = data as unknown as SupabaseTripRow;
          const p = Array.isArray(t.pedidos) ? t.pedidos[0] : t.pedidos;
          const v = Array.isArray(t.vehiculos) ? t.vehiculos[0] : t.vehiculos;
          const clienteNombre = Array.isArray(p?.usuarios)
            ? p?.usuarios[0]?.nombre ?? undefined
            : p?.usuarios?.nombre ?? undefined;

          trip = {
            id: t.id,
            pedidoId: t.pedido_id,
            vehiculoId: t.vehiculo_id,
            conductorId: t.conductor_id,
            estado: t.estado,
            pesoEntradaKg: t.peso_entrada_kg != null ? Number(t.peso_entrada_kg) : undefined,
            pesoSalidaKg: t.peso_salida_kg != null ? Number(t.peso_salida_kg) : undefined,
            ticketBalanzaUrl: t.ticket_balanza_url || undefined,
            fechaAsignacion: t.fecha_asignacion,
            fechaEntrega: t.fecha_entrega || undefined,
            material: p?.material ?? undefined,
            volumenM3: p?.volumen_m3 != null ? Number(p.volumen_m3) : undefined,
            destino: p?.destino ?? undefined,
            clienteNombre,
            placa: v?.placa ?? undefined,
          };

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
    const hasBalanzaAction = tripActions.some((action) => action.type === 'REGISTRAR_BALANZA');
    const localPhoto = hasBalanzaAction ? await offlineDb.getPendingPhoto(trip.id) : null;

    for (const action of tripActions) {
      if (action.type === 'INICIAR_VIAJE') {
        trip.estado = 'EN_CAMINO';
        continue;
      }

      if (action.type === 'REGISTRAR_BALANZA') {
        trip.estado = 'EN_BALANZA';
        trip.pesoEntradaKg = action.payload.pesoEntrada;
        trip.pesoSalidaKg = action.payload.pesoSalida;
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

    await apiClient.patch<ViajeResponseDto>(`/viajes/${id}/estado`, { estado });
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
    ticketPath: string
  ): Promise<void> {
    await apiClient.post<ViajeResponseDto>(`/viajes/${viajeId}/balanza`, {
      peso_entrada_kg: pesoEntrada,
      peso_salida_kg: pesoSalida,
      ticket_balanza_url: ticketPath,
    });
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
    return this.updateTripState(viajeId, 'ENTREGADO');
  },

  async completeDeliveryOffline(viajeId: string): Promise<void> {
    await offlineDb.enqueueAction('CONFIRMAR_ENTREGA', viajeId);
  },
};
