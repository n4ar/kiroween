import { AIVendor, CustomModel } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddCustomModelModalProps {
  visible: boolean;
  vendor: AIVendor;
  onAdd: (model: CustomModel) => void;
  onClose: () => void;
  existingModelIds: string[];
}

export function AddCustomModelModal({
  visible,
  vendor,
  onAdd,
  onClose,
  existingModelIds,
}: AddCustomModelModalProps) {
  const [modelId, setModelId] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelDescription, setModelDescription] = useState('');

  const handleAdd = () => {
    // Validation
    if (!modelId.trim()) {
      Alert.alert('Error', 'Please enter a model ID');
      return;
    }

    if (!modelName.trim()) {
      Alert.alert('Error', 'Please enter a model name');
      return;
    }

    // Check for duplicate ID
    if (existingModelIds.includes(modelId.trim())) {
      Alert.alert('Error', 'A model with this ID already exists');
      return;
    }

    // Create custom model
    const customModel: CustomModel = {
      id: modelId.trim(),
      name: modelName.trim(),
      description: modelDescription.trim() || undefined,
      vendor,
    };

    onAdd(customModel);
    handleClose();
  };

  const handleClose = () => {
    setModelId('');
    setModelName('');
    setModelDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Custom Model</Text>
            <TouchableOpacity onPress={handleAdd} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Vendor Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Adding a custom model for{' '}
                <Text style={styles.vendorName}>
                  {vendor.charAt(0).toUpperCase() + vendor.slice(1)}
                </Text>
              </Text>
            </View>

            {/* Model ID */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Model ID <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={modelId}
                onChangeText={setModelId}
                placeholder="e.g., gpt-4-turbo-preview"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>
                The exact model identifier used in API calls
              </Text>
            </View>

            {/* Model Name */}
            <View style={styles.section}>
              <Text style={styles.label}>
                Display Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={modelName}
                onChangeText={setModelName}
                placeholder="e.g., GPT-4 Turbo Preview"
                autoCapitalize="words"
              />
              <Text style={styles.hint}>
                A friendly name to display in the picker
              </Text>
            </View>

            {/* Model Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={modelDescription}
                onChangeText={setModelDescription}
                placeholder="e.g., Latest preview version with improved capabilities"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.hint}>
                Additional information about this model
              </Text>
            </View>

            {/* Examples */}
            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>Examples:</Text>
              
              {vendor === 'openai' && (
                <View style={styles.example}>
                  <Text style={styles.exampleLabel}>OpenAI:</Text>
                  <Text style={styles.exampleText}>
                    ID: gpt-4-turbo-preview{'\n'}
                    Name: GPT-4 Turbo Preview
                  </Text>
                </View>
              )}

              {vendor === 'google' && (
                <View style={styles.example}>
                  <Text style={styles.exampleLabel}>Google:</Text>
                  <Text style={styles.exampleText}>
                    ID: gemini-pro-vision{'\n'}
                    Name: Gemini Pro Vision
                  </Text>
                </View>
              )}

              {vendor === 'anthropic' && (
                <View style={styles.example}>
                  <Text style={styles.exampleLabel}>Anthropic:</Text>
                  <Text style={styles.exampleText}>
                    ID: claude-3-opus-20240229{'\n'}
                    Name: Claude 3 Opus
                  </Text>
                </View>
              )}

              {vendor === 'openrouter' && (
                <View style={styles.example}>
                  <Text style={styles.exampleLabel}>OpenRouter:</Text>
                  <Text style={styles.exampleText}>
                    ID: meta-llama/llama-3-70b{'\n'}
                    Name: Llama 3 70B
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  vendorName: {
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  examplesSection: {
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  example: {
    marginBottom: 12,
  },
  exampleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
