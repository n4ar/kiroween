# Settings Database Error Fix

## Issue
```
ERROR Error saving settings: [AppError: Failed to save settings: Error: Call to function 'NativeDatabase.prepareAsync' has been rejected.
→ Caused by: java.lang.NullPointerException
```

## Root Cause
The `AppSettings` interface was updated to remove `tesseractLanguage` and `remoteApiEndpoint` fields when refactoring OCR engines, but:

1. Default settings in `SQLiteStorage.ts` still included these fields
2. Settings screen still referenced these fields
3. OCR engine options still used old engine types (`tesseract`, `remote`, `vlm`)

## Files Fixed

### 1. `src/services/storage/SQLiteStorage.ts`
**Before:**
```typescript
return {
  ocrEngine: 'manual',
  autoCrop: true,
  tesseractLanguage: 'eng',  // ❌ Removed field
  theme: 'auto',
};
```

**After:**
```typescript
return {
  ocrEngine: 'manual',
  autoCrop: true,
  theme: 'auto',
};
```

### 2. `app/(tabs)/settings.tsx`

#### OCR Engine Options
**Before:**
```typescript
const ocrEngines = [
  { value: 'manual', label: 'Manual Entry', ... },
  { value: 'tesseract', label: 'Native OCR', ... },  // ❌ Old type
  { value: 'remote', label: 'Remote API', ... },     // ❌ Old type
  { value: 'vlm', label: 'VLM (Donut)', ... },       // ❌ Old type
];
```

**After:**
```typescript
const ocrEngines = [
  { value: 'manual', label: 'Manual Entry', ... },
  { value: 'native', label: 'Native OCR', ... },     // ✅ New type
  { value: 'ai-vendor', label: 'AI Vendor', ... },   // ✅ New type
];
```

#### Engine-Specific Settings
**Before:**
```typescript
{settings.ocrEngine === 'tesseract' && (
  // Native OCR settings
)}

{settings.ocrEngine === 'remote' && (
  // Remote API settings with remoteApiEndpoint
)}
```

**After:**
```typescript
{settings.ocrEngine === 'native' && (
  // Native OCR settings
)}

{settings.ocrEngine === 'ai-vendor' && (
  // AI Vendor settings with link to configuration
)}
```

#### Default Settings
**Before:**
```typescript
const defaultSettings: AppSettings = {
  ocrEngine: 'manual',
  autoCrop: true,
  tesseractLanguage: 'eng',  // ❌ Removed field
  theme: 'auto',
};
```

**After:**
```typescript
const defaultSettings: AppSettings = {
  ocrEngine: 'manual',
  autoCrop: true,
  theme: 'auto',
};
```

## Current AppSettings Interface

```typescript
interface AppSettings {
  ocrEngine: 'manual' | 'native' | 'ai-vendor';
  autoCrop: boolean;
  theme: 'light' | 'dark' | 'auto';
}
```

## Testing

1. ✅ App initializes without database errors
2. ✅ Settings can be saved and loaded
3. ✅ OCR engine selection shows correct options
4. ✅ AI Vendor settings link works when ai-vendor is selected
5. ✅ Default settings match interface

## Migration Notes

Users with existing settings that have old OCR engine types will need to:
1. Open settings
2. Select a new OCR engine type (manual, native, or ai-vendor)
3. Save settings

The app will handle this gracefully by defaulting to 'manual' if an invalid engine type is encountered.
