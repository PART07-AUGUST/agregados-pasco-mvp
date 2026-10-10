import { apiClient } from '../../../shared/services/apiClient';
import { ApiError } from '../../../shared/services/apiError';
import type { ConsultaCopilotResponseDto } from '../../../shared/types/api/copilotDto';
import type { AgentExecutionOutput, AgentRole, ConversationTurn, ReActTraceStep } from './types';

const esRegistro = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor);

const mostrarValor = (valor: unknown): string => {
  if (valor === null || valor === undefined) {
    return 'N/D';
  }
  if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
    return String(valor);
  }
  try {
    return JSON.stringify(valor) ?? 'N/D';
  } catch {
    return 'Resultado no serializable';
  }
};

const resumirResultado = (herramienta: string, resultado: unknown): string => {

  if (herramienta === 'ConsultaFlotaTool' && esRegistro(resultado)) {
    return [
      `Flota total: ${mostrarValor(resultado.total_vehiculos)} volquetes`,
      `disponibles: ${mostrarValor(resultado.vehiculos_disponibles)}`,
      `conductores totales: ${mostrarValor(resultado.total_conductores)}`,
      `conductores disponibles: ${mostrarValor(resultado.conductores_disponibles)}`,
      `viajes activos: ${mostrarValor(resultado.viajes_activos)}`,
    ].join(' | ');
  }

  if (herramienta === 'ConsultaPedidosTool' && esRegistro(resultado)) {
    return `Pedidos pendientes: ${mostrarValor(resultado.pedidos_pendientes)}.`;
  }

  return mostrarValor(resultado);
};

const mapearTrazaCopilot = (
  traza: unknown,
  indice: number,
  agente: AgentRole
) => {
  const dato = esRegistro(traza) ? traza : {};
  const herramienta = typeof dato.herramienta === 'string' ? dato.herramienta : 'herramienta_desconocida';
  const pensamiento = typeof dato.pensamiento === 'string'
    ? dato.pensamiento
    : `Paso ${indice + 1} sin pensamiento registrado.`;

  return {
    paso: indice + 1,
    agente,
    pensamiento,
    herramientaInvocada: herramienta,
    parametrosValidados: esRegistro(dato.parametros) ? dato.parametros : {},
    observacionResumida: resumirResultado(herramienta, dato.resultado),
    estado: 'EXITOSO',
  } satisfies ReActTraceStep;
};

export class CopilotOrchestrator {
  async processQuery(
    consulta: string,
    historial: ConversationTurn[] = [],
    agenteForzado?: AgentRole
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
          trazas: (Array.isArray(response.trazas) ? response.trazas : []).map((traza, indice) =>
            mapearTrazaCopilot(traza, indice, response.rol)
          ),
          llamadasLLM: response.llamadas_llm,
        };
      }
      throw new Error('El backend devolvió una respuesta inválida para el Copiloto.');
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 403) {
          throw new Error('Tu sesión no tiene permiso para usar el Copiloto.', { cause: error });
        }
        if (error.status >= 500 || error.status === 0) {
          throw new Error('El Copiloto no está disponible en este momento. Intenta nuevamente más tarde.', { cause: error });
        }
      }

      if (error instanceof TypeError) {
        throw new Error('No se pudo conectar con el servicio del Copiloto.', { cause: error });
      }

      throw error instanceof Error
        ? error
        : new Error('No se pudo procesar la consulta del Copiloto.', { cause: error });
    }
  }
}

export const copilotOrchestrator = new CopilotOrchestrator();
