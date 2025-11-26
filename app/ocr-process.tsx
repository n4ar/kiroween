import { useCaptureFlow } from '@/src/hooks/useCaptureFlow';
import { ocrService } from '@/src/services/ocr';
import { storage } from '@/src/services/storage';
import { AppError } from '@/src/types';
import { DownloadUtil } from '@/src/utils/download';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function OCRProcessScreen() {
  const { imageUri, skipAutoCrop } = useLocalSearchParams<{ 
    imageUri: string;
    skipAutoCrop?: string;
  }>();
  const router = useRouter();
  const { processImage } = useCaptureFlow();

  const [, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Processing image...');
  const [processedImageUri, setProcessedImageUri] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  const processReceipt = async () => {
    try {
      // Step 1: Process image (compress, auto-crop)
      setStatusText('Processing image...');
      setProgress(10);

      // Skip auto-crop if image is from document scanner (already cropped)
      const shouldAutoCrop = skipAutoCrop !== 'true';
      console.log('[OCRProcess] Skip auto-crop:', skipAutoCrop, 'Should auto-crop:', shouldAutoCrop);
      
      const processed = await processImage(imageUri, shouldAutoCrop);
      setProcessedImageUri(processed);

      // Step 2: Get OCR settings
      setStatusText('Preparing OCR...');
      setProgress(30);

      const settings = await storage.getSettings();
      const engineType = settings.ocrEngine;

      // Step 3: Run OCR
      setStatusText(`Running ${engineType.toUpperCase()} OCR...`);

      const ocrResult = await ocrService.processReceipt(
        processed,
        engineType,
        (ocrProgress) => {
          // Map OCR progress to 30-90% range
          const mappedProgress = 30 + (ocrProgress * 0.6);
          setProgress(mappedProgress);
        }
      );

      setProgress(100);
      setStatusText('Complete!');

      // Navigate to review screen with OCR result
      setTimeout(() => {
        router.replace({
          pathname: '/ocr-review',
          params: {
            imageUri: processed,
            ocrResult: JSON.stringify(ocrResult),
          },
        });
      }, 500);
    } catch (error) {
      console.error('Error processing receipt:', error);

      let errorMessage = 'Failed to process receipt. Please try again.';

      if (error instanceof AppError) {
        errorMessage = error.userMessage;
      }

      Alert.alert('Error', errorMessage, [
        {
          text: 'Retry',
          onPress: () => processReceipt(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => router.back(),
        },
      ]);

      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (imageUri) {
      processReceipt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUri]);

  const handleDownload = async () => {
    if (!processedImageUri) return;

    try {
      setIsDownloading(true);
      await DownloadUtil.downloadImage(
        processedImageUri,
        `receipt-${Date.now()}.jpg`
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Receipt image saved to your photo library');
    } catch (error) {
      console.error('Error downloading image:', error);
      Alert.alert(
        'Error',
        error instanceof AppError
          ? error.userMessage
          : 'Failed to download image'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {imageUri && (
          <Image
            source={{ uri: processedImageUri || imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.progressContainer}>
        <ActivityIndicator size="large" color="#6B7F5A" />
        <Text style={styles.statusText}>{statusText}</Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${progress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>

        {/* Download button - shown after image is processed */}
        {processedImageUri && (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                <Text style={styles.downloadButtonText}>
                  Download Cropped Image
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFCF8',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  progressContainer: {
    padding: 32,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 24,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6B7F5A',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontFamily: 'JetBrains Mono',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7F5A',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
    width: '100%',
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
