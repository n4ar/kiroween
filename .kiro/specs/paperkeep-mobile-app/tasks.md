# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Initialize Expo project with TypeScript template
  - Install required dependencies: expo-sqlite, expo-file-system, expo-camera, expo-image-picker, expo-image-manipulator, @react-navigation/native, @react-navigation/bottom-tabs, @react-navigation/stack, @react-native-async-storage/async-storage
  - Configure TypeScript with strict mode
  - Set up project directory structure (components, screens, services, types, hooks, utils, constants)
  - _Requirements: 10.1, 10.4_

- [x] 2. Implement core data models and types
  - Create TypeScript interfaces for Receipt, OCRResult, LineItem, AppSettings
  - Create type definitions for storage adapters and OCR engines
  - Define error types and error codes
  - _Requirements: 3.4, 7.6_

- [x] 3. Implement storage layer
  - [x] 3.1 Create storage adapter interface (IStorageAdapter)
    - Define interface methods for receipt CRUD operations
    - Define interface methods for image operations
    - Define interface methods for settings operations
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [x] 3.2 Implement SQLite metadata storage
    - Create database initialization with schema
    - Implement receipt save, get, getAll, update, delete methods
    - Create indexes for date and store_name columns
    - Add data validation before persistence
    - _Requirements: 3.1, 3.4, 3.5_
  
  - [x] 3.3 Implement FileSystem image storage
    - Create image directory on app initialization
    - Implement saveImage method with file copying
    - Implement getImage method returning file URI
    - Implement deleteImage method with cleanup
    - _Requirements: 3.2, 3.6_
  
  - [x] 3.4 Implement AsyncStorage settings storage
    - Create saveSettings method with JSON serialization
    - Create getSettings method with default values fallback
    - _Requirements: 7.6_

- [x] 4. Implement image processing service
  - [x] 4.1 Create image processor interface and implementation
    - Implement compress method using expo-image-manipulator
    - Set compression quality to 80% and max dimension to 1920px
    - Implement resize method for thumbnail generation
    - _Requirements: 1.4_
  
  - [x] 4.2 Implement auto-crop functionality
    - Implement edge detection algorithm for receipt boundaries
    - Create autoCrop method that detects and crops to receipt edges
    - Add error handling for edge detection failures
    - Complete processing within 2 seconds
    - _Requirements: 1.3_

- [x] 5. Implement OCR service architecture
  - [x] 5.1 Create OCR engine interface (IOCREngine)
    - Define interface with process, isAvailable methods
    - Create OCRService class with engine registration
    - Implement engine selection logic based on settings
    - _Requirements: 2.1_
  
  - [x] 5.2 Implement Manual Entry engine
    - Create ManualEngine class returning empty OCRResult
    - Set confidence to 0 for manual entries
    - _Requirements: 2.6_
  
  - [x] 5.3 Implement Tesseract OCR engine
    - Integrate react-native-tesseract-ocr library
    - Implement process method with progress callbacks
    - Add language configuration support
    - Parse OCR text to extract store name, date, amount, line items
    - Target completion within 10 seconds
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 5.4 Implement Remote API OCR engine
    - Create HTTP client for external OCR service
    - Implement process method with configurable endpoint
    - Add timeout handling (10 seconds)
    - Add retry logic with exponential backoff
    - Handle network unavailability gracefully
    - _Requirements: 2.1, 2.2, 2.4, 10.3_
  
  - [x] 5.5 Implement VLM/Donut OCR engine
    - Integrate Transformers.js with Donut model
    - Implement model loading and caching
    - Run processing in background thread
    - Extract structured receipt data
    - Target completion within 10 seconds
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.2_

- [x] 6. Implement receipt capture functionality
  - [x] 6.1 Create CaptureScreen with camera integration
    - Integrate expo-camera with permission handling
    - Implement camera view with capture button
    - Add flash toggle and auto-crop toggle controls
    - Display permission error messages when denied
    - _Requirements: 1.1, 1.5_
  
  - [x] 6.2 Implement file upload from gallery
    - Integrate expo-image-picker for gallery access
    - Add gallery button to CaptureScreen
    - Handle permission requests for photo library
    - Display error messages for upload failures
    - _Requirements: 1.2, 1.5_
  
  - [x] 6.3 Implement capture flow with image processing
    - Process captured/uploaded image through compression
    - Apply auto-crop if enabled in settings
    - Navigate to OCR processing screen after capture
    - Clean up temporary files after processing
    - _Requirements: 1.3, 1.4_

