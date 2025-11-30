import { AppSettings, IStorageAdapter, Receipt } from '@/src/types';
import { AsyncStorageSettings } from './AsyncStorageSettings';
import { ImageStorage } from './ImageStorage';
import { SQLiteStorage } from './SQLiteStorage';

/**
 * Unified storage service that combines SQLite and FileSystem storage
 */
export class PaperkeepStorage implements IStorageAdapter {
  private sqliteStorage: SQLiteStorage;
  private imageStorage: ImageStorage;
  private initialized = false;
  private sqliteAvailable = false;

  constructor() {
    this.sqliteStorage = new SQLiteStorage();
    this.imageStorage = new ImageStorage();
  }

  /**
   * Initialize all storage systems
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[PaperkeepStorage] Already initialized');
      return;
    }

    console.log('[PaperkeepStorage] Starting initialization...');

    // Try to initialize SQLite, but don't fail if it's not available
    try {
      await this.sqliteStorage.initialize();
      this.sqliteAvailable = true;
      console.log('[PaperkeepStorage] SQLite initialized successfully');
    } catch (error) {
      console.warn('[PaperkeepStorage] SQLite not available, using AsyncStorage for settings:', error);
      this.sqliteAvailable = false;
      // Note: Receipts will not work without SQLite, but settings will use AsyncStorage fallback
    }

    // Always initialize image storage
    try {
      await this.imageStorage.initialize();
      console.log('[PaperkeepStorage] Image storage initialized successfully');
    } catch (error) {
      console.error('[PaperkeepStorage] Failed to initialize image storage:', error);
      throw new Error('Failed to initialize image storage. Please restart the app.');
    }

    this.initialized = true;
    console.log('[PaperkeepStorage] Initialization complete (SQLite: ' + this.sqliteAvailable + ')');
  }

  /**
   * Ensure storage is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'Storage not initialized. The app is still starting up. Please wait.'
      );
    }
  }

  /**
   * Check if storage is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Check if SQLite is available
   */
  isSQLiteAvailable(): boolean {
    return this.sqliteAvailable;
  }

  // Receipt metadata operations (delegated to SQLiteStorage)

  async saveReceipt(receipt: Receipt): Promise<void> {
    this.ensureInitialized();
    if (!this.sqliteAvailable) {
      throw new Error('Receipt storage is not available. SQLite database could not be initialized. Please restart the app.');
    }
    return this.sqliteStorage.saveReceipt(receipt);
  }

  async getReceipt(id: string): Promise<Receipt | null> {
    this.ensureInitialized();
    if (!this.sqliteAvailable) {
      console.warn('[PaperkeepStorage] SQLite not available, cannot get receipt');
      throw new Error('Receipt storage is not available. Please restart the app.');
    }
    return this.sqliteStorage.getReceipt(id);
  }

  async getAllReceipts(): Promise<Receipt[]> {
    this.ensureInitialized();
    if (!this.sqliteAvailable) {
      console.warn('[PaperkeepStorage] SQLite not available, returning empty receipts list');
      // Return empty array instead of throwing to allow app to function
      return [];
    }
    return this.sqliteStorage.getAllReceipts();
  }

  async updateReceipt(
    id: string,
    updates: Partial<Receipt>
  ): Promise<void> {
    this.ensureInitialized();
    if (!this.sqliteAvailable) {
      throw new Error('Receipt storage is not available. SQLite database could not be initialized. Please restart the app.');
    }
    return this.sqliteStorage.updateReceipt(id, updates);
  }

  async deleteReceipt(id: string): Promise<void> {
    this.ensureInitialized();
    if (!this.sqliteAvailable) {
      throw new Error('Receipt storage is not available. SQLite database could not be initialized. Please restart the app.');
    }
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

  // Settings operations (use AsyncStorage as fallback if SQLite not available)

  async saveSettings(settings: AppSettings): Promise<void> {
    this.ensureInitialized();
    
    if (this.sqliteAvailable) {
      return this.sqliteStorage.saveSettings(settings);
    } else {
      return AsyncStorageSettings.saveSettings(settings);
    }
  }

  async getSettings(): Promise<AppSettings> {
    this.ensureInitialized();
    
    if (this.sqliteAvailable) {
      return this.sqliteStorage.getSettings();
    } else {
      return AsyncStorageSettings.getSettings();
    }
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
