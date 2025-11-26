import { AppError, ErrorCode, IOCREngine, OCREngineType, OCRResult } from '@/src/types';

/**
 * OCR service that manages multiple OCR engines
 */
export class OCRService {
  private engines: Map<OCREngineType, IOCREngine> = new Map();
  private defaultEngine: OCREngineType = 'manual';

  /**
   * Register an OCR engine
   */
  registerEngine(type: OCREngineType, engine: IOCREngine): void {
    this.engines.set(type, engine);
  }

  /**
   * Set the default OCR engine
   */
  setDefaultEngine(type: OCREngineType): void {
    if (!this.engines.has(type)) {
      throw new Error(`OCR engine '${type}' is not registered`);
    }
    this.defaultEngine = type;
  }

  /**
   * Get the default OCR engine
   */
  getDefaultEngine(): OCREngineType {
    return this.defaultEngine;
  }

  /**
   * Get an OCR engine by type
   */
  getEngine(type: OCREngineType): IOCREngine | undefined {
    return this.engines.get(type);
  }

  /**
   * Check if an engine is available
   */
  async isEngineAvailable(type: OCREngineType): Promise<boolean> {
    const engine = this.engines.get(type);
    if (!engine) return false;
    return engine.isAvailable();
  }

  /**
   * Process a receipt image with the specified OCR engine
   */
  async processReceipt(
    imageUri: string,
    engineType?: OCREngineType,
    onProgress?: (progress: number) => void
  ): Promise<OCRResult> {
    const type = engineType || this.defaultEngine;
    const engine = this.engines.get(type);

    if (!engine) {
      throw new AppError(
        `OCR engine '${type}' is not registered`,
        ErrorCode.OCR_MODEL_LOADING_FAILED,
        'ocr',
        false,
        `OCR engine '${type}' is not available. Please select a different engine.`
      );
    }

    const isAvailable = await engine.isAvailable();
    if (!isAvailable) {
      throw new AppError(
        `OCR engine '${type}' is not available`,
        ErrorCode.OCR_MODEL_LOADING_FAILED,
        'ocr',
        false,
        `OCR engine '${type}' is not available. Please select a different engine.`
      );
    }

    try {
      const result = await engine.process(imageUri, onProgress);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `OCR processing failed: ${error}`,
        ErrorCode.OCR_PROCESSING_TIMEOUT,
        'ocr',
        true,
        'Failed to process receipt. Please try again.'
      );
    }
  }

  /**
   * Get list of available engines
   */
  async getAvailableEngines(): Promise<OCREngineType[]> {
    const available: OCREngineType[] = [];

    for (const [type, engine] of this.engines.entries()) {
      if (await engine.isAvailable()) {
        available.push(type);
      }
    }

    return available;
  }

  /**
   * Get engine information
   */
  getEngineInfo(type: OCREngineType): { name: string; available: boolean } | null {
    const engine = this.engines.get(type);
    if (!engine) return null;

    return {
      name: engine.name,
      available: false, // Will be updated asynchronously
    };
  }
}

// Export singleton instance
export const ocrService = new OCRService();
