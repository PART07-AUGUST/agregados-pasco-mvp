import type { Pedido } from '../services/ordersService';
import type {
  PedidoResponseDto,
  PedidoCreateDto,
} from '../types/api/pedidoDto';

export const pedidoMapper = {
  toDomain(
    dto: PedidoResponseDto,
    extra?: {
      clienteNombre?: string;
      vehiculoPlaca?: string;
      vehiculoMarca?: string;
      vehiculoModelo?: string;
      conductorNombre?: string;
      conductorCelular?: string;
    }
  ): Pedido {
    return {
      id: dto.id,
      clienteId: dto.cliente_id,
      material: dto.material as Pedido['material'],
      volumenM3: Number(dto.volumen_m3),
      destino: dto.destino,
      estado: dto.estado as Pedido['estado'],
      createdAt: dto.created_at,
      distanciaKm: dto.distancia_km != null ? Number(dto.distancia_km) : undefined,
      desnivelMetros: dto.desnivel_metros != null ? Number(dto.desnivel_metros) : undefined,
      canteraOrigen: dto.cantera_origen ?? undefined,
      clienteNombre: extra?.clienteNombre,
      vehiculoPlaca: extra?.vehiculoPlaca,
      vehiculoMarca: extra?.vehiculoMarca,
      vehiculoModelo: extra?.vehiculoModelo,
      conductorNombre: extra?.conductorNombre,
      conductorCelular: extra?.conductorCelular,
    };
  },

  toCreateDto(domain: Omit<Pedido, 'id' | 'createdAt' | 'estado'>): PedidoCreateDto {
    return {
      cliente_id: domain.clienteId,
      material: domain.material,
      volumen_m3: domain.volumenM3,
      destino: domain.destino.trim(),
      distancia_km: domain.distanciaKm ?? null,
      desnivel_metros: domain.desnivelMetros ?? null,
      cantera_origen: domain.canteraOrigen ?? null,
    };
  },
};
