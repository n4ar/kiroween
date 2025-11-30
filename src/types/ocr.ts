import { OCRResult } from './receipt';

/**
 * OCR engine interface
 */
export interface IOCREngine {
  name: string;
  process(
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<OCRResult>;
  isAvailable(): Promise<boolean>;
}

/**
 * OCR engine types
 */
export type OCREngineType = 'manual' | 'native' | 'ai-vendor';

/**
 * AI vendor types
 */
export type AIVendor = 'openai' | 'google' | 'anthropic' | 'openrouter';

/**
 * AI vendor configuration
 */
export interface AIVendorConfig {
  vendor: AIVendor;
  apiKey: string;
  model: string;
  customModels?: CustomModel[];
}

/**
 * Custom model definition
 */
export interface CustomModel {
  id: string;
  name: string;
  description?: string;
  vendor: AIVendor;
}

/**
 * Available AI models by vendor
 */
export const AI_MODELS: Record<AIVendor, { id: string; name: string; description?: string }[]> = {
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, best for complex receipts' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Faster and more affordable' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous generation' },
  ],
  google: [
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', description: 'Latest and fastest' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Most capable' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast and efficient' },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Most capable' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fast and affordable' },
  ],
  openrouter: [
    { id: 'openai/gpt-4o', name: 'GPT-4o (via OpenRouter)' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (via OpenRouter)' },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)' },
  ],
};
