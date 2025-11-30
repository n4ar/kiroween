import { ocrService } from './OCRService';
import { AIVendorEngine, ManualEngine, NativeEngine } from './engines';

/**
 * Initialize OCR engines
 */
export function initializeOCREngines() {
  // Register all available engines
  ocrService.registerEngine('manual', new ManualEngine());
  ocrService.registerEngine('native', new NativeEngine());
  ocrService.registerEngine('ai-vendor', new AIVendorEngine());

  // Set manual as default
  ocrService.setDefaultEngine('manual');

  console.log('[OCR] Engines initialized');
}
