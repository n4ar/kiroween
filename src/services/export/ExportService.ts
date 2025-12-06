import { storage } from '@/src/services/storage';
import { AppError, ErrorCode } from '@/src/types';
import { encryptDataWithPassword } from '@/src/utils/encryption';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { zip } from 'react-native-zip-archive';

export class ExportService {
  async exportData(password: string): Promise<string> {
    const tempDir = `${FileSystem.cacheDirectory}export_${Date.now()}/`;
    
    try {
      await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      
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
      
      const metadataJson = JSON.stringify(metadata, null, 2);
      const { encrypted, salt } = await encryptDataWithPassword(metadataJson, password);
      
      await FileSystem.writeAsStringAsync(`${tempDir}metadata.enc`, encrypted);
      await FileSystem.writeAsStringAsync(`${tempDir}salt.txt`, salt);
      
      const imagesDir = `${tempDir}images/`;
      await FileSystem.makeDirectoryAsync(imagesDir);
      
      for (const receipt of receipts) {
        const imageUri = await storage.getImage(receipt.id);
        if (imageUri) {
          const extension = imageUri.split('.').pop() || 'jpg';
          await FileSystem.copyAsync({
            from: imageUri,
            to: `${imagesDir}${receipt.id}.${extension}`,
          });
        }
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipFileName = `resight-backup-${timestamp}.zip`;
      const zipPath = `${FileSystem.documentDirectory}${zipFileName}`;
      
      await zip(tempDir, zipPath);
      await FileSystem.deleteAsync(tempDir, { idempotent: true });
      
      return zipPath;
    } catch (error) {
      try {
        await FileSystem.deleteAsync(tempDir, { idempotent: true });
      } catch {}
      
      if (error instanceof AppError) throw error;
      
      throw new AppError(
        `Export failed: ${error}`,
        ErrorCode.EXPORT_INSUFFICIENT_STORAGE,
        'import',
        true,
        'Failed to export data. Please try again.'
      );
    }
  }
  
  async shareExport(zipPath: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }
      
      await Sharing.shareAsync(zipPath, {
        mimeType: 'application/zip',
        dialogTitle: 'Export Resight Data',
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
