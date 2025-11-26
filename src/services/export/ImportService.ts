import { storage } from '@/src/services/storage';
import { AppError, ErrorCode, ImportResult, ImportStrategy, Receipt } from '@/src/types';
import { decryptDataWithPassword } from '@/src/utils/encryption';
import { Directory, File, Paths } from 'expo-file-system';
import { unzip } from 'react-native-zip-archive';

/**
 * Import service for restoring encrypted backups
 */
export class ImportService {
  /**
   * Import receipts from an encrypted ZIP file
   */
  async importData(
    zipUri: string,
    password: string,
    strategy: ImportStrategy = 'merge'
  ): Promise<ImportResult> {
    const tempDir = new Directory(Paths.cache, `import_${Date.now()}`);
    
    try {
      // Create temporary directory
      tempDir.create({ intermediates: true });
      
      // Unzip file
      await unzip(zipUri, tempDir.uri);
      
      // Read salt
      const saltFile = new File(tempDir.uri, 'salt.txt');
      
      if (!saltFile.exists) {
        throw new Error('Invalid backup file: salt not found');
      }
      
      const salt = await saltFile.text();
      
      // Read encrypted metadata
      const metadataFile = new File(tempDir.uri, 'metadata.enc');
      
      if (!metadataFile.exists) {
        throw new Error('Invalid backup file: metadata not found');
      }
      
      const encryptedMetadata = await metadataFile.text();
      
      // Decrypt metadata
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
      
      // Parse metadata
      let metadata: any;
      try {
        metadata = JSON.parse(metadataJson);
      } catch {
        throw new Error('Invalid backup file: corrupted metadata');
      }
      
      // Validate metadata structure
      if (!metadata.receipts || !Array.isArray(metadata.receipts)) {
        throw new Error('Invalid backup file: invalid structure');
      }
      
      // Get existing receipts
      const existingReceipts = await storage.getAllReceipts();
      const existingIds = new Set(existingReceipts.map((r) => r.id));
      
      // Process receipts based on strategy
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];
      
      for (const receiptData of metadata.receipts) {
        try {
          const receiptId = receiptData.id;
          const exists = existingIds.has(receiptId);
          
          // Apply strategy
          if (exists) {
            if (strategy === 'skip') {
              skipped++;
              continue;
            } else if (strategy === 'replace') {
              await storage.deleteReceipt(receiptId);
            }
            // 'merge' will overwrite existing
          }
          
          // Convert dates back to Date objects
          const receipt: Receipt = {
            ...receiptData,
            date: new Date(receiptData.date),
            createdAt: new Date(receiptData.createdAt),
            updatedAt: new Date(receiptData.updatedAt),
          };
          
          // Import image
          const imagesDir = new Directory(tempDir.uri, 'images');
          if (imagesDir.exists) {
            const imageFiles = imagesDir.list();
            const imageFile = imageFiles.find((f) => f instanceof File && f.uri.includes(receiptId));
            
            if (imageFile && imageFile instanceof File) {
              const newImageUri = await storage.saveImage(imageFile.uri, receiptId);
              receipt.imageUri = newImageUri;
            }
          }
          
          // Save receipt
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
      
      // Clean up temp directory
      if (tempDir.exists) {
        tempDir.delete();
      }
      
      return {
        success: true,
        imported,
        skipped,
        errors,
      };
    } catch (error) {
      // Clean up on error
      try {
        if (tempDir.exists) {
          tempDir.delete();
        }
      } catch {}
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError(
        `Import failed: ${error}`,
        ErrorCode.EXPORT_CORRUPTED_DATA,
        'import',
        true,
        error instanceof Error ? error.message : 'Failed to import data. Please try again.'
      );
    }
  }
  
  /**
   * Validate a backup file without importing
   */
  async validateBackup(zipUri: string, password: string): Promise<boolean> {
    const tempDir = new Directory(Paths.cache, `validate_${Date.now()}`);
    
    try {
      tempDir.create({ intermediates: true });
      await unzip(zipUri, tempDir.uri);
      
      // Check for required files
      const saltFile = new File(tempDir.uri, 'salt.txt');
      const metadataFile = new File(tempDir.uri, 'metadata.enc');
      
      if (!saltFile.exists || !metadataFile.exists) {
        return false;
      }
      
      // Try to decrypt
      const salt = await saltFile.text();
      const encryptedMetadata = await metadataFile.text();
      
      try {
        const metadataJson = await decryptDataWithPassword(encryptedMetadata, password, salt);
        const metadata = JSON.parse(metadataJson);
        
        return metadata.receipts && Array.isArray(metadata.receipts);
      } catch {
        return false;
      }
    } catch {
      return false;
    } finally {
      try {
        if (tempDir.exists) {
          tempDir.delete();
        }
      } catch {}
    }
  }
}

export const importService = new ImportService();
