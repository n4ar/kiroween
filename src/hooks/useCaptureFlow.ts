import { imageProcessor } from '@/src/services/image';
import { storage } from '@/src/services/storage';
import { AppError } from '@/src/types';
import { useState } from 'react';
import { Alert } from 'react-native';

/**
 * Hook for managing the receipt capture flow
 */
export function useCaptureFlow() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Process captured image
   * @param imageUri - URI of the captured/selected image
   * @param autoCrop - Whether to apply auto-crop
   * @returns Processed image URI
   */
  const processImage = async (
    imageUri: string,
    autoCrop: boolean = true
  ): Promise<string> => {
    try {
      setIsProcessing(true);
      setProgress(10);

      console.log('[useCaptureFlow] Processing image:', imageUri);
      console.log('[useCaptureFlow] autoCrop param:', autoCrop);

      // Get settings to check if auto-crop is enabled
      const settings = await storage.getSettings();
      console.log('[useCaptureFlow] Settings autoCrop:', settings.autoCrop);
      
      const shouldAutoCrop = autoCrop && settings.autoCrop;
      console.log('[useCaptureFlow] Should auto-crop:', shouldAutoCrop);

      let processedUri = imageUri;

      // Apply auto-crop if enabled
      if (shouldAutoCrop) {
        console.log('[useCaptureFlow] Applying auto-crop...');
        setProgress(30);
        processedUri = await imageProcessor.autoCrop(processedUri);
        console.log('[useCaptureFlow] Auto-crop result:', processedUri);
      } else {
        console.log('[useCaptureFlow] Skipping auto-crop');
      }

      // Compress image
      console.log('[useCaptureFlow] Compressing image...');
      setProgress(60);
      processedUri = await imageProcessor.compress(processedUri, 0.8);
      console.log('[useCaptureFlow] Compression result:', processedUri);

      setProgress(100);
      return processedUri;
    } catch (error) {
      console.error('Error processing image:', error);

      if (error instanceof AppError) {
        Alert.alert('Error', error.userMessage);
      } else {
        Alert.alert(
          'Error',
          'Failed to process image. Please try again.'
        );
      }

      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  /**
   * Clean up temporary files
   */
  const cleanup = async () => {
    try {
      await storage.cleanupTempFiles();
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
  };

  return {
    isProcessing,
    progress,
    processImage,
    cleanup,
  };
}
