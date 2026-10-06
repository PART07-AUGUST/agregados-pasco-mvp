import type { ILLMProvider } from '../../types/llm';
import { geminiProvider } from './geminiProvider';

export class LLMFactory {
  static getActiveProvider(): ILLMProvider {
    return geminiProvider;
  }
}

export const llmFactory = LLMFactory;
