import { consultaFlotaTool } from './tools/ConsultaFlotaTool';
import { consultaPedidosTool } from './tools/ConsultaPedidosTool';
import { ReActTraceRecorder } from './ReActTraceRecorder';
import { LLMFactory } from '../../../shared/services/llm/llmFactory';
import type { AgentContext, AgentExecutionOutput, AgentRole, ConversationTurn, IAgent } from './types';

export class FleetDispatchAgent implements IAgent {
  readonly rol: AgentRole = 'FLOTA_DESPACHO';
  readonly nombre = 'Jefe de Flota y Despacho';

  async ejecutar(consulta: string, contexto: AgentContext, historial: ConversationTurn[] = []): Promise<AgentExecutionOutput> {
    const recorder = new ReActTraceRecorder(this.rol);

    const resultadoFlota = await consultaFlotaTool.ejecutar({}, contexto);
    recorder.registrar({
      pensamiento: `Necesito saber la capacidad real: hay ${contexto.snapshot.totalVehiculos} volquetes y ${contexto.snapshot.totalConductores} conductores registrados.`,
      herramienta: consultaFlotaTool.nombre,
      parametros: {},
      resultado: resultadoFlota,
    });

    const resultadoPedidos = await consultaPedidosTool.ejecutar({}, contexto);
    recorder.registrar({
      pensamiento: `Con ${contexto.snapshot.vehiculosDisponibles} volquetes y ${contexto.snapshot.conductoresDisponibles} conductores libres, reviso la carga de pedidos pendientes.`,
      herramienta: consultaPedidosTool.nombre,
      parametros: {},
      resultado: resultadoPedidos,
    });

    const systemInstruction = `Eres el JEFE DE FLOTA Y DESPACHO de AGREGADOS SIS en Cerro de Pasco.
Coordinas volquetes (capacidad típica 15 m³ ≈ 21.75 ton), asignación de conductores y priorizas pedidos.

OBSERVACIONES VERIFICADAS DE TUS HERRAMIENTAS:
${recorder.observacionesTexto}

REGLAS:
1. Responde obligatoriamente en español profesional, respuesta ejecutiva de 3 a 4 oraciones.
2. Usa SOLO los números de las observaciones; no inventes placas ni conductores.
3. Si hay pedidos o volumen solicitado y unidades libres, sugiere cuántos viajes de 15 m³ se necesitan.
4. Sin saludos largos.`;

    const provider = LLMFactory.getProviderForRole(this.rol);
    const response = await provider.sendMessage({
      messages: [...historial, { role: 'user', content: consulta }],
      systemInstruction,
      temperature: 0.2,
      maxOutputTokens: 600,
    });

    return { rol: this.rol, nombre: this.nombre, respuesta: response.content, trazas: recorder.trazas, llamadasLLM: 1 };
  }
}

export const fleetDispatchAgent = new FleetDispatchAgent();
