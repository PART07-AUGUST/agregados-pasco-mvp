import { calculadoraDieselTool } from './tools/CalculadoraDieselTool';
import { consultaAnomaliasTool } from './tools/ConsultaAnomaliasTool';
import { RouteParamsParser, type RouteParams } from './parsers/RouteParamsParser';
import { ReActTraceRecorder } from './ReActTraceRecorder';
import { buildMLFormulaText, buildMLMetricsText } from './formatters/mlFormulaText';
import { matchesAnomalia, matchesCalculo } from './keywordMatcher';
import { LLMFactory } from '../../../shared/services/llm/llmFactory';
import type { AgentContext, AgentExecutionOutput, AgentRole, ConversationTurn, IAgent } from './types';

export class FuelAuditAgent implements IAgent {
  readonly rol: AgentRole = 'AUDITOR_ML';
  readonly nombre = 'Auditor de Combustible ML';

  async ejecutar(consulta: string, contexto: AgentContext, historial: ConversationTurn[] = []): Promise<AgentExecutionOutput> {
    const recorder = new ReActTraceRecorder(this.rol);
    const params = this.resolverParametros(consulta, historial);
    const pideCalculo = matchesCalculo(consulta);

    if (params.distanciaKm !== undefined) {
      await this.ejecutarCalculo(recorder, params, contexto);
    } else if (pideCalculo) {
      this.registrarFaltaDistancia(recorder);
    }

    if (matchesAnomalia(consulta) || recorder.trazas.length === 0) {
      await this.ejecutarAuditoria(recorder, contexto);
    }

    const provider = LLMFactory.getProviderForRole(this.rol);
    const response = await provider.sendMessage({
      messages: [...historial, { role: 'user', content: consulta }],
      systemInstruction: this.construirInstruccion(recorder.observacionesTexto, contexto),
      temperature: 0.1,
      maxOutputTokens: 350,
    });

    return { rol: this.rol, nombre: this.nombre, respuesta: response.content, trazas: recorder.trazas, llamadasLLM: 1 };
  }

  private resolverParametros(consulta: string, historial: ConversationTurn[]): RouteParams {
    const actuales = RouteParamsParser.parse(consulta);
    if (actuales.distanciaKm !== undefined) {
      return actuales;
    }
    if (actuales.destinoDetectado || /ruta|hacia|destino|llegar|llevar a|av\.|calle|jr\./i.test(consulta)) {
      return actuales;
    }
    const ultimaPreguntaConRuta = [...historial]
      .reverse()
      .filter((turno) => turno.role === 'user')
      .map((turno) => RouteParamsParser.parse(turno.content))
      .find((p) => p.distanciaKm !== undefined);
    return ultimaPreguntaConRuta ?? actuales;
  }

  private async ejecutarCalculo(recorder: ReActTraceRecorder, params: RouteParams, contexto: AgentContext): Promise<void> {
    const parametros = {
      distanciaKm: params.distanciaKm,
      desnivelMetros: params.desnivelMetros ?? 0,
      pesoCargaTon: params.pesoCargaTon ?? 18.5,
    };
    const origenPeso = params.volumenM3 !== undefined ? ` (${params.volumenM3} m³ ≈ ${parametros.pesoCargaTon} ton)` : '';
    const infoDestino = params.destinoDetectado
      ? ` hacia ${params.destinoDetectado}${params.esDistanciaReferencial ? ' (referencial regional)' : ''}`
      : '';
    const resultado = await calculadoraDieselTool.ejecutar(parametros, contexto);
    recorder.registrar({
      pensamiento: `Detecté ruta${infoDestino} de ${parametros.distanciaKm} km, desnivel ${parametros.desnivelMetros} m y carga ${parametros.pesoCargaTon} ton${origenPeso}. Invoco la calculadora ML.`,
      herramienta: calculadoraDieselTool.nombre,
      parametros: parametros,
      resultado,
    });
  }

  private registrarFaltaDistancia(recorder: ReActTraceRecorder): void {
    recorder.registrar({
      pensamiento: 'Se pide un cálculo pero no hay distancia en la consulta ni en el historial reciente.',
      herramienta: calculadoraDieselTool.nombre,
      parametros: {},
      resultado: { exito: false, observacion: 'Falta el parámetro obligatorio distanciaKm.' },
    });
  }

  private async ejecutarAuditoria(recorder: ReActTraceRecorder, contexto: AgentContext): Promise<void> {
    const parametros = { limite: 3 };
    const resultado = await consultaAnomaliasTool.ejecutar(parametros, contexto);
    recorder.registrar({
      pensamiento: `Reviso los ${contexto.snapshot.anomaliasCombustible.length} desvíos registrados frente al modelo ML.`,
      herramienta: consultaAnomaliasTool.nombre,
      parametros,
      resultado,
    });
  }

  private construirInstruccion(observaciones: string, contexto: AgentContext): string {
    return `Eres el AUDITOR DE COMBUSTIBLE ML de AGREGADOS SIS en Cerro de Pasco (4,380 m s.n.m.).
Fiscalizas consumo de diésel, sobrecostos y desvíos frente al modelo de Machine Learning.

MODELO VIGENTE (${buildMLMetricsText(contexto.mlParams)}):
${buildMLFormulaText(contexto.mlParams)}

OBSERVACIONES VERIFICADAS DE TUS HERRAMIENTAS:
${observaciones}

REGLAS:
1. Responde obligatoriamente en español técnico, de 3 a 4 oraciones.
2. Usa SOLO los números de las observaciones; no inventes datos.
3. Si hubo cálculo, menciona galones y costo en soles.
4. Si falta la distancia, pídela explicando que es obligatoria para la fórmula.
5. Escribe fórmulas en texto o código simple. NUNCA uses LaTeX ($, \\text{}).`;
  }
}

export const fuelAuditAgent = new FuelAuditAgent();
