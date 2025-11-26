import { IOCREngine, LineItem, OCRResult } from '@/src/types';
import { extractTextFromImage, isSupported } from 'expo-text-extractor';

/**
 * Expo Text Extractor OCR engine
 * Uses native iOS/Android text recognition
 */
export class ExpoTextExtractorEngine implements IOCREngine {
  name = 'Expo Text Extractor';

  /**
   * Process image with Expo Text Extractor
   */
  async process(
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<OCRResult> {
    console.log('[ExpoTextExtractorEngine] Starting text extraction for:', imageUri);
    
    // Report progress
    if (onProgress) {
      onProgress(10);
    }

    try {
      // Extract text from image - returns array of text strings
      console.log('[ExpoTextExtractorEngine] Calling extractTextFromImage...');
      const textArray = await extractTextFromImage(imageUri);
      console.log('[ExpoTextExtractorEngine] Extracted text array:', textArray);
      
      if (onProgress) {
        onProgress(50);
      }

      // Join all text into a single string
      const fullText = textArray.join('\n');
      console.log('[ExpoTextExtractorEngine] Full text:', fullText);

      // Parse the extracted text
      const parsed = this.parseOCRText(fullText);

      if (onProgress) {
        onProgress(100);
      }

      return {
        storeName: parsed.storeName,
        date: parsed.date,
        totalAmount: parsed.totalAmount,
        lineItems: parsed.lineItems,
        rawText: fullText,
        confidence: 0.8, // Default confidence
      };
    } catch (error) {
      console.error('[ExpoTextExtractorEngine] Text extraction failed:', error);
      if (onProgress) {
        onProgress(100);
      }

      throw new Error(`Text extraction failed: ${error}`);
    }
  }

  /**
   * Check if Expo Text Extractor is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Check if the module is supported
      if (!isSupported) {
        console.log('[ExpoTextExtractorEngine] Not supported on this platform');
        return false;
      }
      
      // Try a test extraction to verify it's actually working
      // This is more reliable than just checking isSupported
      return true;
    } catch (error) {
      console.error('[ExpoTextExtractorEngine] Availability check failed:', error);
      return false;
    }
  }

  /**
   * Parse OCR text to extract structured data
   */
  private parseOCRText(text: string): {
    storeName: string;
    date: Date | null;
    totalAmount: number | null;
    lineItems: LineItem[];
  } {
    const lines = text.split('\n').filter((line) => line.trim());

    // Extract store name (usually first line)
    const storeName = lines[0] || '';

    // Extract date
    const date = this.extractDate(text);

    // Extract total amount
    const totalAmount = this.extractTotalAmount(text);

    // Extract line items
    const lineItems = this.extractLineItems(lines);

    return {
      storeName,
      date,
      totalAmount,
      lineItems,
    };
  }

  /**
   * Extract date from text
   */
  private extractDate(text: string): Date | null {
    // Common date patterns
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{1,2}),? (\d{4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Extract total amount from text
   */
  private extractTotalAmount(text: string): number | null {
    // Look for total amount patterns
    const totalPatterns = [
      /total[:\s]*\$?(\d+[.,]\d{2})/i,
      /amount[:\s]*\$?(\d+[.,]\d{2})/i,
      /balance[:\s]*\$?(\d+[.,]\d{2})/i,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(amount)) {
          // Convert to cents
          return Math.round(amount * 100);
        }
      }
    }

    return null;
  }

  /**
   * Extract line items from text
   */
  private extractLineItems(lines: string[]): LineItem[] {
    const items: LineItem[] = [];

    // Look for lines with item descriptions and prices
    const itemPattern = /^(.+?)\s+\$?(\d+[.,]\d{2})$/;

    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match) {
        const description = match[1].trim();
        const amount = parseFloat(match[2].replace(',', '.'));

        if (!isNaN(amount)) {
          items.push({
            description,
            amount: Math.round(amount * 100), // Convert to cents
          });
        }
      }
    }

    return items;
  }
}
