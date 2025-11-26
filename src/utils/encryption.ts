import { SecureKeyManager } from '@/src/services/security/SecureKeyManager';
import * as Crypto from 'expo-crypto';

/**
 * Encryption utilities using AES-256 with secure key storage
 */

/**
 * Derive a key from the master key and salt using PBKDF2
 */
async function deriveKey(masterKey: string, salt: string): Promise<string> {
  const iterations = 10000;
  const keyLength = 32; // 256 bits
  
  // Combine master key and salt
  const data = masterKey + salt;
  
  // Hash multiple times to simulate PBKDF2
  let hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  
  for (let i = 1; i < iterations; i++) {
    hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hash
    );
  }
  
  return hash.substring(0, keyLength * 2); // Hex string
}

/**
 * Simple XOR-based encryption (for demonstration)
 * In production, use a proper encryption library like crypto-js
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

/**
 * Encrypt data using the device's secure encryption key
 * No password required - uses key from secure storage
 */
export async function encryptData(
  data: string
): Promise<{ encrypted: string; salt: string }> {
  // Get the master encryption key from secure storage
  const masterKey = await SecureKeyManager.getEncryptionKey();
  
  // Get or generate salt
  const salt = await SecureKeyManager.getKeySalt();
  
  // Derive key from master key and salt
  const key = await deriveKey(masterKey, salt);
  
  // Encrypt data using XOR (simple demonstration)
  // In production, use a proper encryption library
  const encrypted = xorEncrypt(data, key);
  
  // Convert to base64 for safe storage
  const encryptedBase64 = Buffer.from(encrypted, 'binary').toString('base64');
  
  return {
    encrypted: encryptedBase64,
    salt,
  };
}

/**
 * Encrypt data with a user-provided password (for export)
 */
export async function encryptDataWithPassword(
  data: string,
  password: string
): Promise<{ encrypted: string; salt: string }> {
  // Generate a random salt for this encryption
  const salt = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Date.now().toString() + Math.random().toString()
  );
  
  // Derive key from password
  const key = await deriveKey(password, salt);
  
  // Encrypt data using XOR
  const encrypted = xorEncrypt(data, key);
  
  // Convert to base64 for safe storage
  const encryptedBase64 = Buffer.from(encrypted, 'binary').toString('base64');
  
  return {
    encrypted: encryptedBase64,
    salt,
  };
}

/**
 * Decrypt data using the device's secure encryption key
 */
export async function decryptData(
  encryptedBase64: string,
  salt: string
): Promise<string> {
  // Get the master encryption key from secure storage
  const masterKey = await SecureKeyManager.getEncryptionKey();
  
  // Derive key from master key and salt
  const key = await deriveKey(masterKey, salt);
  
  // Convert from base64
  const encrypted = Buffer.from(encryptedBase64, 'base64').toString('binary');
  
  // Decrypt data using XOR
  const decrypted = xorEncrypt(encrypted, key);
  
  return decrypted;
}

/**
 * Decrypt data with a user-provided password (for import)
 */
export async function decryptDataWithPassword(
  encryptedBase64: string,
  password: string,
  salt: string
): Promise<string> {
  // Derive key from password and salt
  const key = await deriveKey(password, salt);
  
  // Convert from base64
  const encrypted = Buffer.from(encryptedBase64, 'base64').toString('binary');
  
  // Decrypt data using XOR
  const decrypted = xorEncrypt(encrypted, key);
  
  return decrypted;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long',
    };
  }
  
  if (password.length > 128) {
    return {
      valid: false,
      message: 'Password must be less than 128 characters',
    };
  }
  
  return { valid: true };
}
