import type { EstadoViaje } from '../types';
import type { ViajeDetallado } from '../services/tripsService';
import type {
  ViajeResponseDto,
  ViajeCreateDto,
  ViajeUpdateDto,
} from '../types/api/viajeDto';

export const viajeMapper = {
  toDomain(
    dto: ViajeResponseDto,
    extra?: {
      clienteNombre?: string;
      material?: string;
      volumenM3?: number;
      destino?: string;
      placa?: string;
      conductorNombre?: string;
    }
  ): ViajeDetallado {
    return {
      id: dto.id,
      pedidoId: dto.pedido_id,
      vehiculoId: dto.vehiculo_id,
      conductorId: dto.conductor_id,
      estado: dto.estado as EstadoViaje,
      pesoEntradaKg: dto.peso_entrada_kg != null ? Number(dto.peso_entrada_kg) : undefined,
      pesoSalidaKg: dto.peso_salida_kg != null ? Number(dto.peso_salida_kg) : undefined,
      ticketBalanzaUrl: dto.ticket_balanza_url || undefined,
      fechaAsignacion: dto.fecha_asignacion,
      fechaEntrega: dto.fecha_entrega || undefined,
      distanciaKm: dto.distancia_km != null ? Number(dto.distancia_km) : undefined,
      desnivelMetros: dto.desnivel_metros != null ? Number(dto.desnivel_metros) : undefined,
      canteraOrigen: dto.cantera_origen ?? undefined,
      volumenCargaEstimadoM3:
        dto.volumen_carga_estimado_m3 != null
          ? Number(dto.volumen_carga_estimado_m3)
          : undefined,
      consumoDieselEstimado:
        dto.consumo_diesel_estimado != null ? Number(dto.consumo_diesel_estimado) : undefined,
      costoDieselEstimadoSoles:
        dto.costo_diesel_estimado_pen != null
          ? Number(dto.costo_diesel_estimado_pen)
          : undefined,
      precioGalonAplicadoSoles:
        dto.precio_galon_aplicado_pen != null
          ? Number(dto.precio_galon_aplicado_pen)
          : undefined,
      modeloMlVersion: dto.ml_modelo_version ?? undefined,
      consumoDieselReal:
        dto.consumo_diesel_real != null ? Number(dto.consumo_diesel_real) : undefined,
      clienteNombre: extra?.clienteNombre,
      material: extra?.material,
      volumenM3: extra?.volumenM3,
      destino: extra?.destino,
      placa: extra?.placa,
      conductorNombre: extra?.conductorNombre,
    };
  },

  toCreateDto(
    pedidoId: string,
    vehiculoId: string,
    conductorId: string,
    route?: {
      distanciaKm?: number;
      desnivelMetros?: number;
      canteraOrigen?: string;
    }
  ): ViajeCreateDto {
    return {
      pedido_id: pedidoId,
      vehiculo_id: vehiculoId,
      conductor_id: conductorId,
      distancia_km: route?.distanciaKm ?? null,
      desnivel_metros: route?.desnivelMetros ?? null,
      cantera_origen: route?.canteraOrigen ?? null,
    };
  },

  toUpdateWeighingDto(
    pesoEntrada: number,
    pesoSalida: number,
    ticketUrl?: string
  ): ViajeUpdateDto {
    return {
      estado: 'EN_BALANZA',
      peso_entrada_kg: pesoEntrada,
      peso_salida_kg: pesoSalida,
      ticket_balanza_url: ticketUrl || null,
    };
  },
};
