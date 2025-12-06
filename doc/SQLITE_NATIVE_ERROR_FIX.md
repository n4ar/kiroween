# SQLite Native Error Fix

## Error
```
ERROR Failed to initialize app: [AppError: Failed to initialize database: Error: Call to function 'NativeDatabase.execAsync' has been rejected.
→ Caused by: java.lang.NullPointerException
```

## Root Cause
This is a native Android error indicating that the `expo-sqlite` module is not properly linked or the native code needs to be rebuilt after installing new dependencies.

## Immediate Workaround (Implemented)

The app now uses **AsyncStorage as a fallback** for settings when SQLite is not available:

### What Works:
- ✅ App starts without crashing
- ✅ Settings can be saved and loaded (using AsyncStorage)
- ✅ Theme preferences work
- ✅ OCR engine selection works

### What Doesn't Work:
- ❌ Receipt storage (requires SQLite)
- ❌ Receipt list
- ❌ Receipt search

### Changes Made:

1. **Created AsyncStorageSettings.ts**
   - Fallback storage for app settings
   - Uses `@react-native-async-storage/async-storage`

2. **Updated PaperkeepStorage.ts**
   - Gracefully handles SQLite initialization failure
   - Automatically falls back to AsyncStorage for settings
   - Returns empty arrays for receipts when SQLite unavailable
   - Logs warnings instead of crashing

3. **Updated app/_layout.tsx**
   - Shows warning when SQLite is not available
   - App continues to initialize even if SQLite fails

## Permanent Fix

To fix SQLite and enable full functionality, you need to rebuild the native Android app:

### Option 1: Clean Rebuild (Recommended)

```bash
# 1. Clear all caches and build artifacts
rm -rf node_modules
rm -rf android/app/build
rm -rf android/.gradle
rm -rf .expo

# 2. Reinstall dependencies
bun install

# 3. Rebuild and run Android app
bun run android
```

### Option 2: Prebuild (If using development build)

```bash
# 1. Remove existing android folder
rm -rf android

# 2. Prebuild for Android
npx expo prebuild --platform android --clean

# 3. Run the app
bun run android
```

### Option 3: Development Client

If you're using Expo Go or a development client:

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Build a development client
eas build --profile development --platform android

# 3. Install the built APK on your device
```

## Verification

After rebuilding, you should see:
```
✅ [PaperkeepStorage] SQLite initialized successfully
```

Instead of:
```
⚠️ [PaperkeepStorage] SQLite not available, using AsyncStorage for settings
```

## Why This Happens

This error typically occurs when:

1. **New dependencies added**: Native modules like `expo-sqlite` require native code compilation
2. **Metro cache issues**: Old cached code conflicts with new dependencies
3. **Gradle cache issues**: Android build cache is stale
4. **New Architecture**: Expo SDK 54 uses the new React Native architecture which requires proper setup

## Testing SQLite Availability

You can check if SQLite is working by:

```typescript
import { storage } from '@/src/services/storage';

// After initialization
if (storage.isSQLiteAvailable()) {
  console.log('✅ SQLite is working');
} else {
  console.log('❌ SQLite is not available');
}
```

## Migration Path

If you have existing data in SQLite and need to migrate:

1. Export your data before rebuilding (if possible)
2. Rebuild the app with the fix above
3. Import your data back

## Related Files

- `src/services/storage/AsyncStorageSettings.ts` - Fallback settings storage
- `src/services/storage/PaperkeepStorage.ts` - Main storage with fallback logic
- `src/services/storage/SQLiteStorage.ts` - SQLite implementation
- `app/_layout.tsx` - App initialization with error handling

## Additional Notes

### AsyncStorage vs SQLite

**AsyncStorage** (Current fallback for settings):
- ✅ Always available
- ✅ Simple key-value storage
- ✅ Good for settings
- ❌ Not suitable for complex queries
- ❌ Not suitable for large datasets

**SQLite** (Required for receipts):
- ✅ Relational database
- ✅ Complex queries
- ✅ Indexes for performance
- ✅ Suitable for large datasets
- ❌ Requires native module
- ❌ Needs rebuild after installation

### Why Settings Work But Receipts Don't

Settings are simple key-value data that can be stored in AsyncStorage. Receipts require:
- Complex queries (search, filter, sort)
- Relationships (receipts + images)
- Indexes for performance
- Transaction support

These features require SQLite.

## Support

If the rebuild doesn't fix the issue:

1. Check Android Studio logs for more details
2. Verify `expo-sqlite` version matches Expo SDK version
3. Check if device/emulator supports SQLite
4. Try on a different device/emulator
5. Check Expo forums for similar issues

## Prevention

To avoid this in the future:

1. Always rebuild after adding native dependencies
2. Clear caches regularly during development
3. Use `npx expo prebuild` to verify native setup
4. Test on physical devices, not just emulators
