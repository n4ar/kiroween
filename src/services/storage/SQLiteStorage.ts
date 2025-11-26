import { AppError, AppSettings, ErrorCode, Receipt } from '@/src/types';
import * as SQLite from 'expo-sqlite';
import { StorageAdapter } from './StorageAdapter';

/**
 * SQLite implementation of storage adapter for receipt metadata
 */
export class SQLiteStorage extends StorageAdapter {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'paperkeep.db';

  /**
   * Initialize the database and create tables
   */
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(this.dbName);

      // Enable WAL mode for better performance
      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        
        CREATE TABLE IF NOT EXISTS receipts (
          id TEXT PRIMARY KEY,
          store_name TEXT NOT NULL,
          date INTEGER NOT NULL,
          total_amount INTEGER NOT NULL,
          tags TEXT NOT NULL,
          notes TEXT,
          ocr_text TEXT NOT NULL,
          image_uri TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date DESC);
        CREATE INDEX IF NOT EXISTS idx_receipts_store ON receipts(store_name);
        
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    } catch (error) {
      throw new AppError(
        `Failed to initialize database: ${error}`,
        ErrorCode.STORAGE_DATABASE_CORRUPTION,
        'storage',
        false,
        'Failed to initialize the database. Please restart the app.'
      );
    }
  }

  /**
   * Get database instance
   */
  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new AppError(
        'Database not initialized',
        ErrorCode.STORAGE_DATABASE_CORRUPTION,
        'storage',
        false,
        'Database is not ready. Please restart the app.'
      );
    }
    return this.db;
  }

  /**
   * Save a receipt to the database
   */
  async saveReceipt(receipt: Receipt): Promise<void> {
    this.validateReceipt(receipt);
    const db = this.getDb();

    try {
      await db.runAsync(
        `INSERT INTO receipts (
          id, store_name, date, total_amount, tags, notes, 
          ocr_text, image_uri, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        receipt.id,
        receipt.storeName,
        receipt.date.getTime(),
        receipt.totalAmount,
        JSON.stringify(receipt.tags),
        receipt.notes || null,
        receipt.ocrText,
        receipt.imageUri,
        receipt.createdAt.getTime(),
        receipt.updatedAt.getTime()
      );
    } catch (error) {
      throw new AppError(
        `Failed to save receipt: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to save receipt. Please try again.'
      );
    }
  }

  /**
   * Get a receipt by ID
   */
  async getReceipt(id: string): Promise<Receipt | null> {
    const db = this.getDb();

    try {
      const row = await db.getFirstAsync<any>(
        'SELECT * FROM receipts WHERE id = ?',
        id
      );

      if (!row) return null;

      return this.mapRowToReceipt(row);
    } catch (error) {
      throw new AppError(
        `Failed to get receipt: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to retrieve receipt. Please try again.'
      );
    }
  }

  /**
   * Get all receipts
   */
  async getAllReceipts(): Promise<Receipt[]> {
    const db = this.getDb();

    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM receipts ORDER BY date DESC'
      );

      return rows.map((row) => this.mapRowToReceipt(row));
    } catch (error) {
      throw new AppError(
        `Failed to get receipts: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to retrieve receipts. Please try again.'
      );
    }
  }

  /**
   * Update a receipt
   */
  async updateReceipt(
    id: string,
    updates: Partial<Receipt>
  ): Promise<void> {
    const db = this.getDb();

    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.storeName !== undefined) {
        fields.push('store_name = ?');
        values.push(updates.storeName);
      }
      if (updates.date !== undefined) {
        fields.push('date = ?');
        values.push(updates.date.getTime());
      }
      if (updates.totalAmount !== undefined) {
        fields.push('total_amount = ?');
        values.push(updates.totalAmount);
      }
      if (updates.tags !== undefined) {
        fields.push('tags = ?');
        values.push(JSON.stringify(updates.tags));
      }
      if (updates.notes !== undefined) {
        fields.push('notes = ?');
        values.push(updates.notes);
      }
      if (updates.ocrText !== undefined) {
        fields.push('ocr_text = ?');
        values.push(updates.ocrText);
      }
      if (updates.imageUri !== undefined) {
        fields.push('image_uri = ?');
        values.push(updates.imageUri);
      }

      // Always update updatedAt
      fields.push('updated_at = ?');
      values.push(Date.now());

      values.push(id);

      await db.runAsync(
        `UPDATE receipts SET ${fields.join(', ')} WHERE id = ?`,
        ...values
      );
    } catch (error) {
      throw new AppError(
        `Failed to update receipt: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to update receipt. Please try again.'
      );
    }
  }

  /**
   * Delete a receipt
   */
  async deleteReceipt(id: string): Promise<void> {
    const db = this.getDb();

    try {
      await db.runAsync('DELETE FROM receipts WHERE id = ?', id);
    } catch (error) {
      throw new AppError(
        `Failed to delete receipt: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to delete receipt. Please try again.'
      );
    }
  }

  /**
   * Save image (delegated to ImageStorage)
   */
  async saveImage(imageUri: string, receiptId: string): Promise<string> {
    // This will be implemented by ImageStorage
    throw new Error('saveImage should be handled by ImageStorage');
  }

  /**
   * Get image (delegated to ImageStorage)
   */
  async getImage(receiptId: string): Promise<string | null> {
    // This will be implemented by ImageStorage
    throw new Error('getImage should be handled by ImageStorage');
  }

  /**
   * Delete image (delegated to ImageStorage)
   */
  async deleteImage(receiptId: string): Promise<void> {
    // This will be implemented by ImageStorage
    throw new Error('deleteImage should be handled by ImageStorage');
  }

  /**
   * Save settings
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    const db = this.getDb();

    try {
      const settingsJson = JSON.stringify(settings);
      await db.runAsync(
        `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`,
        'app_settings',
        settingsJson
      );
    } catch (error) {
      throw new AppError(
        `Failed to save settings: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to save settings. Please try again.'
      );
    }
  }

  /**
   * Get settings
   */
  async getSettings(): Promise<AppSettings> {
    const db = this.getDb();

    try {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        'app_settings'
      );

      if (!row) {
        // Return default settings
        return {
          ocrEngine: 'manual',
          autoCrop: true,
          tesseractLanguage: 'eng',
          theme: 'auto',
        };
      }

      return JSON.parse(row.value);
    } catch {
      // Return default settings on error
      return {
        ocrEngine: 'manual',
        autoCrop: true,
        tesseractLanguage: 'eng',
        theme: 'auto',
      };
    }
  }

  /**
   * Map database row to Receipt object
   */
  private mapRowToReceipt(row: any): Receipt {
    return {
      id: row.id,
      storeName: row.store_name,
      date: new Date(row.date),
      totalAmount: row.total_amount,
      tags: JSON.parse(row.tags),
      notes: row.notes,
      ocrText: row.ocr_text,
      imageUri: row.image_uri,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}
