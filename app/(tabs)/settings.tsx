import { useTheme } from '@/contexts/ThemeContext';
import { ocrService } from '@/src/services/ocr';
import { storage } from '@/src/services/storage';
import { AppSettings, OCREngineType } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme as useNavTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SettingsScreen() {
  const { setThemeSetting } = useTheme();
  const navTheme = useNavTheme();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    let retryCount = 0;
    const MAX_RETRIES = 30; // 3 seconds total (30 * 100ms)
    let timeoutId: NodeJS.Timeout;

    // Wait for storage to be initialized
    const checkStorageReady = async () => {
      try {
        // Try to get settings - this will fail if storage isn't initialized
        await storage.getSettings();
        setIsStorageReady(true);
        loadSettings();
      } catch (error) {
        retryCount++;
        
        if (retryCount >= MAX_RETRIES) {
          console.error('[Settings] Storage initialization timeout after', retryCount, 'retries');
          setIsLoading(false);
          Alert.alert(
            'Storage Error',
            'Failed to initialize storage. Please restart the app.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Storage not ready yet, retry after a short delay
        timeoutId = setTimeout(checkStorageReady, 100);
      }
    };

    checkStorageReady();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await storage.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    if (!isStorageReady) {
      Alert.alert('Error', 'Storage is not ready. Please try again.');
      return;
    }

    try {
      setIsSaving(true);
      await storage.saveSettings(newSettings);
      ocrService.setDefaultEngine(newSettings.ocrEngine);
      
      // Update theme immediately via context
      await setThemeSetting(newSettings.theme);
      
      setSettings(newSettings);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    if (settings) {
      saveSettings({ ...settings, [key]: value });
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: AppSettings = {
              ocrEngine: 'manual',
              autoCrop: true,
              theme: 'auto',
            };
            saveSettings(defaultSettings);
          },
        },
      ]
    );
  };

  const styles = createStyles(navTheme.colors);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: navTheme.colors.background }]}>
        <ActivityIndicator size="large" color="#6B7F5A" />
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: navTheme.colors.background }]}>
        <Text style={styles.errorText}>Failed to load settings</Text>
      </View>
    );
  }

  const ocrEngines: { value: OCREngineType; label: string; description: string }[] = [
    {
      value: 'manual',
      label: 'Manual Entry',
      description: 'Enter receipt details manually',
    },
    {
      value: 'native',
      label: 'Native OCR',
      description: 'On-device text recognition (iOS/Android)',
    },
    {
      value: 'ai-vendor',
      label: 'AI Vendor',
      description: 'Use AI models (OpenAI, Google, Anthropic)',
    },
  ];

  const themes: { value: 'light' | 'dark' | 'auto'; label: string }[] = [
    { value: 'auto', label: 'Auto (System)' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* OCR Engine Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OCR Engine</Text>
          {ocrEngines.map((engine) => (
            <TouchableOpacity
              key={engine.value}
              style={styles.radioItem}
              onPress={() => updateSetting('ocrEngine', engine.value)}
              disabled={isSaving}
            >
              <View style={styles.radioContent}>
                <View>
                  <Text style={styles.radioLabel}>{engine.label}</Text>
                  <Text style={styles.radioDescription}>
                    {engine.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    settings.ocrEngine === engine.value &&
                      styles.radioSelected,
                  ]}
                >
                  {settings.ocrEngine === engine.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Image Processing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Image Processing</Text>
          <View style={styles.switchItem}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Auto-Crop</Text>
              <Text style={styles.switchDescription}>
                Automatically detect and crop receipt edges
              </Text>
            </View>
            <Switch
              value={settings.autoCrop}
              onValueChange={(value) => updateSetting('autoCrop', value)}
              trackColor={{ false: '#E5E5E5', true: '#8FA87A' }}
              thumbColor={settings.autoCrop ? '#6B7F5A' : '#F5F5F5'}
              disabled={isSaving}
            />
          </View>
        </View>

        {/* Engine-Specific Settings */}
        {settings.ocrEngine === 'native' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Native OCR Settings</Text>
            <View style={styles.settingItem}>
              <View>
                <Text style={styles.settingLabel}>Recognition</Text>
                <Text style={styles.settingValue}>
                  Uses device&apos;s native text recognition
                </Text>
              </View>
            </View>
          </View>
        )}

        {settings.ocrEngine === 'ai-vendor' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Vendor Settings</Text>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                router.push('/ai-vendor-settings');
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Configure AI Vendor</Text>
                <Text style={styles.settingValue} numberOfLines={1}>
                  Set up API key and model
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#6B6B6B"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          {themes.map((theme) => (
            <TouchableOpacity
              key={theme.value}
              style={styles.radioItem}
              onPress={() => updateSetting('theme', theme.value)}
              disabled={isSaving}
            >
              <View style={styles.radioContent}>
                <Text style={styles.radioLabel}>{theme.label}</Text>
                <View
                  style={[
                    styles.radio,
                    settings.theme === theme.value && styles.radioSelected,
                  ]}
                >
                  {settings.theme === theme.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/export-import')}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Export & Import</Text>
              <Text style={styles.settingValue}>
                Backup and restore your data
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#6B6B6B"
            />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Storage</Text>
            <Text style={styles.aboutValue}>Local (SQLite + FileSystem)</Text>
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetToDefaults}
          disabled={isSaving}
        >
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: '#D64545',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.card,
    marginTop: 16,
    paddingVertical: 8,
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
  radioItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
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
    marginBottom: 4,
  },
  radioDescription: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.6,
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
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.6,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 13,
    color: colors.text,
    opacity: 0.6,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  aboutLabel: {
    fontSize: 16,
    color: colors.text,
  },
  aboutValue: {
    fontSize: 16,
    color: colors.text,
    opacity: 0.6,
    fontFamily: 'JetBrains Mono',
  },
  resetButton: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D64545',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D64545',
  },
});
