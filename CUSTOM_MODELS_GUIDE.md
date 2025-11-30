# Custom Models Guide

## Overview

Users can now add custom AI models that aren't in the predefined list. This is useful for:
- **New models** - Recently released models not yet added to the app
- **Beta/Preview models** - Testing new model versions
- **Custom endpoints** - Using fine-tuned or custom-deployed models
- **Regional models** - Models available in specific regions

## Features

- ✅ Add custom models for any AI vendor
- ✅ Validation to prevent duplicates
- ✅ Visual badge to distinguish custom models
- ✅ Easy removal of custom models
- ✅ Persistent storage with configuration
- ✅ Search works with custom models
- ✅ Examples for each vendor

## How to Add a Custom Model

### Step 1: Open AI Vendor Settings
Navigate to Settings → AI Vendor Settings

### Step 2: Select Your Vendor
Choose the vendor (OpenAI, Google, Anthropic, or OpenRouter)

### Step 3: Tap "Add Custom"
In the "Select Model" section, tap the "Add Custom" button

### Step 4: Fill in Model Details

**Model ID** (Required)
- The exact identifier used in API calls
- Example: `gpt-4-turbo-preview`
- Must be unique (no duplicates)

**Display Name** (Required)
- A friendly name shown in the picker
- Example: `GPT-4 Turbo Preview`

**Description** (Optional)
- Additional information about the model
- Example: `Latest preview version with improved capabilities`

### Step 5: Save
Tap "Add" to save the custom model

## Examples by Vendor

### OpenAI
```
Model ID: gpt-4-turbo-preview
Display Name: GPT-4 Turbo Preview
Description: Latest preview version
```

### Google AI
```
Model ID: gemini-pro-vision
Display Name: Gemini Pro Vision
Description: Multimodal model with vision capabilities
```

### Anthropic
```
Model ID: claude-3-opus-20240229
Display Name: Claude 3 Opus
Description: Most capable Claude model
```

### OpenRouter
```
Model ID: meta-llama/llama-3-70b
Display Name: Llama 3 70B
Description: Open source model via OpenRouter
```

## Using Custom Models

Once added, custom models appear in the model picker with:
- 🟠 **Orange "CUSTOM" badge** - Easy identification
- **Same search functionality** - Find them by name, ID, or description
- **Delete button** - Remove when no longer needed

### Selecting a Custom Model

1. Tap the model picker button
2. Search or scroll to find your custom model
3. Look for the orange "CUSTOM" badge
4. Tap to select

## Removing Custom Models

### Method 1: From Model Picker
1. Open the model picker
2. Find the custom model (look for orange badge)
3. Tap the trash icon on the right
4. Confirm removal

### Method 2: Automatic Cleanup
- If you delete your configuration, all custom models are removed
- If you switch vendors, only models for that vendor are shown

## Data Storage

Custom models are stored:
- **Location**: Secure storage with your API key
- **Format**: JSON array in `AIVendorConfig`
- **Persistence**: Saved across app restarts
- **Security**: Same security as API keys

### Storage Structure
```typescript
{
  vendor: 'openai',
  apiKey: 'sk-...',
  model: 'gpt-4o-mini',
  customModels: [
    {
      id: 'gpt-4-turbo-preview',
      name: 'GPT-4 Turbo Preview',
      description: 'Latest preview version',
      vendor: 'openai'
    }
  ]
}
```

## Validation Rules

### Model ID
- ✅ Required
- ✅ Must be unique (no duplicates)
- ✅ Case-sensitive
- ✅ No whitespace trimming (use exact ID)

### Display Name
- ✅ Required
- ✅ Can contain any characters
- ✅ Whitespace is trimmed

### Description
- ✅ Optional
- ✅ Can be empty
- ✅ Whitespace is trimmed

## UI Components

### Add Custom Button
```
┌─────────────────────────────┐
│ Select Model    [+] Add Custom│
└─────────────────────────────┘
```

### Custom Model Badge
```
┌─────────────────────────────┐
│ GPT-4 Turbo [CUSTOM]    ✓  │
│ Latest preview version      │
│ gpt-4-turbo-preview         │
└─────────────────────────────┘
```

### Delete Button
```
┌─────────────────────────────┐
│ My Custom Model [CUSTOM] 🗑️ │
└─────────────────────────────┘
```

## Best Practices

### Naming Conventions
- Use clear, descriptive names
- Follow vendor naming patterns
- Include version numbers if applicable

### Model IDs
- Copy exact IDs from vendor documentation
- Double-check for typos
- Test with a simple API call first

### Descriptions
- Mention key capabilities
- Note any limitations
- Include cost information if relevant

## Common Use Cases

### 1. New Model Release
When a vendor releases a new model:
```
1. Check vendor documentation for model ID
2. Add as custom model
3. Test with a receipt
4. Wait for app update to add officially
```

### 2. Beta Testing
Testing preview models:
```
1. Get beta access from vendor
2. Add preview model ID
3. Mark as "Preview" in description
4. Remove when stable version releases
```

### 3. Fine-Tuned Models
Using custom-trained models:
```
1. Deploy your fine-tuned model
2. Get the model ID from deployment
3. Add with descriptive name
4. Note it's fine-tuned in description
```

### 4. Regional Models
Models available in specific regions:
```
1. Check regional availability
2. Add with region in name
3. Note region in description
4. Use appropriate API endpoint
```

## Troubleshooting

### "A model with this ID already exists"
- Check if model is in predefined list
- Verify you haven't already added it
- Check for typos in model ID

### Model doesn't work
- Verify model ID is correct
- Check API key has access to model
- Confirm model is available in your region
- Test with vendor's API directly

### Can't find custom model
- Check you're on the correct vendor
- Use search to find by name or ID
- Look for orange "CUSTOM" badge

### Custom model disappeared
- Check if configuration was deleted
- Verify you're on the same vendor
- Check if model was removed

## API Integration

Custom models work seamlessly with the AI Vendor Engine:

```typescript
// Custom model is used just like predefined models
const result = await ocrService.processReceipt(
  imageUri,
  'ai-vendor',
  (progress) => console.log(progress)
);
```

The engine automatically:
- Uses the correct vendor API
- Applies the custom model ID
- Handles authentication
- Processes responses

## Future Enhancements

Potential improvements:
1. Import/export custom models
2. Share custom models with others
3. Model templates for common use cases
4. Automatic model discovery
5. Model performance tracking
6. Cost estimation per model
7. Model capability tags
8. Favorite models

## Related Files

- `src/components/AddCustomModelModal.tsx` - Add custom model UI
- `src/components/SearchableModelPicker.tsx` - Model picker with custom support
- `app/ai-vendor-settings.tsx` - Settings screen with custom models
- `src/types/ocr.ts` - CustomModel type definition
- `src/services/storage/SecureStorage.ts` - Storage for custom models

## Testing Checklist

- [ ] Can add custom model
- [ ] Validation prevents duplicates
- [ ] Custom badge appears
- [ ] Search finds custom models
- [ ] Can select custom model
- [ ] Can delete custom model
- [ ] Custom models persist
- [ ] Works with all vendors
- [ ] Examples are helpful
- [ ] Error messages are clear

## Support

If you encounter issues:
1. Check model ID is correct
2. Verify API key permissions
3. Test with vendor API directly
4. Check app logs for errors
5. Try removing and re-adding model
