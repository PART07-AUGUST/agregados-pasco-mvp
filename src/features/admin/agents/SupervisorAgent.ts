import { geminiProvider } from '../../../shared/services/llm/geminiProvider';
import type { AgentExecutionOutput, AgentRole, ConversationTurn } from './types';

export class SupervisorAgent {
  readonly rol: AgentRole = 'SUPERVISOR';
  readonly nombre = 'Supervisor de Operaciones';

  async sintetizar(consulta: string, dictamenes: AgentExecutionOutput[], historial: ConversationTurn[] = []): Promise<AgentExecutionOutput> {
    const informes = dictamenes.map((d) => `### ${d.nombre}\n${d.respuesta}`).join('\n\n');

    const systemInstruction = `Eres el SUPERVISOR DE OPERACIONES de AGREGADOS SIS en Cerro de Pasco (4,380 m s.n.m.).
Recibes los informes de tus especialistas y entregas UNA respuesta coordinada al Administrador.

INFORMES DE LOS ESPECIALISTAS:
${informes}

REGLAS:
1. Usa subtítulos por área (### Flota, ### Combustible) sin repetir datos.
2. Si los informes se contradicen, señálalo y prioriza la seguridad y el costo.
3. Cierra con "### Recomendación" en 1 o 2 oraciones accionables.
4. Usa SOLO los datos de los informes. Sin LaTeX.`;

    const response = await geminiProvider.sendMessage({
      messages: [...historial, { role: 'user', content: consulta }],
      systemInstruction,
      temperature: 0.2,
      maxOutputTokens: 450,
    });

    const trazasPrevias = dictamenes.flatMap((d) => d.trazas);
    const trazas = [
      ...trazasPrevias,
      {
        paso: trazasPrevias.length + 1,
        agente: this.rol,
        pensamiento: `Consolido ${dictamenes.length} dictámenes (${dictamenes.map((d) => d.nombre).join(' + ')}) en una sola resolución.`,
        herramientaInvocada: 'sintesis_multiagente',
        parametrosValidados: { especialistas: dictamenes.length },
        observacionResumida: 'Dictamen consolidado emitido.',
        estado: 'EXITOSO' as const,
      },
    ];

    return {
      rol: this.rol,
      nombre: this.nombre,
      respuesta: response.content,
      trazas,
      llamadasLLM: dictamenes.reduce((total, d) => total + d.llamadasLLM, 1),
    };
  }
}

export const supervisorAgent = new SupervisorAgent();
