import { useAIVendorConfig } from '@/src/hooks/useAIVendorConfig';
import { OCREngineType } from '@/src/types';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface OCREngineSelectorProps {
  selectedEngine: OCREngineType;
  onEngineChange: (engine: OCREngineType) => void;
}

export function OCREngineSelector({
  selectedEngine,
  onEngineChange,
}: OCREngineSelectorProps) {
  const { isConfigured, loading } = useAIVendorConfig();
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const engines: { id: OCREngineType; name: string; description: string }[] = [
    {
      id: 'manual',
      name: 'Manual Entry',
      description: 'Enter receipt details manually',
    },
    {
      id: 'native',
      name: 'Native OCR',
      description: 'Use device built-in text recognition',
    },
    {
      id: 'ai-vendor',
      name: 'AI Vendor',
      description: 'Use AI models (OpenAI, Google, etc.)',
    },
  ];

  const handleEngineSelect = (engine: OCREngineType) => {
    if (engine === 'ai-vendor' && !isConfigured) {
      Alert.alert(
        'AI Vendor Not Configured',
        'You need to set up your AI vendor API key first.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Configure',
            onPress: () => router.push('/ai-vendor-settings'),
          },
        ]
      );
      return;
    }

    onEngineChange(engine);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select OCR Engine</Text>
      
      {engines.map((engine) => {
        const isSelected = selectedEngine === engine.id;
        const needsConfig = engine.id === 'ai-vendor' && !isConfigured;

        return (
          <TouchableOpacity
            key={engine.id}
            style={[
              styles.engineButton,
              isSelected && styles.engineButtonActive,
              needsConfig && styles.engineButtonDisabled,
            ]}
            onPress={() => handleEngineSelect(engine.id)}
          >
            <View style={styles.engineInfo}>
              <Text
                style={[
                  styles.engineName,
                  isSelected && styles.engineNameActive,
                ]}
              >
                {engine.name}
              </Text>
              <Text style={styles.engineDescription}>
                {engine.description}
              </Text>
              {needsConfig && (
                <Text style={styles.configNeeded}>
                  Configuration required
                </Text>
              )}
            </View>
            {isSelected && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {selectedEngine === 'ai-vendor' && isConfigured && (
        <TouchableOpacity
          style={styles.configureButton}
          onPress={() => router.push('/ai-vendor-settings')}
        >
          <Text style={styles.configureButtonText}>
            Change AI Configuration
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  engineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  engineButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  engineButtonDisabled: {
    opacity: 0.6,
  },
  engineInfo: {
    flex: 1,
  },
  engineName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  engineNameActive: {
    color: '#007AFF',
  },
  engineDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  configNeeded: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 4,
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  configureButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  configureButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
