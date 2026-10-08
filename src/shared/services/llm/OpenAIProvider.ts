import type { ILLMProvider, LLMRequestOptions, LLMResponse } from '../../types/llm';

export class OpenAIProvider implements ILLMProvider {
  readonly name = 'OpenAI (GPT-4o / GPT-4o-mini)';

  private getApiKey(): string {
    const key = (import.meta.env.VITE_OPENAI_API_KEY ||
      import.meta.env.OPENAI_API_KEY) as string | undefined;
    if (!key) {
      throw new Error(
        'Falta configurar la clave VITE_OPENAI_API_KEY en .env.local para usar el proveedor OpenAI.'
      );
    }
    return key;
  }

  private getModel(): string {
    return (
      (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ||
      'gpt-4o-mini'
    );
  }

  async sendMessage(options: LLMRequestOptions): Promise<LLMResponse> {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    const formattedMessages = [
      ...(options.systemInstruction
        ? [{ role: 'system' as const, content: options.systemInstruction }]
        : []),
      ...options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      throw new Error(`Error en API OpenAI (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    const tokensUsed = data.usage?.total_tokens;

    return { content, tokensUsed };
  }
}

export const openAIProvider = new OpenAIProvider();
