import { useState, useCallback } from 'react';
import { copilotOrchestrator } from '../agents/CopilotOrchestrator';
import type { AgentRole, ConversationTurn, CopilotChatMessage } from '../agents/types';
import { copilotRateLimiter } from '../../../shared/services/llm/copilotRateLimiter';
import { getErrorMessage } from '../../../shared/utils/errors';

const VENTANA_MEMORIA = 4;

const INITIAL_MESSAGES: CopilotChatMessage[] = [
  {
    id: 'bienvenida',
    role: 'assistant',
    agente: 'SUPERVISOR',
    nombreAgente: 'Supervisor de Operaciones',
    content:
      'Hola. Coordino a un **Auditor de Combustible ML** y a un **Jefe de Flota**. Pregúntame por consumo de diésel, anomalías, volquetes o pedidos y derivaré tu consulta al especialista adecuado.',
  },
];

const crearId = (): string => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const aHistorial = (mensajes: CopilotChatMessage[]): ConversationTurn[] =>
  mensajes.slice(-VENTANA_MEMORIA).map(({ role, content }) => ({
    role: role === 'user' ? 'user' : 'assistant',
    content,
  }));

export function useAdminCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number>(() => copilotRateLimiter.getRemainingQuota());

  const sendMessage = useCallback(
    async (textToSend?: string, agenteForzado?: AgentRole) => {
      const prompt = (textToSend ?? input).trim();
      if (!prompt || isGenerating) {
        return;
      }

      if (!copilotRateLimiter.canMakeRequest()) {
        setError('Alcanzaste el límite diario de consultas del Copiloto. La cuota se reinicia mañana.');
        return;
      }

      setError(null);
      setInput('');

      const historial = aHistorial(messages);
      setMessages((prev) => [...prev, { id: crearId(), role: 'user', content: prompt }]);
      setIsGenerating(true);

      try {
        const resultado = await copilotOrchestrator.processQuery(prompt, historial, agenteForzado);

        copilotRateLimiter.recordRequests(resultado.llamadasLLM);
        setRemainingQuota(copilotRateLimiter.getRemainingQuota());

        setMessages((prev) => [
          ...prev,
          {
            id: crearId(),
            role: 'assistant',
            content: resultado.respuesta,
            agente: resultado.rol,
            nombreAgente: resultado.nombre,
            trazas: resultado.trazas,
          },
        ]);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Ocurrió un error al coordinar a los agentes de inteligencia artificial.'));
      } finally {
        setIsGenerating(false);
      }
    },
    [input, isGenerating, messages]
  );

  const clearChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setError(null);
  }, []);

  return {
    isOpen,
    setIsOpen,
    messages,
    input,
    setInput,
    isGenerating,
    error,
    remainingQuota,
    maxQuota: copilotRateLimiter.getMaxDailyQuota(),
    showQuota: copilotRateLimiter.isRateLimitActive(),
    sendMessage,
    clearChat,
  };
}

export default useAdminCopilot;
