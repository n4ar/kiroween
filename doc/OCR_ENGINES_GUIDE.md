# OCR Engines Guide

## Overview

The app now supports three OCR engine types:

1. **Manual Entry** - User enters receipt details manually
2. **Native OCR** - Uses device's built-in text recognition (iOS/Android)
3. **AI Vendor** - Uses AI models from OpenAI, Google, Anthropic, or OpenRouter

## Architecture

### OCR Engine Types

```typescript
type OCREngineType = 'manual' | 'native' | 'ai-vendor';
```

### AI Vendors

```typescript
type AIVendor = 'openai' | 'google' | 'anthropic' | 'openrouter';
```

### Available Models

#### OpenAI
- `gpt-4o` - Most capable, best for complex receipts
- `gpt-4o-mini` - Faster and more affordable
- `gpt-4-turbo` - Previous generation

#### Google AI
- `gemini-2.0-flash-exp` - Latest and fastest
- `gemini-1.5-pro` - Most capable
- `gemini-1.5-flash` - Fast and efficient

#### Anthropic
- `claude-3-5-sonnet-20241022` - Most capable
- `claude-3-5-haiku-20241022` - Fast and affordable

#### OpenRouter
- `openai/gpt-4o` - GPT-4o via OpenRouter
- `anthropic/claude-3.5-sonnet` - Claude 3.5 Sonnet via OpenRouter
- `google/gemini-2.0-flash-exp:free` - Gemini 2.0 Flash (Free)

## Setup

### 1. Install Dependencies

```bash
bun add ai @ai-sdk/openai @ai-sdk/google @ai-sdk/anthropic expo-secure-store
```

### 2. Initialize OCR Engines

The engines are automatically initialized in `app/_layout.tsx`:

```typescript
import { initializeOCREngines } from '@/src/services/ocr/initializeEngines';

// In your initialization code
initializeOCREngines();
```

### 3. Configure AI Vendor (Optional)

Users can configure their AI vendor through the settings screen:

```typescript
// Navigate to AI vendor settings
router.push('/ai-vendor-settings');
```

## Usage

### Using OCR Engine Selector Component

```typescript
import { OCREngineSelector } from '@/src/components/OCREngineSelector';
import { OCREngineType } from '@/src/types';

function MyScreen() {
  const [selectedEngine, setSelectedEngine] = useState<OCREngineType>('manual');

  return (
    <OCREngineSelector
      selectedEngine={selectedEngine}
      onEngineChange={setSelectedEngine}
    />
  );
}
```

### Processing Receipt with OCR

```typescript
import { ocrService } from '@/src/services/ocr';

// Process receipt with specific engine
const result = await ocrService.processReceipt(
  imageUri,
  'ai-vendor', // or 'native' or 'manual'
  (progress) => {
    console.log(`Progress: ${progress}%`);
  }
);

console.log('Store:', result.storeName);
console.log('Total:', result.totalAmount);
console.log('Items:', result.lineItems);
```

### Managing AI Vendor Configuration

```typescript
import { useAIVendorConfig } from '@/src/hooks/useAIVendorConfig';

function MyComponent() {
  const { config, isConfigured, saveConfig, deleteConfig } = useAIVendorConfig();

  // Save configuration
  await saveConfig({
    vendor: 'openai',
    apiKey: 'sk-...',
    model: 'gpt-4o-mini',
  });

  // Check if configured
  if (isConfigured) {
    console.log('AI vendor is configured');
  }

  // Delete configuration
  await deleteConfig();
}
```

### Secure Storage

API keys are stored securely using `expo-secure-store`:

```typescript
import { SecureStorage } from '@/src/services/storage/SecureStorage';

// Save AI vendor config
await SecureStorage.saveAIVendorConfig({
  vendor: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o-mini',
});

// Get AI vendor config
const config = await SecureStorage.getAIVendorConfig();

// Delete AI vendor config
await SecureStorage.deleteAIVendorConfig();

// Check if configured
const hasConfig = await SecureStorage.hasAIVendorConfig();
```

