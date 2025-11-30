import { AppSettings } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage-based settings storage as fallback
 * Used when SQLite is not available
 */
export class AsyncStorageSettings {
  private static readonly SETTINGS_KEY = '@paperkeep_settings';

  /**
   * Save settings to AsyncStorage
   */
  static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const settingsJson = JSON.stringify(settings);
      await AsyncStorage.setItem(this.SETTINGS_KEY, settingsJson);
    } catch (error) {
      console.error('[AsyncStorageSettings] Failed to save settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Get settings from AsyncStorage
   */
  static async getSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.SETTINGS_KEY);
      
      if (!settingsJson) {
        // Return default settings
        return this.getDefaultSettings();
      }

      return JSON.parse(settingsJson);
    } catch (error) {
      console.error('[AsyncStorageSettings] Failed to get settings:', error);
      // Return default settings on error
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  static getDefaultSettings(): AppSettings {
    return {
      ocrEngine: 'manual',
      autoCrop: true,
      theme: 'auto',
    };
  }

  /**
   * Clear all settings
   */
  static async clearSettings(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SETTINGS_KEY);
    } catch (error) {
      console.error('[AsyncStorageSettings] Failed to clear settings:', error);
      throw new Error('Failed to clear settings');
    }
  }
}
