# Paperkeep - Receipt Management App

An offline-first, privacy-focused receipt management application built with React Native and Expo.

## 🎯 Features

### Core Functionality
- **Receipt Capture**: Camera integration with flash and camera flip
- **Gallery Upload**: Select existing images from photo library
- **OCR Processing**: Multiple OCR engine support (Manual, Tesseract, Remote API, VLM)
- **Receipt Management**: Browse, view, edit, and delete receipts
- **Search & Filter**: Full-text search with tag, date, and amount filters
- **Tagging System**: Organize receipts with custom tags
- **Settings**: Configure OCR engine, auto-crop, and theme preferences

### Technical Highlights
- **Offline-First**: All data stored locally (SQLite + FileSystem)
- **Privacy-Focused**: No cloud services, no tracking
- **Type-Safe**: Full TypeScript implementation
- **Modular Architecture**: Clean separation of concerns
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance**: Optimized with debouncing, memoization, and efficient rendering

## 📱 Screens

1. **Home (Receipts)**: 2-column grid of receipts with pull-to-refresh
2. **Capture**: Camera view with flash and gallery access
3. **OCR Process**: Progress indicator during OCR processing
4. **OCR Review**: Edit extracted data before saving
5. **Receipt Detail**: Full receipt information with image viewer
6. **Search**: Search and filter receipts
7. **Settings**: Configure app preferences

## 🏗️ Architecture

```
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen
│   │   ├── capture.tsx    # Camera screen
│   │   └── settings.tsx   # Settings screen
│   ├── ocr-process.tsx    # OCR processing
│   ├── ocr-review.tsx     # Review OCR results
│   ├── receipt-detail.tsx # Receipt details
│   └── search.tsx         # Search & filter
├── src/
│   ├── components/        # Reusable components
│   │   └── forms/         # Form components (TagInput)
│   ├── services/          # Business logic
│   │   ├── storage/       # SQLite + FileSystem
│   │   ├── ocr/           # OCR engines
│   │   └── image/         # Image processing
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript definitions
│   └── constants/         # Design system constants
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Bun (package manager)
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun start

# Run on iOS
bun run ios

# Run on Android
bun run android
```

### First Run

1. The app will initialize storage on first launch
2. Grant camera and photo library permissions when prompted
3. Start capturing receipts!

## 📦 Dependencies

### Core
- `expo` ~54.0.25
- `react-native` 0.81.5
- `react` 19.1.0
- `expo-router` ~6.0.15

### Storage
- `expo-sqlite` - Receipt metadata
- `expo-file-system` - Image storage
- `@react-native-async-storage/async-storage` - Settings

### Camera & Images
- `expo-camera` - Camera integration
- `expo-image-picker` - Gallery access
- `expo-image-manipulator` - Image processing

### UI & Navigation
- `@react-navigation/native` - Navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `@react-navigation/stack` - Stack navigation
- `@expo/vector-icons` - Icons
- `expo-haptics` - Haptic feedback

## 🎨 Design System

### Colors
- **Background**: #FEFCF8 (warm off-white)
- **Primary**: #6B7F5A (sage green)
- **Accent**: #D4A574 (muted amber)
- **Text**: #2C2C2C (dark gray)

### Typography
- **UI**: Inter (system default)
- **Monospace**: JetBrains Mono (dates, amounts)

### Style
- Card-based layouts
- Soft shadows
- Rounded edges (8-12px)
- Warm, cozy aesthetic

## 💾 Data Storage

