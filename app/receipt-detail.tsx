import { storage } from '@/src/services/storage';
import { AppError, Receipt } from '@/src/types';
import { DownloadUtil } from '@/src/utils/download';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReceiptDetailScreen() {
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const router = useRouter();
  const theme = useTheme();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const loadReceipt = async () => {
    try {
      if (!receiptId) return;

      const receiptData = await storage.getReceipt(receiptId);
      if (receiptData) {
        setReceipt(receiptData);
        const image = await storage.getImage(receiptId);
        setImageUri(image);
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
      Alert.alert('Error', 'Failed to load receipt');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReceipt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptId]);

  const styles = createStyles(theme.colors, theme.dark);

  const handleDelete = () => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (receiptId) {
                await storage.deleteReceipt(receiptId);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
                router.back();
              }
            } catch (error) {
              console.error('Error deleting receipt:', error);
              Alert.alert('Error', 'Failed to delete receipt');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: '/receipt-edit',
      params: { receiptId },
    });
  };

  const handleDownload = async () => {
    if (!imageUri) return;

    try {
      await DownloadUtil.downloadImage(
        imageUri,
        `receipt-${receipt?.storeName || 'image'}-${Date.now()}.jpg`
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
    }
  };

  const handleShare = async () => {
    if (!imageUri) return;

    try {
      await DownloadUtil.shareImage(imageUri);
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert(
        'Error',
        error instanceof AppError
          ? error.userMessage
          : 'Failed to share image'
      );
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#6B7F5A" />
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color="#D64545" />
        <Text style={styles.errorText}>Receipt not found</Text>
      </View>
    );
  }

  const formattedAmount = `$${(receipt.totalAmount / 100).toFixed(2)}`;
  const formattedDate = receipt.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Receipt Image */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Receipt Details */}
        <View style={styles.detailsContainer}>
          {/* Store Name */}
          <View style={styles.section}>
            <Text style={styles.storeName}>{receipt.storeName}</Text>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.label}>Total Amount</Text>
            <Text style={styles.amount}>{formattedAmount}</Text>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formattedDate}</Text>
          </View>

          {/* Tags */}
          {receipt.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagsContainer}>
                {receipt.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          {receipt.notes && (
            <View style={styles.section}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.value}>{receipt.notes}</Text>
            </View>
          )}

          {/* OCR Text */}
          {receipt.ocrText && (
            <View style={styles.section}>
              <Text style={styles.label}>OCR Text</Text>
              <View style={styles.ocrContainer}>
                <Text style={styles.ocrText}>{receipt.ocrText}</Text>
              </View>
            </View>
          )}

          {/* Metadata */}
          <View style={styles.section}>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.metaText}>
              {receipt.createdAt.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <View style={styles.topActionRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleDownload}
            disabled={!imageUri}
          >
            <Ionicons name="download-outline" size={24} color="#6B7F5A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleShare}
            disabled={!imageUri}
          >
            <Ionicons name="share-outline" size={24} color="#6B7F5A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#D64545" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="pencil-outline" size={20} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D64545',
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    backgroundColor: isDark ? '#2C2C2C' : '#F5F5F5',
    padding: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  detailsContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  storeName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6B7F5A',
    fontFamily: 'JetBrains Mono',
  },
  value: {
    fontSize: 16,
    color: colors.text,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.8,
    fontWeight: '500',
  },
  ocrContainer: {
    backgroundColor: isDark ? '#2C2C2C' : '#F5F5F5',
    borderRadius: 8,
    padding: 12,
  },
  ocrText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    fontFamily: 'JetBrains Mono',
    lineHeight: 18,
  },
  metaText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.6,
    fontFamily: 'JetBrains Mono',
  },
  actionContainer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  topActionRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-around',
  },
  iconButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDark ? '#2C2C2C' : '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6B7F5A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
