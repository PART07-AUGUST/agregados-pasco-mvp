import type { ILLMProvider, LLMRequestOptions, LLMResponse } from '../../types/llm';

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

interface GeminiResponseCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiApiResponse {
  candidates?: GeminiResponseCandidate[];
  usageMetadata?: {
    totalTokenCount?: number;
  };
  error?: {
    message?: string;
  };
}

interface GeminiModelItem {
  name: string;
  supportedGenerationMethods?: string[];
}

interface GeminiListModelsResponse {
  models?: GeminiModelItem[];
}

const DEFAULT_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-3.8-flash'];

export class GeminiProvider implements ILLMProvider {
  readonly name = 'Google Gemini';
  private cachedModels: string[] | null = null;

  private getApiKey(): string {
    const key = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!key) {
      throw new Error(
        'Falta configurar la clave VITE_GEMINI_API_KEY en tu archivo .env.local para usar el Copiloto de Inteligencia Artificial.'
      );
    }
    return key;
  }

  private async getCandidateModels(apiKey: string): Promise<string[]> {
    const userModel = import.meta.env.VITE_GEMINI_MODEL as string | undefined;
    if (userModel) {
      return [userModel, ...DEFAULT_MODELS.filter((m) => m !== userModel)];
    }

    if (this.cachedModels && this.cachedModels.length > 0) {
      return this.cachedModels;
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = (await response.json()) as GeminiListModelsResponse;
        const validModels = (data.models ?? [])
          .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m) => m.name.replace(/^models\//, ''))
          .filter((name) => {
            const lower = name.toLowerCase();
            return (
              !lower.includes('tts') &&
              !lower.includes('audio') &&
              !lower.includes('speech') &&
              !lower.includes('embedding') &&
              !lower.includes('imagen') &&
              !lower.includes('aqa') &&
              !lower.includes('vision') &&
              !lower.includes('realtime')
            );
          });

        if (validModels.length > 0) {
          validModels.sort((a, b) => {
            if (a === 'gemini-1.5-flash') return -1;
            if (b === 'gemini-1.5-flash') return 1;
            if (a.includes('flash') && !b.includes('flash')) return -1;
            if (!a.includes('flash') && b.includes('flash')) return 1;
            return 0;
          });
          this.cachedModels = validModels;
          return validModels;
        }
      }
    } catch {
      return DEFAULT_MODELS;
    }

    return DEFAULT_MODELS;
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async sendMessage(options: LLMRequestOptions): Promise<LLMResponse> {
    const apiKey = this.getApiKey();
    const models = await this.getCandidateModels(apiKey);

    const userRoleMessages = options.messages.filter((m) => m.role !== 'system');
    const validTurnMessages =
      userRoleMessages[0]?.role === 'assistant'
        ? userRoleMessages.slice(1)
        : userRoleMessages;

    const contents: GeminiContent[] = validTurnMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    if (contents.length === 0) {
      throw new Error('No hay mensajes válidos para enviar al modelo.');
    }

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: options.maxOutputTokens ?? 400,
        temperature: options.temperature ?? 0.2,
      },
    };

    if (options.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }],
      };
    }

    let lastError: Error | null = null;

    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          if (attempt > 0) {
            await this.wait(800);
          }

          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const errorData = (await response.json().catch(() => null)) as GeminiApiResponse | null;
            const errorMsg = errorData?.error?.message || `Error HTTP ${response.status}`;

            const isRecoverable =
              response.status === 404 ||
              response.status === 429 ||
              response.status === 503 ||
              errorMsg.toLowerCase().includes('not found') ||
              errorMsg.toLowerCase().includes('not supported') ||
              errorMsg.toLowerCase().includes('high demand') ||
              errorMsg.toLowerCase().includes('not enabled') ||
              errorMsg.toLowerCase().includes('no longer available') ||
              errorMsg.toLowerCase().includes('overloaded') ||
              errorMsg.toLowerCase().includes('unavailable');

            if (isRecoverable) {
              lastError = new Error(errorMsg);
              if (
                response.status === 404 ||
                errorMsg.toLowerCase().includes('not found') ||
                errorMsg.toLowerCase().includes('not supported') ||
                errorMsg.toLowerCase().includes('not enabled') ||
                errorMsg.toLowerCase().includes('no longer available')
              ) {
                break;
              }
              continue;
            }

            throw new Error(errorMsg);
          }

          const data = (await response.json()) as GeminiApiResponse;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!text) {
            throw new Error('La respuesta del modelo de inteligencia artificial fue vacía.');
          }

          return {
            content: text,
            tokensUsed: data.usageMetadata?.totalTokenCount,
          };
        } catch (err: unknown) {
          if (err instanceof Error) {
            const msg = err.message.toLowerCase();
            const isRecoverable =
              msg.includes('not found') ||
              msg.includes('high demand') ||
              msg.includes('503') ||
              msg.includes('429') ||
              msg.includes('404') ||
              msg.includes('not enabled') ||
              msg.includes('no longer available') ||
              msg.includes('overloaded');

            if (isRecoverable) {
              lastError = err;
              if (
                msg.includes('not found') ||
                msg.includes('not supported') ||
                msg.includes('not enabled') ||
                msg.includes('no longer available')
              ) {
                break;
              }
              continue;
            }
          }
          throw err;
        }
      }
    }

    throw (
      lastError ||
      new Error(
        'Los servidores de Google AI Studio están experimentando alta demanda en este momento. Por favor reintenta en unos instantes.'
      )
    );
  }
}

export const geminiProvider = new GeminiProvider();
