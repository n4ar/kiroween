import { AppError, ErrorCode, IImageProcessor } from '@/src/types';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Image processing service using Expo ImageManipulator
 * Simple compression, cropping, and resizing operations
 */
export class ImageProcessor implements IImageProcessor {
  private readonly MAX_DIMENSION = 1920;
  private readonly DEFAULT_QUALITY = 0.8;

  /**
   * Compress an image
   * @param imageUri - Source image URI
   * @param quality - Compression quality (0-1)
   * @returns Compressed image URI
   */
  async compress(imageUri: string, quality: number = this.DEFAULT_QUALITY): Promise<string> {
    try {
      // Get image dimensions first
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const { width, height } = imageInfo;
      const actions: ImageManipulator.Action[] = [];

      // Resize if dimensions exceed maximum (use >= to catch exact matches)
      if (width >= this.MAX_DIMENSION || height >= this.MAX_DIMENSION) {
        const scale = this.MAX_DIMENSION / Math.max(width, height);
        const newWidth = Math.round(width * scale);
        const newHeight = Math.round(height * scale);

        // Ensure dimensions are valid
        if (newWidth > 0 && newHeight > 0) {
          actions.push({
            resize: {
              width: newWidth,
              height: newHeight,
            },
          });
          console.log(`[ImageProcessor] Resizing from ${width}x${height} to ${newWidth}x${newHeight}`);
        }
      }

      // Apply compression
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      throw new AppError(
        `Failed to compress image: ${error}`,
        ErrorCode.IMAGE_PROCESSING_FAILED,
        'camera',
        true,
        'Failed to compress image. Please try again.'
      );
    }
  }

  /**
   * Auto-crop an image with simple margin-based cropping
   * 
   * Note: For best results, use the document scanner at capture time
   * which provides automatic edge detection and perspective correction.
   * This method only applies a simple margin-based crop.
   * 
   * @param imageUri - Source image URI
   * @returns Object with cropped image URI and success status
   */
  async autoCrop(imageUri: string): Promise<{ uri: string; cropped: boolean }> {
    try {
      console.log('[ImageProcessor] Applying simple margin-based crop');
      
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const { width, height } = imageInfo;
      
      // Validate dimensions
      if (width < 100 || height < 100) {
        console.warn('[ImageProcessor] Image too small to crop');
        return { uri: imageUri, cropped: false };
      }
      
      // Simple margin-based crop
      const horizontalMargin = 0.05; // 5% from left/right
      const verticalMargin = 0.08;   // 8% from top/bottom
      
      const cropX = Math.round(width * horizontalMargin);
      const cropY = Math.round(height * verticalMargin);
      const cropWidth = Math.round(width * (1 - 2 * horizontalMargin));
      const cropHeight = Math.round(height * (1 - 2 * verticalMargin));

      // Validate crop dimensions
      if (cropWidth <= 0 || cropHeight <= 0) {
        console.warn('[ImageProcessor] Invalid crop dimensions');
        return { uri: imageUri, cropped: false };
      }

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: cropWidth,
              height: cropHeight,
            },
          },
        ],
        {
          compress: this.DEFAULT_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log('[ImageProcessor] Simple crop applied successfully');
      return { uri: result.uri, cropped: true };
    } catch (error) {
      console.warn('[ImageProcessor] Crop failed, returning original:', error);
      return { uri: imageUri, cropped: false };
    }
  }



  /**
   * Resize an image to specific dimensions
   * @param imageUri - Source image URI
   * @param maxWidth - Maximum width
   * @param maxHeight - Maximum height
   * @returns Resized image URI
   */
  async resize(
    imageUri: string,
    maxWidth: number,
    maxHeight: number
  ): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: this.DEFAULT_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      throw new AppError(
        `Failed to resize image: ${error}`,
        ErrorCode.IMAGE_PROCESSING_FAILED,
        'camera',
        true,
        'Failed to resize image. Please try again.'
      );
    }
  }

  /**
   * Rotate an image
   * @param imageUri - Source image URI
   * @param degrees - Rotation angle in degrees (90, 180, 270)
   * @returns Rotated image URI
   */
  async rotate(imageUri: string, degrees: number): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ rotate: degrees }],
        {
          compress: this.DEFAULT_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      throw new AppError(
        `Failed to rotate image: ${error}`,
        ErrorCode.IMAGE_PROCESSING_FAILED,
        'camera',
        true,
        'Failed to rotate image. Please try again.'
      );
    }
  }

  /**
   * Crop an image to specific dimensions
   * @param imageUri - Source image URI
   * @param crop - Crop parameters
   * @returns Cropped image URI
   */
  async crop(
    imageUri: string,
    crop: {
      originX: number;
      originY: number;
      width: number;
      height: number;
    }
  ): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop }],
        {
          compress: this.DEFAULT_QUALITY,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      throw new AppError(
        `Failed to crop image: ${error}`,
        ErrorCode.IMAGE_PROCESSING_FAILED,
        'camera',
        true,
        'Failed to crop image. Please try again.'
      );
    }
  }

  /**
   * Create a thumbnail from an image
   * @param imageUri - Source image URI
   * @param size - Thumbnail size (width and height)
   * @returns Thumbnail image URI
   */
  async createThumbnail(imageUri: string, size: number = 200): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            resize: {
              width: size,
              height: size,
            },
          },
        ],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return result.uri;
    } catch (error) {
      throw new AppError(
        `Failed to create thumbnail: ${error}`,
        ErrorCode.IMAGE_PROCESSING_FAILED,
        'camera',
        true,
        'Failed to create thumbnail. Please try again.'
      );
    }
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor();
