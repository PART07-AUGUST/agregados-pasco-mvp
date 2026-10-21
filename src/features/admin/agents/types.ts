export type AgentRole =
  | 'ORQUESTADOR'
  | 'FLOTA_DESPACHO'
  | 'GESTION_PEDIDOS'
  | 'AUDITOR_ML'
  | 'RUTAS_MAPAS'
  | 'SUPERVISOR';

export type ConversationTurn = { role: 'user' | 'assistant'; content: string };

export interface ReActTraceStep {
  paso: number;
  agente: AgentRole;
  pensamiento: string;
  herramientaInvocada: string;
  herramientaAmigable: string;
  descripcionAmigable: string;
  parametrosValidados: Record<string, unknown>;
  observacionResumida: string;
  estado: 'EXITOSO' | 'ERROR_CONTROLADO';
}

export interface AgentExecutionOutput {
  rol: AgentRole;
  nombre: string;
  respuesta: string;
  trazas: ReActTraceStep[];
  llamadasLLM: number;
  agentesParticipantes: AgentRole[];
}

export interface CopilotChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agente?: AgentRole;
  nombreAgente?: string;
  trazas?: ReActTraceStep[];
  agentesParticipantes?: AgentRole[];
}

export const MAX_PASOS_POR_AGENTE = 3;
