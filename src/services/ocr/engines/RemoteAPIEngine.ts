import { AppError, ErrorCode, IOCREngine, OCRResult } from '@/src/types';

/**
 * Remote API OCR engine
 * Sends image to external OCR service
 */
export class RemoteAPIEngine implements IOCREngine {
  name = 'Remote API';
  private endpoint: string;
  private timeout = 10000; // 10 seconds
  private maxRetries = 3;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * Set API endpoint
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  /**
   * Process image with remote OCR API
   */
  async process(
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<OCRResult> {
    if (!this.endpoint) {
      throw new AppError(
        'Remote API endpoint not configured',
        ErrorCode.OCR_NETWORK_ERROR,
        'ocr',
        false,
        'Remote API endpoint is not configured. Please set it in settings.'
      );
    }

    if (onProgress) {
      onProgress(10);
    }

    try {
      const result = await this.processWithRetry(imageUri, onProgress);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `Remote API OCR failed: ${error}`,
        ErrorCode.OCR_NETWORK_ERROR,
        'network',
        true,
        'Failed to process receipt with remote API. Please check your internet connection.'
      );
    }
  }

  /**
   * Process with retry logic
   */
  private async processWithRetry(
    imageUri: string,
    onProgress?: (progress: number) => void,
    attempt: number = 1
  ): Promise<OCRResult> {
    try {
      return await this.sendRequest(imageUri, onProgress);
    } catch (error) {
      if (attempt < this.maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.processWithRetry(imageUri, onProgress, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Send request to remote API
   */
  private async sendRequest(
    imageUri: string,
    onProgress?: (progress: number) => void
  ): Promise<OCRResult> {
    if (onProgress) {
      onProgress(30);
    }

    // Create form data with image
    const formData = new FormData();
    
    // Read image as blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    formData.append('image', blob, 'receipt.jpg');

    if (onProgress) {
      onProgress(50);
    }

    // Send request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const apiResponse = await fetch(this.endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!apiResponse.ok) {
        throw new Error(`API returned status ${apiResponse.status}`);
      }

      if (onProgress) {
        onProgress(80);
      }

      const data = await apiResponse.json();

      if (onProgress) {
        onProgress(100);
      }

      // Parse API response to OCRResult format
      return this.parseAPIResponse(data);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError(
          'Request timeout',
          ErrorCode.OCR_PROCESSING_TIMEOUT,
          'network',
          true,
          'Request timed out. Please try again.'
        );
      }

      throw error;
    }
  }

  /**
   * Parse API response to OCRResult format
   */
  private parseAPIResponse(data: any): OCRResult {
    // Expected API response format:
    // {
    //   storeName: string,
    //   date: string (ISO format),
    //   totalAmount: number (in cents),
    //   lineItems: Array<{ description: string, amount: number }>,
    //   rawText: string,
    //   confidence: number
    // }

    return {
      storeName: data.storeName || '',
      date: data.date ? new Date(data.date) : null,
      totalAmount: data.totalAmount || null,
      lineItems: data.lineItems || [],
      rawText: data.rawText || '',
      confidence: data.confidence || 0,
    };
  }

  /**
   * Check if remote API is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.endpoint) {
      return false;
    }

    try {
      // Try to ping the API endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(this.endpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return response.ok;
    } catch {
      return false;
    }
  }
}
