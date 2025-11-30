import { AppError, ErrorCode, IOCREngine, OCREngineType, OCRResult } from '@/src/types';

/**
 * OCR service that manages multiple OCR engines
 */
export class OCRService {
  private engines: Map<OCREngineType, IOCREngine> = new Map();
  private defaultEngine: OCREngineType = 'manual';
  private processingCount = 0;

  /**
   * Register an OCR engine
   */
  registerEngine(type: OCREngineType, engine: IOCREngine): void {
    if (this.engines.has(type)) {
      console.warn(`[OCRService] Engine '${type}' is already registered, overwriting`);
    }
    console.log(`[OCRService] Registering engine: ${type} (${engine.name})`);
    this.engines.set(type, engine);
  }

  /**
   * Set the default OCR engine
   */
  setDefaultEngine(type: OCREngineType): void {
    if (!this.engines.has(type)) {
      console.warn(`[OCRService] Engine '${type}' is not registered, keeping current default: ${this.defaultEngine}`);
      return;
    }
    console.log(`[OCRService] Setting default engine to: ${type}`);
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
    
    // Validate image URI
    if (!imageUri || imageUri.trim() === '') {
      throw new AppError(
        'Invalid image URI',
        ErrorCode.IMAGE_INVALID_FILE,
        'camera',
        false,
        'Invalid image. Please try capturing again.'
      );
    }

    const engine = this.engines.get(type);

    if (!engine) {
      console.error(`[OCRService] Engine '${type}' not found. Available engines:`, Array.from(this.engines.keys()));
      throw new AppError(
        `OCR engine '${type}' is not registered`,
        ErrorCode.OCR_MODEL_LOADING_FAILED,
        'ocr',
        false,
        `OCR engine '${type}' is not available. Please select a different engine in settings.`
      );
    }

    // Check availability before processing
    let isAvailable = false;
    try {
      isAvailable = await engine.isAvailable();
    } catch (error) {
      console.error(`[OCRService] Error checking engine availability:`, error);
      throw new AppError(
        `Failed to check engine availability: ${error}`,
        ErrorCode.OCR_MODEL_LOADING_FAILED,
        'ocr',
        true,
        `Failed to initialize OCR engine. Please try again.`
      );
    }

    if (!isAvailable) {
      throw new AppError(
        `OCR engine '${type}' is not available`,
        ErrorCode.OCR_MODEL_LOADING_FAILED,
        'ocr',
        false,
        `OCR engine '${type}' is not available. Please configure it in settings or select a different engine.`
      );
    }

    // Use operation lock to prevent concurrent processing
    const lockKey = `ocr_${imageUri}`;
    
    try {
      this.processingCount++;
      console.log(`[OCRService] Processing with engine: ${type} (active: ${this.processingCount})`);

      // Warn if too many concurrent operations
      if (this.processingCount > 2) {
        console.warn(`[OCRService] High concurrent processing count: ${this.processingCount}`);
      }

      const result = await engine.process(imageUri, onProgress);
      
      // Validate result
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid OCR result');
      }

      return result;
    } catch (error) {
      console.error(`[OCRService] Processing failed:`, error);
      
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
    } finally {
      this.processingCount--;
    }
  }

  /**
   * Get current processing count
   */
  getProcessingCount(): number {
    return this.processingCount;
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