## File Structure

```
src/
├── services/
│   ├── ocr/
│   │   ├── engines/
│   │   │   ├── AIVendorEngine.ts      # AI vendor implementation
│   │   │   ├── ManualEngine.ts        # Manual entry implementation
│   │   │   ├── NativeEngine.ts        # Native OCR implementation
│   │   │   └── index.ts
│   │   ├── initializeEngines.ts       # Engine initialization
│   │   ├── OCRService.ts              # OCR service manager
│   │   └── index.ts
│   └── storage/
│       ├── SecureStorage.ts           # Secure API key storage
│       └── index.ts
├── types/
│   └── ocr.ts                         # OCR type definitions
├── hooks/
│   └── useAIVendorConfig.ts          # AI vendor config hook
└── components/
    └── OCREngineSelector.tsx          # OCR engine selector UI

app/
└── ai-vendor-settings.tsx             # AI vendor settings screen
```

## Security

- API keys are stored using `expo-secure-store`, which uses:
  - **iOS**: Keychain Services
  - **Android**: EncryptedSharedPreferences (AES-256)
- Keys are never logged or exposed in the UI
- Keys are stored locally on the device only

## Error Handling

```typescript
try {
  const result = await ocrService.processReceipt(imageUri, 'ai-vendor');
} catch (error) {
  if (error.message.includes('not configured')) {
    // Prompt user to configure AI vendor
    router.push('/ai-vendor-settings');
  } else {
    // Handle other errors
    Alert.alert('Error', 'Failed to process receipt');
  }
}
```

## Best Practices

1. **Check availability before processing**:
   ```typescript
   const isAvailable = await ocrService.isEngineAvailable('ai-vendor');
   if (!isAvailable) {
     // Prompt user to configure
   }
   ```

2. **Provide progress feedback**:
   ```typescript
   await ocrService.processReceipt(imageUri, 'ai-vendor', (progress) => {
     setProgress(progress);
   });
   ```

3. **Handle user cancellation**:
   ```typescript
   if (selectedEngine === 'ai-vendor' && !isConfigured) {
     Alert.alert(
       'Configuration Required',
       'Please configure your AI vendor first',
       [
         { text: 'Cancel', style: 'cancel' },
         { text: 'Configure', onPress: () => router.push('/ai-vendor-settings') },
       ]
     );
   }
   ```

## Testing

### Test Manual Engine
```typescript
const result = await ocrService.processReceipt(imageUri, 'manual');
// Should return empty result immediately
```

### Test Native Engine
```typescript
const result = await ocrService.processReceipt(imageUri, 'native');
// Should extract text using device OCR
```

### Test AI Vendor Engine
```typescript
// First configure AI vendor
await SecureStorage.saveAIVendorConfig({
  vendor: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o-mini',
});

// Then process
const result = await ocrService.processReceipt(imageUri, 'ai-vendor');
// Should return structured receipt data from AI
```

## Troubleshooting

### "AI vendor not configured" error
- Navigate to AI vendor settings and enter your API key
- Ensure you've selected a model

### Native OCR not working
- Check if `expo-text-extractor` is supported on your platform
- Native OCR only works on iOS and Android (not web)

### API key not persisting
- Check if `expo-secure-store` is properly installed
- On web, secure store may not be available (use fallback storage)

## Migration from Old Engines

Old engines (`VLMEngine`, `RemoteAPIEngine`, `TesseractEngine`) have been removed and replaced with:

- `VLMEngine` → `AIVendorEngine` (with vendor selection)
- `RemoteAPIEngine` → `AIVendorEngine` (with vendor selection)
- `TesseractEngine` → `NativeEngine` (renamed from `ExpoTextExtractorEngine`)

Update your code:
```typescript
// Old
ocrService.setDefaultEngine('vlm');

// New
ocrService.setDefaultEngine('ai-vendor');
```
