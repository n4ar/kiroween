import { SecureStorage } from '@/src/services/storage/SecureStorage';
import { AIVendorConfig, IOCREngine, OCRResult } from '@/src/types';
import { AppError, ErrorCode } from '@/src/types/errors';
import { AI_MODELS } from '@/src/types/ocr';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import * as FileSystem from 'expo-file-system';
import { z } from 'zod';

/**
 * AI Vendor OCR engine
 * Uses AI SDK to process receipts with various AI providers
 */
export class AIVendorEngine implements IOCREngine {
  name = 'AI Vendor';
  private readonly TIMEOUT_MS = 60000; // 60 seconds
  private readonly MAX_IMAGE_SIZE_MB = 15; // 15MB to stay under API limits

  /**
   * Process image with AI vendor
   */
  async process(
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<OCRResult> {
    console.log('[AIVendorEngine] Starting AI processing for:', imageUri);

    if (onProgress) {
      onProgress(10);
    }

    // Get vendor configuration
    const config = await SecureStorage.getAIVendorConfig();
    if (!config) {
      throw new AppError(
        'AI vendor not configured',
        ErrorCode.OCR_MODEL_LOADING_FAILED,
        'ocr',
        false,
        'AI vendor not configured. Please set up your API key in settings.'
      );
    }

    // Validate model configuration
    this.validateModelConfig(config);

    try {
      // Read and validate image
      const base64Image = await this.readImageAsBase64(imageUri);
      
      if (onProgress) {
        onProgress(30);
      }

      // Get the appropriate model
      const model = this.getModel(config);

      if (onProgress) {
        onProgress(40);
      }

      // Define the schema for structured output with coercion
      const receiptSchema = z.object({
        storeName: z.string().default('Unknown Store').describe('The merchant or store name'),
        date: z.string().nullable().describe('Date in ISO 8601 format, or null if not found'),
        totalAmount: z.coerce.number().nullable().describe('Total amount in cents, or null if not found'),
        lineItems: z.array(
          z.object({
            description: z.string().describe('Item description'),
            amount: z.coerce.number().describe('Item amount in cents'),
          })
        ).default([]).describe('Array of line items from the receipt'),
        rawText: z.string().default('').describe('All text found on the receipt'),
      });

      // Generate structured output with AI and timeout
      const { object } = await this.withTimeout(
        generateObject({
          model,
          schema: receiptSchema,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all information from this receipt image. Include the store name, date (in ISO 8601 format), total amount (in cents), individual line items with their amounts (in cents), and all visible text.',
                },
                {
                  type: 'image',
                  image: base64Image,
                },
              ],
            },
          ],
        }),
        this.TIMEOUT_MS
      );

      if (onProgress) {
        onProgress(80);
      }

      // Convert the structured output to OCRResult
      const parsed = this.convertToOCRResult(object);

      if (onProgress) {
        onProgress(100);
      }

      return parsed;
    } catch (error) {
      console.error('[AIVendorEngine] Processing failed:', error);
      if (onProgress) {
        onProgress(100);
      }

      // Handle specific error types
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new AppError(
            'AI processing timeout',
            ErrorCode.OCR_PROCESSING_TIMEOUT,
            'ocr',
            true,
            'AI processing took too long. Please try again with a clearer image.'
          );
        }

        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new AppError(
            'Network error during AI processing',
            ErrorCode.OCR_NETWORK_ERROR,
            'ocr',
            true,
            'Network error. Please check your internet connection and try again.'
          );
        }

        if (error.message.includes('API key') || error.message.includes('unauthorized')) {
          throw new AppError(
            'Invalid API key',
            ErrorCode.OCR_NETWORK_ERROR,
            'ocr',
            false,
            'Invalid API key. Please check your AI vendor settings.'
          );
        }
      }

      throw new AppError(
        `AI processing failed: ${error}`,
        ErrorCode.OCR_PROCESSING_TIMEOUT,
        'ocr',
        true,
        'Failed to process receipt with AI. Please try again.'
      );
    }
  }

  /**
   * Check if AI vendor is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const config = await SecureStorage.getAIVendorConfig();
      return config !== null && !!config.apiKey && !!config.model;
    } catch (error) {
      console.error('[AIVendorEngine] Availability check failed:', error);
      return false;
    }
  }

  /**
   * Validate model configuration
   */
  private validateModelConfig(config: AIVendorConfig): void {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new AppError(
        'API key is empty',
        ErrorCode.OCR_MODEL_LOADING_FAILED,
        'ocr',
        false,
        'API key is missing. Please configure your AI vendor in settings.'
      );
    }

    if (!config.model || config.model.trim() === '') {
      throw new AppError(
        'Model is not selected',
        ErrorCode.OCR_MODEL_LOADING_FAILED,
        'ocr',
        false,
        'No model selected. Please select a model in AI vendor settings.'
      );
    }

    // Validate model exists for vendor (unless it's a custom model)
    const availableModels = AI_MODELS[config.vendor];
    const isCustomModel = config.customModels?.some((m: { id: string }) => m.id === config.model);
    const isStandardModel = availableModels.some((m: { id: string }) => m.id === config.model);

    if (!isCustomModel && !isStandardModel) {
      console.warn(`[AIVendorEngine] Model ${config.model} not found in standard list for ${config.vendor}, but allowing it`);
    }
  }

  /**
   * Timeout wrapper for promises
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Get the appropriate AI model based on configuration
   */
  private getModel(config: AIVendorConfig) {
    switch (config.vendor) {
      case 'openai':
        const openaiProvider = createOpenAI({ apiKey: config.apiKey });
        return openaiProvider(config.model);
      
      case 'google':
        const googleProvider = createOpenAI({ 
          apiKey: config.apiKey,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        });
        return googleProvider(config.model);
      
      case 'anthropic':
        const anthropicProvider = createOpenAI({
          apiKey: config.apiKey,
          baseURL: 'https://api.anthropic.com/v1',
        });
        return anthropicProvider(config.model);
      
      case 'openrouter':
        const openrouter = createOpenAI({
          apiKey: config.apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
        });
        return openrouter(config.model);
      
      default:
        throw new AppError(
          `Unsupported vendor: ${config.vendor}`,
          ErrorCode.OCR_MODEL_LOADING_FAILED,
          'ocr',
          false,
          `Vendor ${config.vendor} is not supported. Please select a different vendor.`
        );
    }
  }

  /**
   * Read image as base64 with size validation
   */
  private async readImageAsBase64(imageUri: string): Promise<string> {
    try {
      // Check file size first
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!fileInfo.exists) {
        throw new AppError(
          'Image file not found',
          ErrorCode.IMAGE_INVALID_FILE,
          'camera',
          false,
          'Image file not found. Please try capturing again.'
        );
      }

      const fileSizeMB = fileInfo.size / (1024 * 1024);
      console.log(`[AIVendorEngine] Image size: ${fileSizeMB.toFixed(2)}MB`);

      if (fileSizeMB > this.MAX_IMAGE_SIZE_MB) {
        throw new AppError(
          `Image too large: ${fileSizeMB.toFixed(2)}MB`,
          ErrorCode.IMAGE_PROCESSING_FAILED,
          'camera',
          true,
          `Image is too large (${fileSizeMB.toFixed(1)}MB). Please use a smaller image or enable auto-crop.`
        );
      }

      // Read as base64 using the current API (will need migration later)
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      
      return base64;
    } catch (error) {
      console.error('[AIVendorEngine] Failed to read image:', error);
      
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to read image file',
        ErrorCode.IMAGE_INVALID_FILE,
        'camera',
        true,
        'Failed to read image file. Please try again.'
      );
    }
  }

  /**
   * Convert structured output to OCR result
   */
  private convertToOCRResult(output: {
    storeName: string;
    date: string | null;
    totalAmount: number | null;
    lineItems: Array<{ description: string; amount: number }>;
    rawText: string;
  }): OCRResult {
    return {
      storeName: output.storeName || '',
      date: output.date ? new Date(output.date) : null,
      totalAmount: output.totalAmount,
      lineItems: output.lineItems.map((item) => ({
        description: item.description,
        amount: item.amount,
      })),
      rawText: output.rawText || '',
      confidence: 0.95, // Structured outputs have high confidence
    };
  }
}