### Receipt Metadata (SQLite)
```sql
CREATE TABLE receipts (
  id TEXT PRIMARY KEY,
  store_name TEXT NOT NULL,
  date INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,  -- In cents
  tags TEXT NOT NULL,              -- JSON array
  notes TEXT,
  ocr_text TEXT NOT NULL,
  image_uri TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Images (FileSystem)
- Stored in app's document directory
- Compressed to 80% quality
- Max dimension: 1920px
- Format: JPEG

### Settings (SQLite)
- OCR engine preference
- Auto-crop toggle
- Tesseract language
- Remote API endpoint
- Theme preference

## 🔧 Configuration

### OCR Engines

1. **Manual Entry** (Default)
   - No OCR processing
   - User enters all data manually
   - Always available

2. **Tesseract OCR**
   - Traditional OCR
   - Multi-language support
   - Requires integration

3. **Remote API**
   - External OCR service
   - Requires internet connection
   - Configurable endpoint

4. **VLM (Donut)**
   - Vision Language Model
   - Best accuracy
   - Requires integration

### Settings

Access via Settings tab:
- Select OCR engine
- Toggle auto-crop
- Configure engine-specific options
- Choose theme (light/dark/auto)
- Reset to defaults

## 🔒 Privacy & Security

- **No Cloud Storage**: All data stays on device
- **No Analytics**: No tracking or telemetry
- **No Network Requests**: Except optional Remote API OCR
- **Local Processing**: OCR runs on-device (when available)
- **Sandboxed Storage**: App data isolated from other apps

## 📝 Usage

### Capturing a Receipt

1. Tap the camera icon in the tab bar
2. Grant camera permission if prompted
3. Position receipt in frame
4. Tap capture button
5. Review OCR results
6. Edit if needed
7. Save receipt

### Searching Receipts

1. Tap search icon on home screen
2. Enter search query (debounced)
3. Tap filter icon for advanced filters
4. Select tags, date range, or amount range
5. Results update in real-time

### Managing Tags

1. Open receipt detail or OCR review
2. Tap tag input field
3. Type tag name
4. Select from suggestions or add new
5. Tags are normalized to lowercase
6. Maximum 10 tags per receipt

## 🐛 Known Limitations

1. **OCR Engines**: Only Manual Entry is fully functional
2. **Auto-Crop**: Basic implementation without edge detection
3. **Date Picker**: Not implemented in OCR review
4. **Receipt Editing**: Edit button shows alert
5. **Export/Import**: Not implemented
6. **Tests**: No automated tests

## 🚧 Future Enhancements

### High Priority
- [ ] Integrate real OCR engines (Tesseract, VLM)
- [ ] Implement edge detection for auto-crop
- [ ] Add date picker component
- [ ] Create receipt editing screen
- [ ] Implement export/import functionality

### Medium Priority
- [ ] Add swipe gestures for delete/edit
- [ ] Implement receipt categories
- [ ] Add multi-currency support
- [ ] Create analytics dashboard
- [ ] Add receipt splitting

### Low Priority
- [ ] Cloud backup (optional, encrypted)
- [ ] Shared receipt collections
- [ ] Recurring receipt detection
- [ ] Tax category tagging
- [ ] Export to accounting software

## 🧪 Testing

### Manual Testing Checklist

- [ ] Camera capture works
- [ ] Gallery upload works
- [ ] OCR processing completes
- [ ] Receipt saves successfully
- [ ] Receipt list displays correctly
- [ ] Search works with debouncing
- [ ] Filters work correctly
- [ ] Tags can be added/removed
- [ ] Settings persist across restarts
- [ ] Delete confirmation works
- [ ] Pull-to-refresh works
- [ ] Empty states display
- [ ] Error handling works
- [ ] Haptic feedback works
- [ ] Navigation flows correctly

### Performance Testing

- [ ] App launches in < 3s
- [ ] Image compression in < 2s
- [ ] OCR processing in < 10s
- [ ] Search responds in < 1s
- [ ] List scrolls at 60fps with 100+ receipts
- [ ] Memory usage < 200MB during OCR

## 📄 License

This project is part of a spec-driven development exercise.

## 🙏 Acknowledgments

Built with:
- Expo
- React Native
- TypeScript
- SQLite
- And many other open-source libraries

---

**Version**: 1.0.0  
**Status**: MVP Complete  
**Last Updated**: 2024
