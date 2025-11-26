import { AppError, ErrorCode } from '@/src/types';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Image storage service using Expo FileSystem
 */
export class ImageStorage {
  private readonly imageDir: string;

  constructor() {
    // Store images in the document directory
    this.imageDir = `${FileSystem.documentDirectory}receipts/`;
  }

  /**
   * Initialize image storage directory
   */
  async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.imageDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.imageDir, {
          intermediates: true,
        });
      }
    } catch (error) {
      throw new AppError(
        `Failed to initialize image directory: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        false,
        'Failed to initialize image storage. Please restart the app.'
      );
    }
  }

  /**
   * Save an image to storage
   * @param imageUri - Source image URI
   * @param receiptId - Receipt ID to use as filename
   * @returns The new image URI in storage
   */
  async saveImage(imageUri: string, receiptId: string): Promise<string> {
    try {
      const extension = this.getImageExtension(imageUri);
      const destinationUri = `${this.imageDir}${receiptId}${extension}`;

      // Copy the image to our storage directory
      await FileSystem.copyAsync({
        from: imageUri,
        to: destinationUri,
      });

      return destinationUri;
    } catch (error) {
      throw new AppError(
        `Failed to save image: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to save receipt image. Please try again.'
      );
    }
  }

  /**
   * Get an image URI by receipt ID
   * @param receiptId - Receipt ID
   * @returns Image URI or null if not found
   */
  async getImage(receiptId: string): Promise<string | null> {
    try {
      // Try common image extensions
      const extensions = ['.jpg', '.jpeg', '.png'];

      for (const ext of extensions) {
        const imageUri = `${this.imageDir}${receiptId}${ext}`;
        const fileInfo = await FileSystem.getInfoAsync(imageUri);

        if (fileInfo.exists) {
          return imageUri;
        }
      }

      return null;
    } catch (error) {
      throw new AppError(
        `Failed to get image: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to retrieve receipt image. Please try again.'
      );
    }
  }

  /**
   * Delete an image by receipt ID
   * @param receiptId - Receipt ID
   */
  async deleteImage(receiptId: string): Promise<void> {
    try {
      // Try to delete all possible image extensions
      const extensions = ['.jpg', '.jpeg', '.png'];

      for (const ext of extensions) {
        const imageUri = `${this.imageDir}${receiptId}${ext}`;
        const fileInfo = await FileSystem.getInfoAsync(imageUri);

        if (fileInfo.exists) {
          await FileSystem.deleteAsync(imageUri, { idempotent: true });
        }
      }
    } catch (error) {
      throw new AppError(
        `Failed to delete image: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to delete receipt image. Please try again.'
      );
    }
  }

  /**
   * Get all image URIs
   * @returns Array of image URIs
   */
  async getAllImages(): Promise<string[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.imageDir);
      return files.map((file) => `${this.imageDir}${file}`);
    } catch (error) {
      throw new AppError(
        `Failed to get all images: ${error}`,
        ErrorCode.STORAGE_FILE_SYSTEM_ERROR,
        'storage',
        true,
        'Failed to retrieve images. Please try again.'
      );
    }
  }

  /**
   * Get storage usage information
   * @returns Object with total size in bytes
   */
  async getStorageInfo(): Promise<{ totalSize: number; imageCount: number }> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.imageDir);
      let totalSize = 0;

      for (const file of files) {
        const fileUri = `${this.imageDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size || 0;
        }
      }

      return {
        totalSize,
        imageCount: files.length,
      };
    } catch {
      return {
        totalSize: 0,
        imageCount: 0,
      };
    }
  }

  /**
   * Extract file extension from URI
   */
  private getImageExtension(uri: string): string {
    const match = uri.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    return match ? match[0].toLowerCase() : '.jpg';
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const files = await FileSystem.readDirectoryAsync(cacheDir);

        for (const file of files) {
          if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            const fileUri = `${cacheDir}${file}`;
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
          }
        }
      }
    } catch (error) {
      // Silently fail - cleanup is not critical
      console.warn('Failed to cleanup temp files:', error);
    }
  }
}
