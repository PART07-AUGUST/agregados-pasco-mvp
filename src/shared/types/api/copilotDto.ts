import type { AgentRole } from '../../../features/admin/agents/types';

export interface TrazaCopilotApiDto {
  paso: number;
  pensamiento: string;
  herramienta: string;
  parametros: Record<string, unknown>;
  resultado: unknown;
  agente?: AgentRole;
  estado?: 'EXITOSO' | 'ERROR_CONTROLADO';
}

export interface TurnoConversacionDto {
  rol: 'user' | 'model' | 'assistant';
  contenido: string;
}

export interface TramoRutaCombustibleDto {
  cantera: string;
  destino: string;
  distancia_km: number;
  desnivel_metros: number;
  peso_carga_ton: number;
  proveedor_ruta: 'google_maps' | 'graphhopper';
}

export interface ContextoRutaCombustibleDto {
  tramos: TramoRutaCombustibleDto[];
  ida_y_vuelta: boolean;
  carga_asumida: boolean;
  calcular_combustible: boolean;
}

export interface CrearConsultaCopilotRequestDto {
  mensaje: string;
  historial?: TurnoConversacionDto[];
  rol_forzado?: AgentRole;
  contexto_ruta?: ContextoRutaCombustibleDto;
}

export interface ConsultaCopilotResponseDto {
  id: string;
  rol: AgentRole;
  nombre_agente: string;
  respuesta: string;
  trazas: TrazaCopilotApiDto[];
  llamadas_llm: number;
  agentes_participantes?: AgentRole[];
  creado_en: string;
}

export interface FiltrosConsultaCopilotDto {
  page?: number;
  page_size?: number;
  rol?: AgentRole;
  fecha_desde?: string;
  fecha_hasta?: string;
}
