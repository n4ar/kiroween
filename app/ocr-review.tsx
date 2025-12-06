import { AppError, OCRResult } from '@/src/types';
import { DownloadUtil } from '@/src/utils/download';
import { AutoTagService } from '@/src/services/autoTag';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function OCRReviewScreen() {
  const { imageUri, ocrResult } = useLocalSearchParams<{
    imageUri: string;
    ocrResult: string;
  }>();
  const router = useRouter();
  const theme = useTheme();

  const parsedOCRResult: OCRResult = ocrResult
    ? JSON.parse(ocrResult)
    : {
        storeName: '',
        date: null,
        totalAmount: null,
        lineItems: [],
        rawText: '',
        confidence: 0,
      };

  const [storeName, setStoreName] = useState(parsedOCRResult.storeName);
  const [date] = useState(
    parsedOCRResult.date ? new Date(parsedOCRResult.date) : new Date()
  );
  const [amount, setAmount] = useState(
    parsedOCRResult.totalAmount
      ? (parsedOCRResult.totalAmount / 100).toFixed(2)
      : ''
  );
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showRawOCR, setShowRawOCR] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const styles = createStyles(theme.colors, theme.dark);

  const handleAutoTag = () => {
    const generatedTags = AutoTagService.generateTags(storeName, parsedOCRResult.rawText);
    
    if (generatedTags.length === 0) {
      Alert.alert('No Tags Found', 'Could not automatically generate tags for this receipt.');
      return;
    }

    setTags(generatedTags);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addTag = () => {
    const newTag = tagInput.trim();
    if (!newTag) return;
    
    if (tags.includes(newTag)) {
      Alert.alert('Duplicate Tag', 'This tag already exists.');
      return;
    }

    setTags([...tags, newTag]);
    setTagInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    // Validate required fields
    if (!storeName.trim()) {
      Alert.alert('Error', 'Please enter a store name');
      return;
    }

    let totalAmount = '0';
    if (amount.trim()) {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue < 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
      totalAmount = Math.round(amountValue * 100).toString();
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Navigate to save screen with receipt data
    router.replace({
      pathname: '/receipt-save',
      params: {
        imageUri,
        storeName: storeName.trim(),
        date: date.toISOString(),
        totalAmount,
        notes: notes.trim(),
        ocrText: parsedOCRResult.rawText,
        tags: JSON.stringify(tags),
      },
    });
  };

  const handleRetry = () => {
    Alert.alert(
      'Retry OCR',
      'Would you like to try OCR again with a different engine?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Retry',
          onPress: () => {
            router.back();
          },
        },
      ]
    );
  };

  const handleDownload = async () => {
    if (!imageUri) return;

    try {
      setIsDownloading(true);
      await DownloadUtil.downloadImage(
        imageUri,
        `receipt-${storeName || 'image'}-${Date.now()}.jpg`
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
          
          {/* Image Action Buttons */}
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color="#6B7F5A" />
              ) : (
                <Ionicons name="download-outline" size={24} color="#6B7F5A" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#6B7F5A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Receipt Details</Text>

          {/* Store Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Store Name *</Text>
            <TextInput
              style={styles.input}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Enter store name"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          {/* Date */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                // TODO: Open date picker
                Alert.alert('Date Picker', 'Date picker not implemented yet');
              }}
            >
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#6B7F5A" />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Total Amount (Optional)</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor="#A0A0A0"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Tags */}
          <View style={styles.fieldContainer}>
            <View style={styles.tagHeader}>
              <Text style={styles.label}>Tags</Text>
              <TouchableOpacity style={styles.autoTagButton} onPress={handleAutoTag}>
                <Ionicons name="sparkles" size={16} color="#6B7F5A" />
                <Text style={styles.autoTagText}>Auto-Tag</Text>
              </TouchableOpacity>
            </View>
            
            {/* Manual Tag Input */}
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add tag..."
                placeholderTextColor="#A0A0A0"
                onSubmitEditing={addTag}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addTagButton, !tagInput.trim() && styles.addTagButtonDisabled]}
                onPress={addTag}
                disabled={!tagInput.trim()}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {tags.length > 0 ? (
              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tag}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                    <Ionicons name="close-circle" size={16} color="#6B7F5A" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noTagsText}>No tags yet. Add manually or tap Auto-Tag.</Text>
            )}
          </View>

          {/* Notes */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor="#A0A0A0"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Raw OCR Text */}
          {parsedOCRResult.rawText && (
            <View style={styles.fieldContainer}>
              <TouchableOpacity
                style={styles.ocrToggle}
                onPress={() => setShowRawOCR(!showRawOCR)}
              >
                <Text style={styles.label}>OCR Text</Text>
                <Ionicons
                  name={showRawOCR ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6B7F5A"
                />
              </TouchableOpacity>
              {showRawOCR && (
                <View style={styles.ocrTextContainer}>
                  <Text style={styles.ocrText}>
                    {parsedOCRResult.rawText}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Ionicons name="refresh-outline" size={20} color="#6B7F5A" />
          <Text style={styles.retryButtonText}>Retry OCR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Receipt</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 200,
    backgroundColor: isDark ? '#2C2C2C' : '#F5F5F5',
    padding: 16,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imageActions: {
    position: 'absolute',
    top: 24,
    right: 24,
    flexDirection: 'row',
    gap: 8,
  },
  imageActionButton: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginRight: 4,
    fontFamily: 'JetBrains Mono',
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 18,
    color: colors.text,
    fontFamily: 'JetBrains Mono',
  },
  ocrToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ocrTextContainer: {
    backgroundColor: isDark ? '#2C2C2C' : '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  ocrText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.7,
    fontFamily: 'JetBrains Mono',
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#6B7F5A',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7F5A',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#6B7F5A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  autoTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F4ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  autoTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7F5A',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#6B7F5A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonDisabled: {
    opacity: 0.5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F0E3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7F5A',
  },
  noTagsText: {
    fontSize: 14,
    color: colors.text,
    opacity: 0.5,
    fontStyle: 'italic',
  },
});
