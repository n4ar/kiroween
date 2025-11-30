import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';

export default function CaptureScreen() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  const handleScanDocument = useCallback(async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('[Capture] Starting document scan...');

      // Scan document with automatic edge detection
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
        croppedImageQuality: 100,
      });

      console.log('[Capture] Scan result:', scannedImages);

      if (scannedImages && scannedImages.length > 0) {
        const imageUri = scannedImages[0];
        console.log('[Capture] Document scanned:', imageUri);

        // Navigate to OCR processing
        router.push({
          pathname: '/ocr-process',
          params: { imageUri },
        });
      } else {
        console.warn('[Capture] No images returned from scanner');
      }
    } catch (error) {
      console.error('[Capture] Error scanning document:', error);
      
      const errorStr = String(error);
      
      // Check if it's a user cancellation
      if (error === 'USER_CANCELED' || errorStr.includes('cancel') || errorStr.includes('Cancel')) {
        console.log('[Capture] User canceled scan');
        return;
      }

      // Provide specific error messages based on error type
      let title = 'Scanner Error';
      let message = 'Failed to open document scanner. Please try again.';

      if (errorStr.includes('permission') || errorStr.includes('Permission')) {
        title = 'Camera Permission Required';
        message = 'Camera permission is required to scan documents. Please enable it in your device settings.';
      } else if (errorStr.includes('camera') || errorStr.includes('Camera')) {
        title = 'Camera Unavailable';
        message = 'Camera is not available. Please make sure no other app is using the camera.';
      } else if (errorStr.includes('Google Play') || errorStr.includes('ML Kit')) {
        title = 'Scanner Unavailable';
        message = 'Document scanner requires Google Play Services. Please make sure it is installed and up to date.';
      } else if (errorStr.includes('not supported') || errorStr.includes('unavailable')) {
        title = 'Feature Unavailable';
        message = 'Document scanning is not available on this device. Please use the gallery picker instead.';
      }
      
      Alert.alert(title, message, [{ text: 'OK' }]);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, router]);

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="document-text-outline" size={80} color="#6B7F5A" />
          <Text style={styles.title}>Document Scanner</Text>
          <Text style={styles.subtitle}>
            Document scanning is only available on iOS and Android.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="document-text-outline" size={120} color="#6B7F5A" />
        
        <Text style={styles.title}>Scan Receipt</Text>
        <Text style={styles.subtitle}>
          Use the document scanner to capture your receipt with automatic edge detection and perspective correction.
        </Text>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Ionicons name="scan-outline" size={24} color="#6B7F5A" />
            <Text style={styles.featureText}>Auto edge detection</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="crop-outline" size={24} color="#6B7F5A" />
            <Text style={styles.featureText}>Manual crop adjustment</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="color-wand-outline" size={24} color="#6B7F5A" />
            <Text style={styles.featureText}>Image enhancement</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={handleScanDocument}
          disabled={isScanning}
        >
          <Ionicons name="camera-outline" size={28} color="#FFFFFF" />
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Scan Document'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFCF8',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  features: {
    width: '100%',
    marginBottom: 40,
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B7F5A',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

});
