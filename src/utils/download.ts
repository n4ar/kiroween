import { AppError, ErrorCode } from '@/src/types';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Download utility for saving images to device
 */
export class DownloadUtil {
  /**
   * Download an image to the device
   * On iOS/Android: Saves to photo library
   * On Web: Triggers browser download
   */
  static async downloadImage(imageUri: string, filename?: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await this.downloadImageWeb(imageUri, filename);
      } else {
        await this.downloadImageNative(imageUri, filename);
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new AppError(
        `Failed to download image: ${error}`,
        ErrorCode.STORAGE_ERROR,
        'storage',
        true,
        'Failed to download image. Please check permissions and try again.'
      );
    }
  }

  /**
   * Download image on native platforms (iOS/Android)
   */
  private static async downloadImageNative(imageUri: string, filename?: string): Promise<void> {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      throw new AppError(
        'Media library permission denied',
        ErrorCode.PERMISSION_DENIED,
        'storage',
        true,
        'Permission to access photo library is required to download images.'
      );
    }

    // Check if sharing is available as fallback
    const canShare = await Sharing.isAvailableAsync();

    try {
      // Try to save to media library
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      
      // Optionally create an album and add the asset
      if (filename) {
        const albumName = 'Resight';
        let album = await MediaLibrary.getAlbumAsync(albumName);
        
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      }
    } catch (error) {
      // Fallback to sharing if media library fails
      if (canShare) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save Receipt Image',
          UTI: 'public.jpeg',
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Download image on web platform
   */
  private static async downloadImageWeb(imageUri: string, filename?: string): Promise<void> {
    const name = filename || `receipt-${Date.now()}.jpg`;
    
    try {
      // Fetch the image
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Web download failed:', error);
      throw error;
    }
  }

  /**
   * Share an image using the native share dialog
   */
  static async shareImage(imageUri: string): Promise<void> {
    try {
      const canShare = await Sharing.isAvailableAsync();
      
      if (!canShare) {
        throw new AppError(
          'Sharing not available',
          ErrorCode.FEATURE_NOT_AVAILABLE,
          'storage',
          true,
          'Sharing is not available on this device.'
        );
      }

      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share Receipt Image',
        UTI: 'public.jpeg',
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      throw new AppError(
        `Failed to share image: ${error}`,
        ErrorCode.STORAGE_ERROR,
        'storage',
        true,
        'Failed to share image. Please try again.'
      );
    }
  }
}
