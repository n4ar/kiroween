import { AppSettings, Receipt } from './receipt';

/**
 * Storage adapter interface for data persistence
 */
export interface IStorageAdapter {
  // Receipt metadata operations
  saveReceipt(receipt: Receipt): Promise<void>;
  getReceipt(id: string): Promise<Receipt | null>;
  getAllReceipts(): Promise<Receipt[]>;
  updateReceipt(id: string, updates: Partial<Receipt>): Promise<void>;
  deleteReceipt(id: string): Promise<void>;

  // Image operations
  saveImage(imageUri: string, receiptId: string): Promise<string>;
  getImage(receiptId: string): Promise<string | null>;
  deleteImage(receiptId: string): Promise<void>;

  // Settings operations
  saveSettings(settings: AppSettings): Promise<void>;
  getSettings(): Promise<AppSettings>;
}
