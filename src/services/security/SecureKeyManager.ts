import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure key management service using expo-secure-store
 * Stores encryption keys securely in the device's keychain/keystore
 */
export class SecureKeyManager {
  private static readonly ENCRYPTION_KEY = 'paperkeep_encryption_key';
  private static readonly KEY_SALT = 'paperkeep_key_salt';

  /**
   * Generate or retrieve the encryption key
   * On first run, generates a new key and stores it securely
   * On subsequent runs, retrieves the existing key
   */
  static async getEncryptionKey(): Promise<string> {
    try {
      // Try to get existing key
      let key = await this.getStoredKey(this.ENCRYPTION_KEY);

      if (!key) {
        // Generate new key if none exists
        key = await this.generateEncryptionKey();
        await this.storeKey(this.ENCRYPTION_KEY, key);
      }

      return key;
    } catch (error) {
      throw new Error(`Failed to get encryption key: ${error}`);
    }
  }

  /**
   * Get or generate the salt for key derivation
   */
  static async getKeySalt(): Promise<string> {
    try {
      let salt = await this.getStoredKey(this.KEY_SALT);

      if (!salt) {
        // Generate new salt if none exists
        salt = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Date.now().toString() + Math.random().toString()
        );
        await this.storeKey(this.KEY_SALT, salt);
      }

      return salt;
    } catch (error) {
      throw new Error(`Failed to get key salt: ${error}`);
    }
  }

  /**
   * Generate a new encryption key using crypto random bytes
   */
  private static async generateEncryptionKey(): Promise<string> {
    // Generate 32 bytes (256 bits) for AES-256
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    // Convert to hex string
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Store a key securely
   */
  private static async storeKey(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // For web, use localStorage (less secure but functional)
      localStorage.setItem(key, value);
    } else {
      // For native platforms, use SecureStore
      await SecureStore.setItemAsync(key, value);
    }
  }

  /**
   * Retrieve a stored key
   */
  private static async getStoredKey(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // For web, use localStorage
      return localStorage.getItem(key);
    } else {
      // For native platforms, use SecureStore
      return await SecureStore.getItemAsync(key);
    }
  }

  /**
   * Delete all stored keys (for testing or reset purposes)
   */
  static async deleteAllKeys(): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(this.ENCRYPTION_KEY);
      localStorage.removeItem(this.KEY_SALT);
    } else {
      await SecureStore.deleteItemAsync(this.ENCRYPTION_KEY);
      await SecureStore.deleteItemAsync(this.KEY_SALT);
    }
  }

  /**
   * Check if encryption keys exist
   */
  static async hasKeys(): Promise<boolean> {
    const key = await this.getStoredKey(this.ENCRYPTION_KEY);
    return key !== null;
  }
}
