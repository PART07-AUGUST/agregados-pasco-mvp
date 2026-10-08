import type { LLMMessage } from '../../../shared/types/llm';
import type { LogisticsSnapshot } from '../../../shared/services/adminLogisticsContextService';
import type { MLModelParams } from '../../../shared/services/fuelPredictionService';

export type AgentRole = 'SUPERVISOR' | 'AUDITOR_ML' | 'FLOTA_DESPACHO';

export type ConversationTurn = { role: 'user' | 'assistant'; content: string };

export interface AgentContext {
  snapshot: LogisticsSnapshot;
  mlParams: MLModelParams;
}

export interface ReActTraceStep {
  paso: number;
  agente: AgentRole;
  pensamiento: string;
  herramientaInvocada: string;
  parametrosValidados: Record<string, unknown>;
  observacionResumida: string;
  estado: 'EXITOSO' | 'ERROR_CONTROLADO';
}

export interface ToolResult<T = unknown> {
  exito: boolean;
  datos?: T;
  error?: string;
  observacion: string;
}

export interface IAgentTool {
  readonly nombre: string;
  readonly descripcion: string;
  ejecutar(parametros: Record<string, unknown>, contexto: AgentContext): Promise<ToolResult>;
}

export interface AgentExecutionOutput {
  rol: AgentRole;
  nombre: string;
  respuesta: string;
  trazas: ReActTraceStep[];
  llamadasLLM: number;
}

export interface IAgent {
  readonly rol: AgentRole;
  readonly nombre: string;
  ejecutar(consulta: string, contexto: AgentContext, historial?: ConversationTurn[]): Promise<AgentExecutionOutput>;
}

export interface CopilotChatMessage extends LLMMessage {
  id: string;
  agente?: AgentRole;
  nombreAgente?: string;
  trazas?: ReActTraceStep[];
}

export const MAX_PASOS_POR_AGENTE = 3;
