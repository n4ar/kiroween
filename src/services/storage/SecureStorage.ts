import { AIVendor, AIVendorConfig, AppError, ErrorCode } from '@/src/types';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage service for sensitive data like API keys
 */
export class SecureStorage {
  private static readonly AI_VENDOR_KEY = 'ai_vendor_config';

  /**
   * Check if secure storage is available
   */
  static async isAvailable(): Promise<boolean> {
    // Secure store is not available on web
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      // Try a test operation
      await SecureStore.getItemAsync('__test__');
      return true;
    } catch (error) {
      console.warn('[SecureStorage] Secure storage not available:', error);
      return false;
    }
  }

  /**
   * Save AI vendor configuration
   */
  static async saveAIVendorConfig(config: AIVendorConfig): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to localStorage on web (less secure but functional)
        localStorage.setItem(this.AI_VENDOR_KEY, JSON.stringify(config));
        return;
      }

      await SecureStore.setItemAsync(
        this.AI_VENDOR_KEY,
        JSON.stringify(config)
      );
    } catch (error) {
      console.error('[SecureStorage] Failed to save AI vendor config:', error);
      throw new AppError(
        'Failed to save API key securely',
        ErrorCode.STORAGE_ERROR,
        'storage',
        true,
        'Failed to save API key. Please try again.'
      );
    }
  }

  /**
   * Get AI vendor configuration
   */
  static async getAIVendorConfig(): Promise<AIVendorConfig | null> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to localStorage on web
        const configStr = localStorage.getItem(this.AI_VENDOR_KEY);
        if (!configStr) return null;
        return JSON.parse(configStr) as AIVendorConfig;
      }

      const configStr = await SecureStore.getItemAsync(this.AI_VENDOR_KEY);
      if (!configStr) return null;

      const config = JSON.parse(configStr) as AIVendorConfig;
      
      // Validate config structure
      if (!config.vendor || !config.apiKey || !config.model) {
        console.warn('[SecureStorage] Invalid config structure, returning null');
        return null;
      }

      return config;
    } catch (error) {
      console.error('[SecureStorage] Failed to get AI vendor config:', error);
      
      // Distinguish between "not found" and "read error"
      if (error instanceof SyntaxError) {
        console.error('[SecureStorage] Corrupted config data, clearing it');
        await this.deleteAIVendorConfig().catch(() => {});
        return null;
      }

      throw new AppError(
        'Failed to read API key',
        ErrorCode.STORAGE_ERROR,
        'storage',
        true,
        'Failed to read API key. Please reconfigure your AI vendor.'
      );
    }
  }

  /**
   * Delete AI vendor configuration
   */
  static async deleteAIVendorConfig(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(this.AI_VENDOR_KEY);
        return;
      }

      await SecureStore.deleteItemAsync(this.AI_VENDOR_KEY);
    } catch (error) {
      console.error('[SecureStorage] Failed to delete AI vendor config:', error);
      throw new AppError(
        'Failed to delete API key',
        ErrorCode.STORAGE_ERROR,
        'storage',
        true,
        'Failed to delete API key. Please try again.'
      );
    }
  }

  /**
   * Check if AI vendor is configured
   */
  static async hasAIVendorConfig(): Promise<boolean> {
    try {
      const config = await this.getAIVendorConfig();
      return config !== null && !!config.apiKey;
    } catch (error) {
      console.error('[SecureStorage] Error checking config:', error);
      return false;
    }
  }

  /**
   * Get API key for specific vendor
   */
  static async getAPIKey(vendor: AIVendor): Promise<string | null> {
    try {
      const config = await this.getAIVendorConfig();
      if (!config || config.vendor !== vendor) return null;
      return config.apiKey;
    } catch (error) {
      console.error('[SecureStorage] Error getting API key:', error);
      return null;
    }
  }
}
