# OCR Engine Refactor Summary

## Changes Made

### 1. Updated OCR Engine Types
- Changed from `'vlm' | 'tesseract' | 'remote' | 'manual'` to `'manual' | 'native' | 'ai-vendor'`
- Removed old engines: `VLMEngine`, `RemoteAPIEngine`, `TesseractEngine`
- Renamed `ExpoTextExtractorEngine` to `NativeEngine`

### 2. Added AI Vendor Support
- Created `AIVendorEngine` that supports multiple AI providers:
  - OpenAI (GPT-4o, GPT-4o Mini, GPT-4 Turbo)
  - Google AI (Gemini 2.0 Flash, Gemini 1.5 Pro/Flash)
  - Anthropic (Claude 3.5 Sonnet/Haiku)
  - OpenRouter (access to multiple models)

### 3. Secure API Key Storage
- Created `SecureStorage` service using `expo-secure-store`
- API keys stored securely using:
  - iOS: Keychain Services
  - Android: EncryptedSharedPreferences (AES-256)

### 4. New Components & Hooks
- `useAIVendorConfig` - Hook to manage AI vendor configuration
- `OCREngineSelector` - Component to select OCR engine with configuration prompts
- `ai-vendor-settings.tsx` - Screen to configure AI vendor, API key, and model

### 5. Dependencies Added
```json
{
  "ai": "^5.0.104",
  "@ai-sdk/openai": "^2.0.74",
  "@ai-sdk/google": "^2.0.44",
  "@ai-sdk/anthropic": "^2.0.50"
}
```

Note: `expo-secure-store` was already installed.

## File Structure

### New Files
- `src/services/ocr/engines/AIVendorEngine.ts`
- `src/services/ocr/initializeEngines.ts`
- `src/services/storage/SecureStorage.ts`
- `src/hooks/useAIVendorConfig.ts`
- `src/components/OCREngineSelector.tsx`
- `app/ai-vendor-settings.tsx`
- `OCR_ENGINES_GUIDE.md`

### Modified Files
- `src/types/ocr.ts` - Updated types and added AI vendor definitions
- `src/types/receipt.ts` - Updated AppSettings interface
- `src/services/ocr/engines/ExpoTextExtractorEngine.ts` → `NativeEngine.ts` (renamed)
- `src/services/ocr/engines/index.ts` - Updated exports
- `src/services/storage/index.ts` - Added SecureStorage export
- `app/_layout.tsx` - Updated OCR initialization

### Deleted Files
- `src/services/ocr/engines/VLMEngine.ts`
- `src/services/ocr/engines/RemoteAPIEngine.ts`

## Usage Example

### 1. Configure AI Vendor
```typescript
import { router } from 'expo-router';

// Navigate to settings
router.push('/ai-vendor-settings');

// User selects vendor (e.g., OpenAI)
// User enters API key
// User selects model (e.g., gpt-4o-mini)
// Configuration is saved securely
```

### 2. Select OCR Engine
```typescript
import { OCREngineSelector } from '@/src/components/OCREngineSelector';

<OCREngineSelector
  selectedEngine={selectedEngine}
  onEngineChange={setSelectedEngine}
/>
```

### 3. Process Receipt
```typescript
import { ocrService } from '@/src/services/ocr';

const result = await ocrService.processReceipt(
  imageUri,
  'ai-vendor',
  (progress) => console.log(`${progress}%`)
);
```

## Migration Guide

### For Developers

1. **Update engine references**:
   ```typescript
   // Old
   ocrService.setDefaultEngine('vlm');
   
   // New
   ocrService.setDefaultEngine('ai-vendor');
   ```

2. **Update settings**:
   ```typescript
   // Old
   interface AppSettings {
     ocrEngine: 'vlm' | 'tesseract' | 'remote' | 'manual';
   }
   
   // New
   interface AppSettings {
     ocrEngine: 'manual' | 'native' | 'ai-vendor';
   }
   ```

### For Users

1. Existing users will default to 'manual' engine
2. To use AI features:
   - Go to Settings → AI Vendor Settings
   - Select a vendor (OpenAI, Google, Anthropic, or OpenRouter)
   - Enter API key
   - Select model
3. To use native OCR:
   - Select "Native OCR" in engine selector
   - Works automatically on iOS/Android

## Security Considerations

- API keys never leave the device
- Keys stored in platform-specific secure storage
- Keys not logged or exposed in UI
- No network requests except to selected AI vendor

## Testing Checklist

- [ ] Manual engine returns empty result
- [ ] Native engine extracts text on iOS/Android
- [ ] AI vendor configuration saves/loads correctly
- [ ] AI vendor processes receipts with correct API
- [ ] OCR engine selector shows configuration status
- [ ] Settings screen validates input
- [ ] API keys stored securely
- [ ] Error handling for missing configuration
- [ ] Progress callbacks work correctly

## Next Steps

1. Update any existing screens that use OCR to include engine selection
2. Add user preferences to persist selected engine
3. Add analytics to track engine usage
4. Consider adding cost estimation for AI vendors
5. Add retry logic for AI vendor failures
6. Consider adding local caching for AI responses
