import { storage } from '@/src/services/storage';
import { AppError, ErrorCode } from '@/src/types';
import { encryptDataWithPassword } from '@/src/utils/encryption';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { zip } from 'react-native-zip-archive';

/**
 * Export service for creating encrypted backups
 */
export class ExportService {
  /**
   * Export all receipts to an encrypted ZIP file
   */
  async exportData(password: string): Promise<string> {
    const tempDir = new Directory(Paths.cache, `export_${Date.now()}`);
    
    try {
      // Create temporary directory
      tempDir.create({ intermediates: true });
      
      // Get all receipts
      const receipts = await storage.getAllReceipts();
      
      if (receipts.length === 0) {
        throw new AppError(
          'No receipts to export',
          ErrorCode.EXPORT_CORRUPTED_DATA,
          'import',
          false,
          'You have no receipts to export'
        );
      }
      
      // Prepare metadata
      const metadata = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        receiptCount: receipts.length,
        receipts: receipts.map((receipt) => ({
          ...receipt,
          date: receipt.date.toISOString(),
          createdAt: receipt.createdAt.toISOString(),
          updatedAt: receipt.updatedAt.toISOString(),
        })),
      };
      
      // Encrypt metadata with password
      const metadataJson = JSON.stringify(metadata, null, 2);
      const { encrypted, salt } = await encryptDataWithPassword(metadataJson, password);
      
      // Save encrypted metadata
      const metadataFile = tempDir.createFile('metadata.enc', 'text/plain');
      metadataFile.write(encrypted);
      
      // Save salt separately
      const saltFile = tempDir.createFile('salt.txt', 'text/plain');
      saltFile.write(salt);
      
      // Create images directory
      const imagesDir = new Directory(tempDir, 'images');
      imagesDir.create();
      
      // Copy images
      for (const receipt of receipts) {
        const imageUri = await storage.getImage(receipt.id);
        if (imageUri) {
          const extension = imageUri.split('.').pop() || 'jpg';
          const sourceFile = new File(imageUri);
          const destFile = imagesDir.createFile(`${receipt.id}.${extension}`, null);
          sourceFile.copy(destFile);
        }
      }
      
      // Create ZIP file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipFileName = `paperkeep-backup-${timestamp}.zip`;
      const zipFile = new Directory(Paths.document).createFile(zipFileName, 'application/zip');
      
      await zip(tempDir.uri, zipFile.uri);
      
      // Clean up temp directory
      tempDir.delete();
      
      return zipFile.uri;
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
        `Export failed: ${error}`,
        ErrorCode.EXPORT_INSUFFICIENT_STORAGE,
        'import',
        true,
        'Failed to export data. Please try again.'
      );
    }
  }
  
  /**
   * Share the exported ZIP file
   */
  async shareExport(zipPath: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }
      
      await Sharing.shareAsync(zipPath, {
        mimeType: 'application/zip',
        dialogTitle: 'Export Paperkeep Data',
      });
    } catch (error) {
      throw new AppError(
        `Failed to share export: ${error}`,
        ErrorCode.EXPORT_PERMISSION_ERROR,
        'import',
        true,
        'Failed to share export file. Please try again.'
      );
    }
  }
  
  /**
   * Get storage information
   */
  async getStorageInfo(): Promise<{
    totalSize: number;
    imageCount: number;
    receiptCount: number;
  }> {
    const receipts = await storage.getAllReceipts();
    const imageInfo = await storage.getStorageInfo();
    
    return {
      totalSize: imageInfo.totalSize,
      imageCount: imageInfo.imageCount,
      receiptCount: receipts.length,
    };
  }
}

export const exportService = new ExportService();