- [x] 7. Implement OCR processing flow
  - [x] 7.1 Create OCR processing screen
    - Display progress indicator during OCR processing
    - Show progress percentage from OCR engine callbacks
    - Handle OCR errors with user-friendly messages
    - _Requirements: 2.3, 2.5_
  
  - [x] 7.2 Create OCR review and edit screen
    - Display extracted data in editable form fields
    - Show store name, date, amount, line items
    - Allow user to correct OCR errors before saving
    - Provide retry OCR option with engine selection
    - _Requirements: 2.5_
  
  - [x] 7.3 Implement receipt save flow
    - Validate all required fields before saving
    - Convert amount to cents for storage
    - Save receipt metadata to SQLite
    - Save receipt image to FileSystem
    - Navigate to HomeScreen after successful save
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 8. Implement receipt browsing and management
  - [x] 8.1 Create HomeScreen with receipt list
    - Implement FlatList with masonry grid layout (2 columns)
    - Display receipts in reverse chronological order
    - Show receipt cards with thumbnail, store, date, amount, tags
    - Implement pull-to-refresh functionality
    - Add floating action button for capture navigation
    - _Requirements: 4.1, 4.2, 4.6_
  
  - [x] 8.2 Create receipt card component
    - Design card layout with image thumbnail
    - Display store name, formatted date, formatted amount
    - Show up to 3 tags as chips
    - Apply design system colors and shadows
    - Implement press animation (scale to 0.98)
    - _Requirements: 4.2_
  
  - [x] 8.3 Create DetailScreen for receipt viewing
    - Display full-size receipt image with zoom capability
    - Show all receipt details in scrollable view
    - Implement edit mode toggle
    - Add delete button with confirmation dialog
    - _Requirements: 4.3, 4.5_
  
  - [x] 8.4 Implement receipt editing
    - Create editable form fields for all receipt properties
    - Implement date picker for date selection
    - Implement amount input with currency formatting
    - Implement tag chip input with suggestions
    - Save changes to storage on submit
    - _Requirements: 4.4_
  
  - [x] 8.5 Implement receipt deletion
    - Add swipe-to-delete gesture on receipt cards
    - Show confirmation dialog before deletion
    - Delete receipt metadata from SQLite
    - Delete receipt image from FileSystem
    - Update receipt list after deletion
    - _Requirements: 4.5_

- [x] 9. Implement tagging system
  - [x] 9.1 Create tag input component
    - Implement chip-based tag display
    - Add tag input field with autocomplete
    - Limit to 10 tags per receipt
    - Normalize tags to lowercase
    - _Requirements: 5.1_
  
  - [x] 9.2 Implement tag suggestions
    - Query existing tags from all receipts
    - Implement frequency-based sorting
    - Add fuzzy matching for autocomplete
    - Display suggestions dropdown during typing
    - _Requirements: 5.2_

- [x] 10. Implement search and filter functionality
  - [x] 10.1 Create search interface
    - Add search bar to HomeScreen header
    - Implement text input with debouncing (300ms)
    - Add filter button to open filter modal
    - _Requirements: 5.3_
  
  - [x] 10.2 Create filter modal
    - Add tag multi-select with existing tags
    - Add date range picker (from/to dates)
    - Add amount range inputs (min/max)
    - Apply button to execute filter
    - Clear button to reset filters
    - _Requirements: 5.3, 5.4_
  
  - [x] 10.3 Implement search and filter logic
    - Create searchReceipts function with SearchCriteria interface
    - Implement text search on store name and notes (case-insensitive)
    - Implement tag filtering with AND logic
    - Implement date range filtering
    - Implement amount range filtering
    - Update receipt list within 1 second
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 11. Implement export functionality
  - [x] 11.1 Create ExportScreen UI
    - Add export button with icon
    - Display last export timestamp
    - Show storage usage indicator
    - Display total receipt count
    - _Requirements: 6.1_
  
  - [x] 11.2 Implement data export
    - Create temporary directory for export preparation
    - Query all receipts from storage
    - Serialize receipt metadata to JSON
    - Copy all receipt images to export directory
    - Create ZIP file with metadata.json and images folder
    - Use expo-sharing to share ZIP file
    - Clean up temporary files after export
    - _Requirements: 6.1, 6.2_

- [x] 12. Implement import functionality
  - [x] 12.1 Create import UI
    - Add import button to ExportScreen
    - Integrate expo-document-picker for ZIP selection
    - _Requirements: 6.3_
  
  - [x] 12.2 Implement data import with validation
    - Extract ZIP file to temporary directory
    - Parse and validate metadata.json structure
    - Validate all required fields in receipt data
    - Check for data corruption
    - Display validation errors to user
    - _Requirements: 6.4, 6.6_
  
  - [x] 12.3 Implement conflict resolution
    - Detect receipts with matching IDs
    - Show conflict resolution dialog (merge/replace/skip)
    - Apply user's choice for each conflict
    - Import receipt metadata to SQLite
    - Import receipt images to FileSystem
    - Display import results (imported count, skipped count, errors)
    - Clean up temporary files after import
    - _Requirements: 6.4, 6.5, 6.6_

