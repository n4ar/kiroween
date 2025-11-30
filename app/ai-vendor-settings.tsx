import { AddCustomModelModal } from '@/src/components/AddCustomModelModal';
import { SearchableModelPicker } from '@/src/components/SearchableModelPicker';
import { useAIVendorConfig } from '@/src/hooks/useAIVendorConfig';
import { AI_MODELS, AIVendor, CustomModel } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AIVendorSettingsScreen() {
  const { config, loading, saveConfig, deleteConfig } = useAIVendorConfig();
  const theme = useTheme();
  
  const [selectedVendor, setSelectedVendor] = useState<AIVendor>(
    config?.vendor || 'openai'
  );
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [selectedModel, setSelectedModel] = useState(
    config?.model || AI_MODELS.openai[0].id
  );
  const [customModels, setCustomModels] = useState<CustomModel[]>(
    config?.customModels || []
  );
  const [saving, setSaving] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showAddCustomModel, setShowAddCustomModel] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    if (!selectedModel) {
      Alert.alert('Error', 'Please select a model');
      return;
    }

    setSaving(true);
    try {
      await saveConfig({
        vendor: selectedVendor,
        apiKey: apiKey.trim(),
        model: selectedModel,
        customModels: customModels.length > 0 ? customModels : undefined,
      });
      Alert.alert('Success', 'AI vendor configuration saved', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Configuration',
      'Are you sure you want to delete your API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConfig();
              setApiKey('');
              Alert.alert('Success', 'Configuration deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete configuration');
            }
          },
        },
      ]
    );
  };

  const handleVendorChange = (vendor: AIVendor) => {
    setSelectedVendor(vendor);
    // Set default model for the vendor
    setSelectedModel(AI_MODELS[vendor][0].id);
    // Filter custom models for the new vendor
    setCustomModels(customModels.filter((m) => m.vendor === vendor));
  };

  const handleAddCustomModel = (model: CustomModel) => {
    setCustomModels([...customModels, model]);
  };

  const handleRemoveCustomModel = (modelId: string) => {
    Alert.alert(
      'Remove Custom Model',
      'Are you sure you want to remove this custom model?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setCustomModels(customModels.filter((m) => m.id !== modelId));
            // If the removed model was selected, switch to default
            if (selectedModel === modelId) {
              setSelectedModel(AI_MODELS[selectedVendor][0].id);
            }
          },
        },
      ]
    );
  };

  // Combine predefined and custom models for the selected vendor
  const allModels = [
    ...AI_MODELS[selectedVendor],
    ...customModels.filter((m) => m.vendor === selectedVendor),
  ];

  // Get all model IDs for duplicate checking
  const allModelIds = allModels.map((m) => m.id);

  const styles = createStyles(theme.colors);

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'AI Vendor Settings' }} />
        <ActivityIndicator size="large" color="#6B7F5A" />
      </View>
    );
  }

  const vendors: { id: AIVendor; name: string }[] = [
    { id: 'openai', name: 'OpenAI' },
    { id: 'google', name: 'Google AI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'openrouter', name: 'OpenRouter' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'AI Vendor Settings' }} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select AI Vendor</Text>
        {vendors.map((vendor) => (
          <TouchableOpacity
            key={vendor.id}
            style={styles.radioItem}
            onPress={() => handleVendorChange(vendor.id)}
          >
            <View style={styles.radioContent}>
              <Text style={styles.radioLabel}>{vendor.name}</Text>
              <View
                style={[
                  styles.radio,
                  selectedVendor === vendor.id && styles.radioSelected,
                ]}
              >
                {selectedVendor === vendor.id && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Key</Text>
        <TextInput
          style={styles.input}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter your API key"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.helpText}>
          Your API key is stored securely on your device
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Model</Text>
          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={() => setShowAddCustomModel(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.addCustomButtonText}>Add Custom</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.modelPickerButton}
          onPress={() => setShowModelPicker(true)}
        >
          <View style={styles.modelPickerContent}>
            <View style={styles.modelPickerInfo}>
              <Text style={styles.modelPickerLabel}>Selected Model</Text>
              <Text style={styles.modelPickerValue}>
                {allModels.find((m) => m.id === selectedModel)?.name || 'Select a model'}
              </Text>
              <Text style={styles.modelPickerId}>{selectedModel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>
        
        {customModels.filter((m) => m.vendor === selectedVendor).length > 0 && (
          <View style={styles.customModelsInfo}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.customModelsText}>
              {customModels.filter((m) => m.vendor === selectedVendor).length} custom model(s) added
            </Text>
          </View>
        )}
        
        <Text style={styles.helpText}>
          Tap to browse and search available models
        </Text>
      </View>

      {/* Searchable Model Picker Modal */}
      <SearchableModelPicker
        visible={showModelPicker}
        models={allModels}
        selectedModelId={selectedModel}
        onSelect={setSelectedModel}
        onClose={() => setShowModelPicker(false)}
        title={`Select ${selectedVendor.charAt(0).toUpperCase() + selectedVendor.slice(1)} Model`}
        onRemoveCustomModel={handleRemoveCustomModel}
        customModelIds={customModels.map((m) => m.id)}
      />

      {/* Add Custom Model Modal */}
      <AddCustomModelModal
        visible={showAddCustomModel}
        vendor={selectedVendor}
        onAdd={handleAddCustomModel}
        onClose={() => setShowAddCustomModel(false)}
        existingModelIds={allModelIds}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Configuration</Text>
          )}
        </TouchableOpacity>

        {config && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Configuration</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    backgroundColor: colors.card,
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCustomButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7F5A',
    marginLeft: 4,
  },
  radioItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radioContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#6B7F5A',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6B7F5A',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.card,
    color: colors.text,
    marginHorizontal: 16,
  },
  helpText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  modelPickerButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  modelPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  modelPickerInfo: {
    flex: 1,
  },
  modelPickerLabel: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginBottom: 4,
  },
  modelPickerValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  modelPickerId: {
    fontSize: 11,
    color: colors.text,
    opacity: 0.5,
    fontFamily: 'monospace',
  },
  customModelsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  customModelsText: {
    fontSize: 12,
    color: colors.text,
    opacity: 0.6,
    marginLeft: 6,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    backgroundColor: colors.background,
  },
  saveButton: {
    backgroundColor: '#6B7F5A',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
