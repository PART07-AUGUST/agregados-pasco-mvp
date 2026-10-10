import { fuelAuditAgent } from './FuelAuditAgent';
import { fleetDispatchAgent } from './FleetDispatchAgent';
import { supervisorAgent } from './SupervisorAgent';
import { RouteParamsParser } from './parsers/RouteParamsParser';
import { matchesCombustible, matchesFlota } from './keywordMatcher';
import { AdminLogisticsContextService } from '../../../shared/services/adminLogisticsContextService';
import { FuelPredictionService } from '../../../shared/services/fuelPredictionService';
import { apiClient } from '../../../shared/services/apiClient';
import type { ConsultaCopilotResponseDto } from '../../../shared/types/api/copilotDto';
import type { AgentContext, AgentExecutionOutput, AgentRole, ConversationTurn, IAgent, ReActTraceStep } from './types';

type Ruta = 'AUDITOR_ML' | 'FLOTA_DESPACHO' | 'COMITE';

const LLAMADAS_COMITE = 3;

export class CopilotOrchestrator {
  async processQuery(
    consulta: string,
    historial: ConversationTurn[] = [],
    agenteForzado?: AgentRole,
    presupuestoLlamadas = Number.POSITIVE_INFINITY
  ): Promise<AgentExecutionOutput> {
    try {
      const response = await apiClient.post<ConsultaCopilotResponseDto>('/copilot/consultas', {
        mensaje: consulta,
        historial: historial.map((h) => ({ rol: h.role, contenido: h.content })),
        rol_forzado: agenteForzado,
      });

      if (response?.respuesta) {
        return {
          rol: response.rol,
          nombre: response.nombre_agente,
          respuesta: response.respuesta,
          trazas: response.trazas.map((traza, indice) => ({ ...traza, paso: indice + 1 })),
          llamadasLLM: response.llamadas_llm,
        };
      }
    } catch {
      // Fallback local en caso de que el backend esté en transición o offline
    }

    const contexto = await this.cargarContexto();
    const ruta = this.decidirRuta(consulta, agenteForzado, presupuestoLlamadas);
    const resultado = await this.ejecutarRuta(ruta, consulta, contexto, historial);
    return {
      ...resultado,
      trazas: resultado.trazas.map((traza, indice) => ({ ...traza, paso: indice + 1 })),
    };
  }

  private ejecutarRuta(ruta: Ruta, consulta: string, contexto: AgentContext, historial: ConversationTurn[]): Promise<AgentExecutionOutput> {
    if (ruta === 'AUDITOR_ML') {
      return fuelAuditAgent.ejecutar(consulta, contexto, historial);
    }
    if (ruta === 'FLOTA_DESPACHO') {
      return fleetDispatchAgent.ejecutar(consulta, contexto, historial);
    }
    return this.ejecutarComite(consulta, contexto, historial);
  }

  private async cargarContexto(): Promise<AgentContext> {
    const [snapshot, mlParams] = await Promise.all([
      AdminLogisticsContextService.getLiveSnapshot(),
      FuelPredictionService.loadActiveParams(),
    ]);
    return { snapshot, mlParams };
  }

  private decidirRuta(consulta: string, agenteForzado: AgentRole | undefined, presupuesto: number): Ruta {
    if (agenteForzado === 'AUDITOR_ML' || agenteForzado === 'FLOTA_DESPACHO') {
      return agenteForzado;
    }

    const tieneRuta = RouteParamsParser.parse(consulta).distanciaKm !== undefined;
    const esCombustible = tieneRuta || matchesCombustible(consulta);
    const esFlota = matchesFlota(consulta);

    if (esCombustible && !esFlota) {
      return 'AUDITOR_ML';
    }
    if (esFlota && !esCombustible) {
      return 'FLOTA_DESPACHO';
    }
    if (presupuesto < LLAMADAS_COMITE) {
      return esCombustible ? 'AUDITOR_ML' : 'FLOTA_DESPACHO';
    }
    return 'COMITE';
  }

  private async ejecutarComite(consulta: string, contexto: AgentContext, historial: ConversationTurn[]): Promise<AgentExecutionOutput> {
    const especialistas: IAgent[] = [fuelAuditAgent, fleetDispatchAgent];
    const resultados = await Promise.allSettled(especialistas.map((a) => a.ejecutar(consulta, contexto, historial)));

    const exitosos: AgentExecutionOutput[] = [];
    const trazasFallo: ReActTraceStep[] = [];

    resultados.forEach((resultado, indice) => {
      if (resultado.status === 'fulfilled') {
        exitosos.push(resultado.value);
        return;
      }
      trazasFallo.push(this.trazaDeFallo(especialistas[indice], resultado.reason));
    });

    if (exitosos.length === 0) {
      const primerFallo = resultados.find((r) => r.status === 'rejected');
      throw primerFallo && primerFallo.status === 'rejected' ? primerFallo.reason : new Error('Ningún agente pudo responder.');
    }

    if (exitosos.length === 1) {
      const [unico] = exitosos;
      return { ...unico, trazas: [...unico.trazas, ...trazasFallo] };
    }

    return supervisorAgent.sintetizar(consulta, exitosos, historial);
  }

  private trazaDeFallo(agente: IAgent, motivo: unknown): ReActTraceStep {
    const mensaje = motivo instanceof Error ? motivo.message : 'Error desconocido';
    return {
      paso: 0,
      agente: agente.rol,
      pensamiento: `${agente.nombre} no pudo completar su análisis; el comité continúa con los demás.`,
      herramientaInvocada: 'ninguna',
      parametrosValidados: {},
      observacionResumida: mensaje,
      estado: 'ERROR_CONTROLADO',
    };
  }
}

export const copilotOrchestrator = new CopilotOrchestrator();