- [x] 13. Implement settings functionality
  - [x] 13.1 Create SettingsScreen UI
    - Create grouped list layout
    - Add OCR engine selection (radio buttons)
    - Add auto-crop toggle switch
    - Add theme selection (light/dark/auto)
    - Add reset to defaults button
    - _Requirements: 7.1, 7.2, 7.5_
  
  - [x] 13.2 Implement engine-specific settings
    - Show Tesseract language picker when Tesseract selected
    - Show Remote API endpoint input when Remote API selected
    - Hide irrelevant settings based on engine selection
    - _Requirements: 7.3, 7.4_
  
  - [x] 13.3 Implement settings persistence
    - Save settings changes immediately to AsyncStorage
    - Load settings on app initialization
    - Apply default values for missing settings
    - _Requirements: 7.6_

- [x] 14. Implement navigation structure
  - [x] 14.1 Set up React Navigation
    - Configure bottom tab navigator with Home, Capture, Settings tabs
    - Configure stack navigator for modal screens
    - Set up navigation types for TypeScript
    - _Requirements: 9.1, 9.2_
  
  - [x] 14.2 Implement navigation flows
    - Configure tab icons and labels
    - Set up DetailScreen as modal presentation
    - Implement back navigation handling
    - Display screen titles in navigation headers
    - Add visual indicators for active tab
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 15. Implement design system and theming
  - [x] 15.1 Create design system constants
    - Define color palettes for light and dark modes
    - Define typography scales (fonts, sizes, weights)
    - Define spacing scale
    - Define shadow styles
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 15.2 Create theme provider
    - Implement theme context with light/dark/auto modes
    - Detect system theme preference
    - Apply theme to all components
    - Persist theme selection in settings
    - _Requirements: 8.2_
  
  - [x] 15.3 Apply design system to components
    - Use design tokens in all component styles
    - Apply card-based layouts with rounded edges
    - Apply soft shadows to elevated elements
    - Use Inter font for UI and JetBrains Mono for dates/amounts
    - _Requirements: 8.1, 8.3, 8.4_

- [x] 16. Implement animations and interactions
  - Create reusable animation hooks
  - Implement card press scale animation (0.98, 150ms)
  - Implement swipe gesture for delete action
  - Implement custom pull-to-refresh spinner
  - Implement OCR progress bar animation
  - Implement image zoom with pinch gesture
  - Implement tag chip add animation
  - Add haptic feedback for success actions
  - _Requirements: 8.5, 8.6_

- [x] 17. Implement error handling
  - [x] 17.1 Create error classes and types
    - Define AppError class with category and recovery info
    - Define error codes for all error scenarios
    - Create user-friendly error messages
    - _Requirements: 1.5, 2.5, 3.6, 10.3_
  
  - [x] 17.2 Implement global error handling
    - Create error boundary component for React errors
    - Create global error handler for async operations
    - Implement retry logic for recoverable errors
    - Display error alerts with appropriate actions
    - _Requirements: 1.5, 2.5, 3.6_

- [x] 18. Implement performance optimizations
  - Optimize FlatList with windowSize and getItemLayout
  - Implement React.memo for receipt card components
  - Add image thumbnail caching
  - Implement search input debouncing (300ms)
  - Add database query pagination (50 receipts per page)
  - Implement lazy loading for receipt images
  - Clean up temporary files after operations
  - _Requirements: 4.1, 5.5_

- [x] 19. Implement accessibility features
  - Add accessible labels to all interactive elements
  - Ensure minimum touch target size (44x44 points)
  - Add alternative text for receipt images
  - Ensure color contrast meets WCAG AA standards
  - Test with screen readers (VoiceOver/TalkBack)
  - Support text scaling
  - Announce errors to screen readers
  - _Requirements: 8.6_

- [x] 20. Add empty states and loading indicators
  - Create empty state for HomeScreen (no receipts)
  - Add loading spinner during receipt list fetch
  - Add loading overlay during OCR processing
  - Add loading indicator during export/import
  - Create skeleton screens for data loading
  - _Requirements: 4.1, 2.3_

- [x] 21. Write integration tests for critical flows
  - Test receipt capture → OCR → save flow
  - Test receipt edit and delete operations
  - Test search and filter functionality
  - Test export and import with conflict resolution
  - Test settings persistence across app restarts
  - _Requirements: All_
