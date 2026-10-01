export type UserRole = 'ADMINISTRADOR' | 'CONDUCTOR' | 'CLIENTE';

/**
 * Entidad base de dominio con identificador único y auditoría temporal.
 */
export interface BaseEntity {
  id: string;
  createdAt?: string;
}

export interface User extends BaseEntity {
  email: string;
  nombre: string;
  rol: UserRole;
  celular?: string;
  dni?: string;
  ruc?: string;
  licenciaConducir?: string;
  activo?: boolean;
  requiereCambioPassword?: boolean;
}

export interface ConductorDetallado extends User {
  vehiculoAsignado?: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    capacidadM3: number;
  };
  viajeActivo?: {
    id: string;
    estado: EstadoViaje;
    destino?: string;
    material?: string;
  };
}

export interface Vehiculo extends BaseEntity {
  placa: string;
  marca: string;
  modelo: string;
  capacidadM3: number;
  conductorId?: string;
  activo: boolean;
}

export type EstadoViaje = 'PENDIENTE' | 'EN_CAMINO' | 'EN_BALANZA' | 'ENTREGADO' | 'CANCELADO';

export interface Viaje extends BaseEntity {
  pedidoId: string;
  vehiculoId: string;
  conductorId: string;
  estado: EstadoViaje;
  pesoEntradaKg?: number;
  pesoSalidaKg?: number;
  ticketBalanzaUrl?: string;
  fechaAsignacion: string;
  fechaEntrega?: string;
  distanciaKm?: number;
  desnivelMetros?: number;
  canteraOrigen?: string;
  consumoDieselEstimado?: number;
  consumoDieselReal?: number;
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
