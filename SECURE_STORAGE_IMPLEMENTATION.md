# Secure Storage Implementation

## Overview

The app now uses `expo-secure-store` to securely store encryption keys in the device's keychain (iOS) or keystore (Android). This provides hardware-backed security for sensitive data.

## Architecture

### SecureKeyManager (`src/services/security/SecureKeyManager.ts`)

A service that manages encryption keys using expo-secure-store:

- **Master Encryption Key**: A 256-bit randomly generated key stored securely
- **Key Salt**: A salt value for key derivation
- **Platform Support**: 
  - iOS: Uses Keychain Services
  - Android: Uses Android Keystore
  - Web: Falls back to localStorage (less secure)

### Key Features

1. **Automatic Key Generation**: On first run, generates a secure random key
2. **Persistent Storage**: Keys persist across app restarts
3. **Secure Access**: Keys are only accessible by the app
4. **Platform-Specific**: Uses native secure storage on mobile platforms

## Encryption Flow

### For Local Data (Images, Receipts)

1. App requests encryption key from `SecureKeyManager`
2. If no key exists, generates new 256-bit random key
3. Stores key securely in device keychain/keystore
4. Uses key to encrypt/decrypt data with XOR + PBKDF2

### For Export/Import (User-Provided Password)

1. User provides password for export
2. Password is used with PBKDF2 to derive encryption key
3. Data is encrypted with derived key
4. Salt is stored alongside encrypted data
5. On import, user provides password to decrypt

## API Usage

### Encrypt Data (Automatic)
```typescript
import { encryptData } from '@/src/utils/encryption';

// No password needed - uses secure key automatically
const { encrypted, salt } = await encryptData(jsonData);
```

### Encrypt with Password (Export)
```typescript
import { encryptDataWithPassword } from '@/src/utils/encryption';

const { encrypted, salt } = await encryptDataWithPassword(data, userPassword);
```

### Decrypt Data (Automatic)
```typescript
import { decryptData } from '@/src/utils/encryption';

const decrypted = await decryptData(encrypted, salt);
```

### Decrypt with Password (Import)
```typescript
import { decryptDataWithPassword } from '@/src/utils/encryption';

const decrypted = await decryptDataWithPassword(encrypted, userPassword, salt);
```

## Security Considerations

### iOS
- Keys stored in iOS Keychain
- Protected by device passcode/biometrics
- Survives app reinstall (optional)
- Configured with `usesNonExemptEncryption: false` for App Store

### Android
- Keys stored in Android Keystore
- Hardware-backed on supported devices
- Protected by device lock screen
- Auto-backup excluded to prevent decryption issues

### Web
- Falls back to localStorage
- Less secure than native platforms
- Suitable for development/testing only

## Configuration

### app.json
```json
{
  "expo": {
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "plugins": [
      [
        "expo-secure-store",
        {
          "faceIDPermission": "Allow $(PRODUCT_NAME) to access your biometric data to securely store encryption keys."
        }
      ]
    ]
  }
}
```

## Key Management

### Check if Keys Exist
```typescript
import { SecureKeyManager } from '@/src/services/security';

const hasKeys = await SecureKeyManager.hasKeys();
```

### Delete Keys (Reset)
```typescript
await SecureKeyManager.deleteAllKeys();
```

## Best Practices

1. **Never hardcode encryption keys** - Always use SecureKeyManager
2. **Use password-based encryption for exports** - Allows users to control access
3. **Validate passwords** - Use `validatePassword()` for user-provided passwords
4. **Handle errors gracefully** - Key access may fail on some devices
5. **Test on real devices** - Secure storage behavior differs from simulators

## Migration Notes

- Existing apps will generate new keys on first run after update
- No user action required
- Keys persist across app updates
- Keys are deleted on app uninstall (by design)

## Future Improvements

1. Replace XOR encryption with AES-256-GCM
2. Add biometric authentication for key access
3. Implement key rotation
4. Add backup/recovery mechanism
5. Support hardware security modules (HSM)
