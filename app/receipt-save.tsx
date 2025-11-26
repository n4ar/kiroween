import { storage } from '@/src/services/storage';
import { AppError, Receipt } from '@/src/types';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ReceiptSaveScreen() {
  const params = useLocalSearchParams<{
    imageUri: string;
    storeName: string;
    date: string;
    totalAmount: string;
    notes?: string;
    ocrText: string;
    tags?: string;
  }>();
  const router = useRouter();

  const [, setIsSaving] = useState(true);
  const [statusText, setStatusText] = useState('Saving receipt...');

  const saveReceipt = async () => {
    try {
      setStatusText('Validating data...');

      // Validate required fields
      if (!params.imageUri || !params.storeName || !params.date || !params.totalAmount) {
        throw new Error('Missing required fields');
      }

      // Parse data
      const receiptDate = new Date(params.date);
      const totalAmount = parseInt(params.totalAmount, 10);
      const tags = params.tags ? JSON.parse(params.tags) : [];

      // Generate unique ID
      const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      setStatusText('Saving image...');

      // Save image to storage
      const savedImageUri = await storage.saveImage(params.imageUri, receiptId);

      setStatusText('Saving receipt data...');

      // Create receipt object
      const receipt: Receipt = {
        id: receiptId,
        storeName: params.storeName,
        date: receiptDate,
        totalAmount,
        tags,
        notes: params.notes || '',
        ocrText: params.ocrText || '',
        imageUri: savedImageUri,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save receipt to database
      await storage.saveReceipt(receipt);

      setStatusText('Receipt saved!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to home screen
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (error) {
      console.error('Error saving receipt:', error);

      let errorMessage = 'Failed to save receipt. Please try again.';

      if (error instanceof AppError) {
        errorMessage = error.userMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert('Error', errorMessage, [
        {
          text: 'Retry',
          onPress: () => {
            setIsSaving(true);
            saveReceipt();
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => router.back(),
        },
      ]);

      setIsSaving(false);
    }
  };

  useEffect(() => {
    saveReceipt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6B7F5A" />
      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFCF8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 16,
  },
});
