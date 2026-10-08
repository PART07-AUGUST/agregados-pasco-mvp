import type { ILLMProvider, LLMRequestOptions, LLMResponse } from '../../types/llm';

export class GroqProvider implements ILLMProvider {
  readonly name = 'Groq (Llama / Mixtral / DeepSeek)';

  private getApiKey(): string {
    const key = (import.meta.env.VITE_GROQ_API_KEY ||
      import.meta.env.GROQ_API_KEY) as string | undefined;
    if (!key) {
      throw new Error(
        'Falta configurar la clave VITE_GROQ_API_KEY en .env.local para usar el proveedor Groq.'
      );
    }
    return key;
  }

  private getCandidateModels(): string[] {
    const custom = import.meta.env.VITE_GROQ_MODEL as string | undefined;
    const defaults = [
      'qwen/qwen3.8-27b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'llama-3.3-70b-versatile',
      'mixtral-8x7b-32768',
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
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
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
          // Si el modelo no existe o no hay acceso, probar el siguiente candidato activo
          if (response.status === 404 || response.status === 400) {
            console.warn(`Modelo ${model} no disponible en Groq (${response.status}), probando alternativa...`);
            lastError = new Error(`Error en API Groq (${response.status}): ${errorBody}`);
            continue;
          }
          throw new Error(`Error en API Groq (${response.status}): ${errorBody}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content ?? '';
        const tokensUsed = data.usage?.total_tokens;

        return { content, tokensUsed };
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error('No se pudo conectar con ningún modelo disponible en Groq.');
  }
}

export const groqProvider = new GroqProvider();
