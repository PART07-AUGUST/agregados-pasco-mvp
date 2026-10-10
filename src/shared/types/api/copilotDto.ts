import type { AgentRole, ReActTraceStep } from '../../../features/admin/agents/types';

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
  trazas: ReActTraceStep[];
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
