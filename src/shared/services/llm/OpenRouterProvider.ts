import type { ILLMProvider, LLMRequestOptions, LLMResponse } from '../../types/llm';

export class OpenRouterProvider implements ILLMProvider {
  readonly name = 'OpenRouter (DeepSeek / Qwen / Llama)';

  private getApiKey(): string {
    const key = (import.meta.env.VITE_OPENROUTER_API_KEY ||
      import.meta.env.OPENROUTER_API_KEY) as string | undefined;
    if (!key) {
      throw new Error(
        'Falta configurar la clave VITE_OPENROUTER_API_KEY en .env.local para usar el proveedor OpenRouter.'
      );
    }
    return key;
  }

  private getCandidateModels(): string[] {
    const custom = import.meta.env.VITE_OPENROUTER_MODEL as string | undefined;
    const defaults = [
      'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      'google/gemma-4-31b-it:free',
      'liquid/lfm-2.5-2.6b:free',
      'cohere/north-mini-code:free',
    ];
    return custom ? [custom, ...defaults.filter((m) => m !== custom)] : defaults;
  }

  async sendMessage(options: LLMRequestOptions): Promise<LLMResponse> {
    const apiKey = this.getApiKey();
    const candidateModels = this.getCandidateModels();

    const formattedMessages = [
      ...(options.systemInstruction
        ? [{ role: 'system' as const, content: options.systemInstruction }]
        : []),
      ...options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    let lastError: Error | null = null;

    for (const model of candidateModels) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://agregados-pasco.pe',
            'X-Title': 'SIS-AGREGADOS Copilot',
          },
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            temperature: options.temperature ?? 0.2,
            max_tokens: options.maxOutputTokens ?? 450,
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          // Si el modelo gratuito no está disponible o requiere pago, probar el siguiente candidato
          if (response.status === 404 || response.status === 402 || response.status === 429) {
            console.warn(`Modelo ${model} no disponible en OpenRouter (${response.status}), probando alternativa...`);
            lastError = new Error(`Error en API OpenRouter (${response.status}): ${errorBody}`);
            continue;
          }
          throw new Error(`Error en API OpenRouter (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        const tokensUsed = data.usage?.total_tokens;

        return { content, tokensUsed };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error('No se pudo conectar con ningún modelo disponible en OpenRouter.');
  }
}

export const openRouterProvider = new OpenRouterProvider();
