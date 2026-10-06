export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMRequestOptions {
  messages: LLMMessage[];
  systemInstruction?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  tokensUsed?: number;
}

export interface ILLMProvider {
  readonly name: string;
  sendMessage(options: LLMRequestOptions): Promise<LLMResponse>;
}
