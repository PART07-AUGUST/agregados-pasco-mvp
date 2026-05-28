export type UserRole = 'ADMINISTRADOR' | 'CONDUCTOR' | 'CLIENTE';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  celular?: string;
  dni?: string;
  ruc?: string;
  createdAt: string;
}

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  capacidadM3: number;
  conductorId?: string;
  activo: boolean;
}

export type EstadoViaje = 'PENDIENTE' | 'EN_CAMINO' | 'EN_BALANZA' | 'ENTREGADO' | 'CANCELADO';

export interface Viaje {
  id: string;
  pedidoId: string;
  vehiculoId: string;
  conductorId: string;
  estado: EstadoViaje;
  pesoEntradaKg?: number;
  pesoSalidaKg?: number;
  ticketBalanzaUrl?: string;
  fechaAsignacion: string;
  fechaEntrega?: string;
}

export interface OfflineWeighingPayload {
  pesoEntrada: number;
  pesoSalida: number;
}

export type OfflineAction =
  | {
      id?: number;
      type: 'INICIAR_VIAJE';
      viajeId: string;
      payload: Record<string, never>;
      timestamp: number;
    }
  | {
      id?: number;
      type: 'REGISTRAR_BALANZA';
      viajeId: string;
      payload: OfflineWeighingPayload;
      timestamp: number;
    }
  | {
      id?: number;
      type: 'CONFIRMAR_ENTREGA';
      viajeId: string;
      payload: Record<string, never>;
      timestamp: number;
    };
