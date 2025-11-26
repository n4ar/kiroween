import { AppSettings, IStorageAdapter, Receipt } from '@/src/types';
import { ImageStorage } from './ImageStorage';
import { SQLiteStorage } from './SQLiteStorage';

/**
 * Unified storage service that combines SQLite and FileSystem storage
 */
export class PaperkeepStorage implements IStorageAdapter {
  private sqliteStorage: SQLiteStorage;
  private imageStorage: ImageStorage;
  private initialized = false;

  constructor() {
    this.sqliteStorage = new SQLiteStorage();
    this.imageStorage = new ImageStorage();
  }

  /**
   * Initialize all storage systems
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await Promise.all([
      this.sqliteStorage.initialize(),
      this.imageStorage.initialize(),
    ]);

    this.initialized = true;
  }

  /**
   * Ensure storage is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'Storage not initialized. Call initialize() first.'
      );
    }
  }

  // Receipt metadata operations (delegated to SQLiteStorage)

  async saveReceipt(receipt: Receipt): Promise<void> {
    this.ensureInitialized();
    return this.sqliteStorage.saveReceipt(receipt);
  }

  async getReceipt(id: string): Promise<Receipt | null> {
    this.ensureInitialized();
    return this.sqliteStorage.getReceipt(id);
  }

  async getAllReceipts(): Promise<Receipt[]> {
    this.ensureInitialized();
    return this.sqliteStorage.getAllReceipts();
  }

  async updateReceipt(
    id: string,
    updates: Partial<Receipt>
  ): Promise<void> {
    this.ensureInitialized();
    return this.sqliteStorage.updateReceipt(id, updates);
  }

  async deleteReceipt(id: string): Promise<void> {
    this.ensureInitialized();
    // Delete both metadata and image
    await Promise.all([
      this.sqliteStorage.deleteReceipt(id),
      this.imageStorage.deleteImage(id),
    ]);
  }

  // Image operations (delegated to ImageStorage)

  async saveImage(imageUri: string, receiptId: string): Promise<string> {
    this.ensureInitialized();
    return this.imageStorage.saveImage(imageUri, receiptId);
  }

  async getImage(receiptId: string): Promise<string | null> {
    this.ensureInitialized();
    return this.imageStorage.getImage(receiptId);
  }

  async deleteImage(receiptId: string): Promise<void> {
    this.ensureInitialized();
    return this.imageStorage.deleteImage(receiptId);
  }

  // Settings operations (delegated to SQLiteStorage)

  async saveSettings(settings: AppSettings): Promise<void> {
    this.ensureInitialized();
    return this.sqliteStorage.saveSettings(settings);
  }

  async getSettings(): Promise<AppSettings> {
    this.ensureInitialized();
    return this.sqliteStorage.getSettings();
  }

  // Additional utility methods

  /**
   * Get storage usage information
   */
  async getStorageInfo(): Promise<{
    totalSize: number;
    imageCount: number;
  }> {
    this.ensureInitialized();
    return this.imageStorage.getStorageInfo();
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    this.ensureInitialized();
    return this.imageStorage.cleanupTempFiles();
  }

  /**
   * Close all storage connections
   */
  async close(): Promise<void> {
    if (this.initialized) {
      await this.sqliteStorage.close();
      this.initialized = false;
    }
  }
}

// Export singleton instance
export const storage = new PaperkeepStorage();
