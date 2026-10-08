import type { ILLMProvider } from '../../types/llm';
import { geminiProvider } from './geminiProvider';
import { groqProvider } from './GroqProvider';
import { openRouterProvider } from './OpenRouterProvider';
import { openAIProvider } from './OpenAIProvider';

export type LLMProviderType = 'gemini' | 'groq' | 'openrouter' | 'openai';

export class LLMFactory {

  static getActiveProvider(): ILLMProvider {
    const configured = (
      import.meta.env.VITE_LLM_PROVIDER ||
      import.meta.env.LLM_PROVIDER ||
      'gemini'
    ).toLowerCase();

    switch (configured) {
      case 'groq':
        return groqProvider;
      case 'openrouter':
        return openRouterProvider;
      case 'openai':
        return openAIProvider;
      case 'gemini':
      default:
        return geminiProvider;
    }
  }

  static getProviderForRole(role: 'SUPERVISOR' | 'AUDITOR_ML' | 'FLOTA_DESPACHO'): ILLMProvider {
    let specific: string | undefined;

    if (role === 'SUPERVISOR') {
      specific = import.meta.env.VITE_SUPERVISOR_LLM_PROVIDER;
    } else if (role === 'FLOTA_DESPACHO') {
      specific = import.meta.env.VITE_FLEET_LLM_PROVIDER;
    } else if (role === 'AUDITOR_ML') {
      specific = import.meta.env.VITE_FUEL_LLM_PROVIDER;
    }

    if (specific) {
      switch (specific.toLowerCase()) {
        case 'groq':
          return groqProvider;
        case 'openrouter':
          return openRouterProvider;
        case 'openai':
          return openAIProvider;
        case 'gemini':
          return geminiProvider;
      }
    }

    // Auto-asignación inteligente por especialidad según las API keys presentes:
    if (role === 'FLOTA_DESPACHO' && import.meta.env.VITE_GROQ_API_KEY) {
      return groqProvider;
    }
    if (role === 'AUDITOR_ML' && import.meta.env.VITE_OPENROUTER_API_KEY) {
      return openRouterProvider;
    }
    if (role === 'SUPERVISOR' && (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY)) {
      return geminiProvider;
    }

    return this.getActiveProvider();
  }
}

export const llmFactory = LLMFactory;
