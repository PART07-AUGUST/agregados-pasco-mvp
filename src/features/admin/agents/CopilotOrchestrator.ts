import { apiClient } from '../../../shared/services/apiClient';
import { ApiError } from '../../../shared/services/apiError';
import type { ConsultaCopilotResponseDto } from '../../../shared/types/api/copilotDto';
import { copilotRouteContextService } from '../../../shared/services/copilotRouteContextService';
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

const nombreHerramienta = (herramienta: string): string => {
  const nombres: Record<string, string> = {
    GoogleMapsRoutesTool: 'Rutas en el mapa',
    RutaYGeocodificacionTool: 'Ubicación y ruta',
    GeocodificacionDestinoTool: 'Ubicación del destino',
    EstimacionCombustibleMLTool: 'Estimación de combustible',
    CopilotSynthesisTool: 'Respuesta del asistente IA',
    ConsultaFlotaTool: 'Estado de la flota',
    ConsultaPedidosTool: 'Estado de los pedidos',
    ConsultaBalanzaTool: 'Control de balanza',
    ConsultaBaseDatosTool: 'Consulta de datos del sistema',
    ConsultaDetalleOperativoTool: 'Detalle operativo',
    FiltroDominioSistemaTool: 'Filtro del sistema',
  };
  return nombres[herramienta] ?? 'Consulta del sistema';
};

const resumirResultado = (
  herramienta: string,
  resultado: unknown,
  parametros: Record<string, unknown>,
): string => {

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

  if (herramienta === 'ConsultaBalanzaTool' && esRegistro(resultado)) {
    return [
      `Se revisaron los últimos ${mostrarValor(resultado.viajes_considerados)} viajes`,
      `en balanza: ${mostrarValor(resultado.vehiculos_en_balanza)}`,
      `ya pasaron: ${mostrarValor(resultado.vehiculos_que_ya_pasaron)}`,
    ].join(' | ') + '.';
  }

  if (herramienta === 'ConsultaBaseDatosTool' && esRegistro(resultado)) {
    const tablas = Array.isArray(resultado.tablas_consultadas)
      ? resultado.tablas_consultadas.map((tabla) => mostrarValor(tabla)).join(', ')
      : 'las tablas solicitadas';
    return `Se consultaron ${tablas} con resultados verificados.`;
  }

  if (herramienta === 'GoogleMapsRoutesTool' && esRegistro(resultado)) {
    const distancias = Array.isArray(resultado.distancias_km)
      ? resultado.distancias_km.map((distancia) => `${mostrarValor(distancia)} km`).join(', ')
      : 'distancia calculada';
    return `Ruta hacia ${mostrarValor(parametros.destino)}: ${distancias}.`;
  }

  if (herramienta === 'EstimacionCombustibleMLTool' && esRegistro(resultado)) {
    const estimaciones = Array.isArray(resultado.estimaciones) ? resultado.estimaciones : [];
    const recomendacion = esRegistro(resultado.recomendacion) ? resultado.recomendacion : null;
    if (recomendacion) {
      return `Se evaluaron ${estimaciones.length} alternativa(s). Recomendada: ${mostrarValor(
        recomendacion.cantera
      )}, ${mostrarValor(recomendacion.galones)} gal (aprox. S/ ${mostrarValor(
        recomendacion.costo_pen
      )}).`;
    }
    return `El modelo calculó ${estimaciones.length} alternativa(s) de consumo.`;
  }

  if (herramienta === 'CopilotSynthesisTool' && esRegistro(resultado)) {
    return resultado.estado === 'RESPUESTA_GENERADA_POR_IA'
      ? 'La IA preparó una respuesta enfocada en tu pregunta.'
      : 'Se utilizó un resumen seguro con los datos calculados.';
  }

  if (herramienta === 'ConsultaDetalleOperativoTool' && esRegistro(resultado)) {
    return `Se cargaron datos actuales de ${mostrarValor(resultado.conductores)} conductores, ${mostrarValor(
      resultado.vehiculos
    )} vehículos, ${mostrarValor(resultado.pedidos)} pedidos y ${mostrarValor(resultado.viajes)} viajes.`;
  }

  if (herramienta === 'FiltroDominioSistemaTool') {
    return 'La consulta no pertenece al alcance operativo de SIS-AGREGADOS.';
  }

  return mostrarValor(resultado);
};

const describirPaso = (
  herramienta: string,
  parametros: Record<string, unknown>,
): string => {
  if (herramienta === 'GoogleMapsRoutesTool') {
    return `Calculé las rutas${parametros.destino ? ` hacia ${mostrarValor(parametros.destino)}` : ''}.`;
  }
  if (herramienta === 'EstimacionCombustibleMLTool') {
    return 'Apliqué el modelo de combustible a las rutas calculadas.';
  }
  if (herramienta === 'CopilotSynthesisTool') {
    return 'Organicé la respuesta según lo que preguntaste.';
  }
  if (herramienta === 'ConsultaFlotaTool') return 'Consulté el estado actual de la flota.';
  if (herramienta === 'ConsultaPedidosTool') return 'Consulté los pedidos registrados.';
  if (herramienta === 'ConsultaBalanzaTool') {
    return `Revisé los últimos ${mostrarValor(parametros.limite_viajes)} viajes y sus estados de balanza.`;
  }
  if (herramienta === 'ConsultaBaseDatosTool') {
    return 'Consulté las tablas relacionadas con tu pregunta usando datos de solo lectura.';
  }
  if (herramienta === 'ConsultaDetalleOperativoTool') return 'Cargué el detalle operativo actual.';
  if (herramienta === 'FiltroDominioSistemaTool') return 'Revisé si la consulta pertenece al sistema.';
  return 'Procesé la información solicitada.';
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
  const parametros = esRegistro(dato.parametros) ? dato.parametros : {};

  return {
    paso: indice + 1,
    agente,
    pensamiento,
    herramientaInvocada: herramienta,
    herramientaAmigable: nombreHerramienta(herramienta),
    descripcionAmigable: describirPaso(herramienta, parametros),
    parametrosValidados: parametros,
    observacionResumida: resumirResultado(herramienta, dato.resultado, parametros),
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
      // Las rutas se resuelven con Maps antes de pedir una respuesta al Copiloto.
      // Así el modelo recibe distancia real y no tiene que adivinarla.
      const contextoRuta = await copilotRouteContextService.buildContext(consulta);
      const response = await apiClient.post<ConsultaCopilotResponseDto>('/copilot/consultas', {
        mensaje: consulta,
        historial: historial.map((h) => ({ rol: h.role, contenido: h.content })),
        rol_forzado: agenteForzado,
        ...(contextoRuta ? { contexto_ruta: contextoRuta } : {}),
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
