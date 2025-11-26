# Download Receipt Images Feature

## Overview
Added the ability to download receipt images to the device's photo library after auto-crop is applied and when viewing receipts.

## Changes Made

### 1. New Download Utility (`src/utils/download.ts`)
- Created `DownloadUtil` class with methods for downloading and sharing images
- Supports both native (iOS/Android) and web platforms
- Uses `expo-media-library` for native platforms
- Uses browser download API for web
- Includes proper error handling and permission requests

### 2. Dependencies Added
- `expo-media-library@18.2.0` - For saving images to photo library

### 3. Configuration Updates (`app.json`)
- Added `expo-media-library` plugin with permissions:
  - `photosPermission`: Access photos to view and manage receipts
  - `savePhotosPermission`: Save receipt images to photo library
  - `isAccessMediaLocationEnabled`: false (not needed for this use case)

### 4. OCR Process Screen (`app/ocr-process.tsx`)
- Added download button that appears after image is processed
- Button shows after auto-crop is complete
- Includes loading state while downloading
- Shows success/error alerts with haptic feedback
- Downloads with filename format: `receipt-{timestamp}.jpg`

### 5. OCR Review Screen (`app/ocr-review.tsx`)
- Added floating download and share buttons over the image preview
- Buttons positioned in top-right corner of image
- Download button shows loading spinner while downloading
- Share button opens native share dialog
- Downloads with filename format: `receipt-{storeName}-{timestamp}.jpg`

### 6. Receipt Detail Screen (`app/receipt-detail.tsx`)
- Redesigned action buttons layout
- Added download button (icon-based)
- Added share button (icon-based)
- Kept delete button (icon-based)
- Edit button now spans full width below icon buttons
- Downloads with filename format: `receipt-{storeName}-{timestamp}.jpg`

## User Experience

### OCR Process Screen
1. User captures/selects an image
2. Image is auto-cropped and processed
3. Download button appears below progress indicator
4. User can download the cropped image before proceeding to OCR review

### OCR Review Screen
1. User reviews OCR results and edits receipt details
2. Floating download and share buttons appear in top-right of image
3. Download button saves the auto-cropped image to photo library
4. Share button opens native share dialog
5. Buttons have semi-transparent white background with shadow for visibility

### Receipt Detail Screen
1. User views a saved receipt
2. Three icon buttons at top: Download, Share, Delete
3. Full-width Edit button below
4. Download saves to photo library
5. Share opens native share dialog

## Permissions
The app will request photo library permissions when user attempts to download:
- **iOS**: Requires `NSPhotoLibraryAddUsageDescription`
- **Android**: Requires `WRITE_EXTERNAL_STORAGE` and media permissions
- **Web**: No permissions needed (browser download)

## Platform Support
- ✅ iOS
- ✅ Android
- ✅ Web

## Notes
- Images are saved to a "Resight" album on native platforms (if supported)
- Fallback to share dialog if media library access fails
- All operations include proper error handling and user feedback
