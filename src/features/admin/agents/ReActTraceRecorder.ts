import { MAX_PASOS_POR_AGENTE, type AgentRole, type ReActTraceStep, type ToolResult } from './types';

interface StepInput {
  pensamiento: string;
  herramienta: string;
  parametros: Record<string, unknown>;
  resultado: ToolResult;
}

export class ReActTraceRecorder {
  private readonly pasos: ReActTraceStep[] = [];
  private readonly observaciones: string[] = [];

  private readonly agente: AgentRole;

  constructor(agente: AgentRole) {
    this.agente = agente;
  }

  hayEspacio(): boolean {
    return this.pasos.length < MAX_PASOS_POR_AGENTE;
  }

  registrar({ pensamiento, herramienta, parametros, resultado }: StepInput): void {
    if (!this.hayEspacio()) {
      return;
    }
    this.pasos.push({
      paso: this.pasos.length + 1,
      agente: this.agente,
      pensamiento,
      herramientaInvocada: herramienta,
      parametrosValidados: parametros,
      observacionResumida: resultado.observacion,
      estado: resultado.exito ? 'EXITOSO' : 'ERROR_CONTROLADO',
    });
    this.observaciones.push(`- [${herramienta}] ${resultado.observacion}`);
  }

  get trazas(): ReActTraceStep[] {
    return [...this.pasos];
  }

  get observacionesTexto(): string {
    return this.observaciones.join('\n');
  }
}
