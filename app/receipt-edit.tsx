import { storage } from '@/src/services/storage';
import { AutoTagService } from '@/src/services/autoTag';
import { Receipt } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReceiptEditScreen() {
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const router = useRouter();
  const theme = useTheme();

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [storeName, setStoreName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadReceipt();
  }, [receiptId]);

  const loadReceipt = async () => {
    try {
      if (!receiptId) return;

      const receiptData = await storage.getReceipt(receiptId);
      if (receiptData) {
        setReceipt(receiptData);
        setStoreName(receiptData.storeName);
        setAmount((receiptData.totalAmount / 100).toFixed(2));
        setNotes(receiptData.notes || '');
        setTags(receiptData.tags);
      }
    } catch (error) {
      console.error('Error loading receipt:', error);
      Alert.alert('Error', 'Failed to load receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoTag = () => {
    const generatedTags = AutoTagService.generateTags(storeName, receipt?.ocrText || '');
    
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

  const handleSave = async () => {
    if (!storeName.trim()) {
      Alert.alert('Error', 'Please enter a store name');
      return;
    }

    let totalAmount = 0;
    if (amount.trim()) {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue < 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }
      totalAmount = Math.round(amountValue * 100);
    }

    try {
      setIsSaving(true);

      if (!receipt || !receiptId) return;

      const updatedReceipt: Receipt = {
        ...receipt,
        storeName: storeName.trim(),
        totalAmount,
        notes: notes.trim(),
        tags,
        updatedAt: new Date(),
      };

      await storage.updateReceipt(receiptId, updatedReceipt);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#6B7F5A" />
      </View>
    );
  }

  const styles = createStyles(theme.colors, theme.dark);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Edit Receipt</Text>

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

          <View style={styles.fieldContainer}>
            <View style={styles.tagHeader}>
              <Text style={styles.label}>Tags</Text>
              <TouchableOpacity style={styles.autoTagButton} onPress={handleAutoTag}>
                <Ionicons name="sparkles" size={16} color="#6B7F5A" />
                <Text style={styles.autoTagText}>Auto-Tag</Text>
              </TouchableOpacity>
            </View>
            
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
        </View>
      </ScrollView>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
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
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#6B7F5A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
