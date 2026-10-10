import type { AgentRole } from '../../../features/admin/agents/types';

export interface TrazaCopilotApiDto {
  paso: number;
  pensamiento: string;
  herramienta: string;
  parametros: Record<string, unknown>;
  resultado: unknown;
}

export interface TurnoConversacionDto {
  rol: 'user' | 'model' | 'assistant';
  contenido: string;
}

export interface CrearConsultaCopilotRequestDto {
  mensaje: string;
  historial?: TurnoConversacionDto[];
  rol_forzado?: AgentRole;
}

export interface ConsultaCopilotResponseDto {
  id: string;
  rol: AgentRole;
  nombre_agente: string;
  respuesta: string;
  trazas: TrazaCopilotApiDto[];
  llamadas_llm: number;
  creado_en: string;
}

export interface FiltrosConsultaCopilotDto {
  page?: number;
  page_size?: number;
  rol?: AgentRole;
  fecha_desde?: string;
  fecha_hasta?: string;
}
