import { useState, useCallback } from 'react';
import type { LLMMessage } from '../../../shared/types/llm';
import { llmFactory } from '../../../shared/services/llm/llmFactory';
import { copilotRateLimiter } from '../../../shared/services/llm/copilotRateLimiter';
import { adminLogisticsContextService } from '../../../shared/services/adminLogisticsContextService';
import { getErrorMessage } from '../../../shared/utils/errors';

const INITIAL_MESSAGES: LLMMessage[] = [
  {
    role: 'assistant',
    content:
      'Hola. Soy SIS-Copilot, tu asistente de operaciones para AGREGADOS SIS. Tengo acceso al estado de la flota, pedidos y auditoría de combustible con el modelo ML. ¿Qué deseas consultar?',
  },
];

export function useAdminCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<LLMMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number>(() =>
    copilotRateLimiter.getRemainingQuota()
  );

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const prompt = (textToSend ?? input).trim();
      if (!prompt || isGenerating) {
        return;
      }

      if (!copilotRateLimiter.canMakeRequest()) {
        setError(
          'Has alcanzado el límite diario de 25 consultas gratuitas del Copiloto. La cuota se reiniciará automáticamente mañana.'
        );
        return;
      }

      setError(null);
      setInput('');

      const userMessage: LLMMessage = { role: 'user', content: prompt };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsGenerating(true);

      try {
        const systemInstruction = await adminLogisticsContextService.buildSystemInstruction();
        const slidingWindow = updatedMessages.slice(-4);

        const provider = llmFactory.getActiveProvider();
        const response = await provider.sendMessage({
          messages: slidingWindow,
          systemInstruction,
          maxOutputTokens: 400,
          temperature: 0.2,
        });

        copilotRateLimiter.recordRequest();
        setRemainingQuota(copilotRateLimiter.getRemainingQuota());

        const assistantMessage: LLMMessage = {
          role: 'assistant',
          content: response.content,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err: unknown) {
        const errorText = getErrorMessage(
          err,
          'Ocurrió un error al comunicarse con el modelo de inteligencia artificial.'
        );
        setError(errorText);
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
