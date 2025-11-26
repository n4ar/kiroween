import { AppSettings, IStorageAdapter, Receipt } from '@/src/types';

/**
 * Base storage adapter class
 * Provides a unified interface for all storage operations
 */
export abstract class StorageAdapter implements IStorageAdapter {
  // Receipt metadata operations
  abstract saveReceipt(receipt: Receipt): Promise<void>;
  abstract getReceipt(id: string): Promise<Receipt | null>;
  abstract getAllReceipts(): Promise<Receipt[]>;
  abstract updateReceipt(
    id: string,
    updates: Partial<Receipt>
  ): Promise<void>;
  abstract deleteReceipt(id: string): Promise<void>;

  // Image operations
  abstract saveImage(imageUri: string, receiptId: string): Promise<string>;
  abstract getImage(receiptId: string): Promise<string | null>;
  abstract deleteImage(receiptId: string): Promise<void>;

  // Settings operations
  abstract saveSettings(settings: AppSettings): Promise<void>;
  abstract getSettings(): Promise<AppSettings>;

  /**
   * Validate receipt data before persistence
   */
  protected validateReceipt(receipt: Receipt): void {
    if (!receipt.id) throw new Error('Receipt ID is required');
    if (!receipt.storeName) throw new Error('Store name is required');
    if (!receipt.date) throw new Error('Date is required');
    if (receipt.totalAmount === undefined || receipt.totalAmount === null) {
      throw new Error('Total amount is required');
    }
    if (!Array.isArray(receipt.tags)) throw new Error('Tags must be an array');
    if (receipt.ocrText === undefined || receipt.ocrText === null) {
      throw new Error('OCR text is required (can be empty string)');
    }
    if (!receipt.imageUri) throw new Error('Image URI is required');
    if (!receipt.createdAt) throw new Error('Created at is required');
    if (!receipt.updatedAt) throw new Error('Updated at is required');
  }
}
