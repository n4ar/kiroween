import { storage } from '@/src/services/storage';
import { AppError, ErrorCode, ImportResult, ImportStrategy, Receipt } from '@/src/types';
import { decryptDataWithPassword } from '@/src/utils/encryption';
import * as FileSystem from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';

export class ImportService {
  async importData(
    zipUri: string,
    password: string,
    strategy: ImportStrategy = 'merge'
  ): Promise<ImportResult> {
    const tempDir = `${FileSystem.cacheDirectory}import_${Date.now()}/`;
    
    try {
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      await unzip(zipUri, tempDir);
      
      const salt = await FileSystem.readAsStringAsync(`${tempDir}salt.txt`);
      const encryptedMetadata = await FileSystem.readAsStringAsync(`${tempDir}metadata.enc`);
      
      let metadataJson: string;
      try {
        metadataJson = await decryptDataWithPassword(encryptedMetadata, password, salt);
      } catch {
        throw new AppError(
          'Decryption failed',
          ErrorCode.EXPORT_CORRUPTED_DATA,
          'import',
          false,
          'Incorrect password or corrupted backup file'
        );
      }
      
      const metadata = JSON.parse(metadataJson);
      
      if (!metadata.receipts || !Array.isArray(metadata.receipts)) {
        throw new Error('Invalid backup file: invalid structure');
      }
      
      const existingReceipts = await storage.getAllReceipts();
      const existingIds = new Set(existingReceipts.map((r) => r.id));
      
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];
      
      for (const receiptData of metadata.receipts) {
        try {
          const receiptId = receiptData.id;
          const exists = existingIds.has(receiptId);
          
          if (exists) {
            if (strategy === 'skip') {
              skipped++;
              continue;
            } else if (strategy === 'replace') {
              await storage.deleteReceipt(receiptId);
            }
          }
          
          const receipt: Receipt = {
            ...receiptData,
            date: new Date(receiptData.date),
            createdAt: new Date(receiptData.createdAt),
            updatedAt: new Date(receiptData.updatedAt),
          };
          
          const imagesDir = `${tempDir}images/`;
          const imageFiles = await FileSystem.readDirectoryAsync(imagesDir);
          const imageFile = imageFiles.find((f) => f.includes(receiptId));
          
          if (imageFile) {
            const newImageUri = await storage.saveImage(`${imagesDir}${imageFile}`, receiptId);
            receipt.imageUri = newImageUri;
          }
          
          if (exists && strategy === 'merge') {
            await storage.updateReceipt(receiptId, receipt);
          } else {
            await storage.saveReceipt(receipt);
          }
          
          imported++;
        } catch (error) {
          console.error(`Failed to import receipt ${receiptData.id}:`, error);
          errors.push(`Failed to import receipt: ${receiptData.storeName}`);
          skipped++;
        }
      }
      
      await FileSystem.deleteAsync(tempDir, { idempotent: true });
      
      return {
        success: true,
        imported,
        skipped,
        errors,
      };
    } catch (error) {
      try {
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
      } catch {}
      
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        `Import failed: ${error}`,
        ErrorCode.EXPORT_CORRUPTED_DATA,
        'import',
        true,
        error instanceof Error ? error.message : 'Failed to import data. Please try again.'
      );
    }
  }
}

export const importService = new ImportService();
