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
export type OCREngineType = 'vlm' | 'tesseract' | 'remote' | 'manual';
