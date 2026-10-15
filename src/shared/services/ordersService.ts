import { apiClient } from './apiClient';
import { supabase } from './supabase';
import { getSingleRelation } from '../utils/supabaseRelations';
import { pedidoMapper } from '../mappers/pedidoMapper';
import type { BaseEntity } from '../types';
import type { PageResponse } from '../types/api/pageResponse';
import type { PedidoResponseDto } from '../types/api/pedidoDto';

export interface Pedido extends BaseEntity {
  clienteId: string;
  material: 'ARENA_FINA' | 'ARENA_GRUESA' | 'PIEDRA_1_2' | 'PIEDRA_3_4' | 'AFIRMADO' | 'TIERRA_CHACRA';
  volumenM3: number;
  destino: string;
  estado: 'PENDIENTE' | 'ASIGNADO' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO';
  createdAt: string;
  distanciaKm?: number;
  desnivelMetros?: number;
  canteraOrigen?: string;
  clienteNombre?: string;
  vehiculoPlaca?: string;
  vehiculoMarca?: string;
  vehiculoModelo?: string;
  conductorNombre?: string;
  conductorCelular?: string;
}

interface ClienteRow {
  id: string;
  nombre: string | null;
}

interface ViajeEnrichmentRow {
  pedido_id: string;
  vehiculos?: {
    placa: string | null;
    marca: string | null;
    modelo: string | null;
  } | Array<{
    placa: string | null;
    marca: string | null;
    modelo: string | null;
  }> | null;
  usuarios?: {
    nombre: string | null;
    celular: string | null;
  } | Array<{
    nombre: string | null;
    celular: string | null;
  }> | null;
}

async function fetchEnrichmentData() {
  try {
    const [clientesResult, tripsResult] = await Promise.all([
      supabase.from('usuarios').select('id, nombre'),
      supabase
        .from('viajes')
        .select(`
          pedido_id,
          vehiculos:vehiculo_id (placa, marca, modelo),
          usuarios:conductor_id (nombre, celular)
        `),
    ]);

    return {
      clientes: (clientesResult.data || []) as ClienteRow[],
      viajes: (tripsResult.data || []) as unknown as ViajeEnrichmentRow[],
    };
  } catch {
    return {
      clientes: [] as ClienteRow[],
      viajes: [] as ViajeEnrichmentRow[],
    };
  }
}

export const ordersService = {
  async getOrders(): Promise<Pedido[]> {
    const [response, enrichment] = await Promise.all([
      apiClient.get<PageResponse<PedidoResponseDto>>('/pedidos?page=1&page_size=100'),
      fetchEnrichmentData(),
    ]);

    const clientMap = new Map<string, string>();
    enrichment.clientes.forEach((u) => {
      if (u.id && u.nombre) {
        clientMap.set(u.id, u.nombre);
      }
    });

    const tripMap = new Map<string, ViajeEnrichmentRow>();
    enrichment.viajes.forEach((v) => {
      if (v.pedido_id) {
        tripMap.set(v.pedido_id, v);
      }
    });

    return (response.items || []).map((dto: PedidoResponseDto) => {
      const trip = tripMap.get(dto.id);
      const vehiculo = trip ? getSingleRelation(trip.vehiculos) : undefined;
      const conductor = trip ? getSingleRelation(trip.usuarios) : undefined;

      return pedidoMapper.toDomain(dto, {
        clienteNombre: clientMap.get(dto.cliente_id) || 'Cliente Registrado',
        vehiculoPlaca: vehiculo?.placa || undefined,
        vehiculoMarca: vehiculo?.marca || undefined,
        vehiculoModelo: vehiculo?.modelo || undefined,
        conductorNombre: conductor?.nombre || undefined,
        conductorCelular: conductor?.celular || undefined,
      });
    });
  },

  async createOrder(order: Omit<Pedido, 'id' | 'createdAt' | 'estado'>): Promise<Pedido> {
    const payload = pedidoMapper.toCreateDto(order);
    const data = await apiClient.post<PedidoResponseDto>('/pedidos', payload);
    return pedidoMapper.toDomain(data);
  },

  async updateOrderState(id: string, estado: Pedido['estado']): Promise<void> {
    await apiClient.patch<PedidoResponseDto>(`/pedidos/${id}/estado`, { estado });
  },
};
