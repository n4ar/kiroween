import { IOCREngine, OCRResult } from '@/src/types';

/**
 * Manual entry OCR engine
 * Returns empty result for manual data entry
 */
export class ManualEngine implements IOCREngine {
  name = 'Manual Entry';

  /**
   * Process image (returns empty result for manual entry)
   */
  async process(
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<OCRResult> {
    // Report immediate completion
    if (onProgress) {
      onProgress(100);
    }

    // Return empty OCR result
    return {
      storeName: '',
      date: null,
      totalAmount: null,
      lineItems: [],
      rawText: '',
      confidence: 0,
    };
  }

  /**
   * Check if engine is available (always true for manual entry)
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }
}
