# Requirements Document

## Introduction

Paperkeep is an offline-first, privacy-focused receipt management application for mobile devices built with React Native and Expo. The system enables users to capture, process, store, organize, and manage receipt data entirely on their local device without requiring any backend or cloud services. The application prioritizes user privacy by keeping all data local while providing comprehensive receipt management capabilities including OCR processing, tagging, search, and data export/import functionality.

## Glossary

- **Paperkeep System**: The complete mobile application including all modules for receipt capture, processing, storage, and management
- **Receipt Capture Module**: The component responsible for camera integration, image capture, and file upload
- **OCR Engine**: Optical Character Recognition system that extracts text and structured data from receipt images
- **Receipt Storage**: Local data persistence layer using AsyncStorage/SQLite for metadata and FileSystem for images
- **Receipt Card**: Visual representation of a receipt in the browsing interface
- **Tag**: User-defined label for categorizing receipts
- **Export Package**: ZIP file containing receipt metadata (JSON) and associated images
- **Auto-Crop**: Automated edge detection and image cropping functionality
- **VLM**: Vision Language Model (Donut) for document understanding
- **Receipt Metadata**: Structured data including store name, date, total amount, tags, notes, and timestamps

## Requirements

### Requirement 1: Receipt Image Capture

**User Story:** As a user, I want to capture receipt photos using my device camera or upload existing images, so that I can digitize my paper receipts.

#### Acceptance Criteria

1. WHEN the user selects the camera capture option, THE Receipt Capture Module SHALL activate the device camera with appropriate permissions
2. WHEN the user selects the file upload option, THE Receipt Capture Module SHALL open the device file picker allowing image selection from the gallery
3. WHERE auto-crop is enabled, THE Receipt Capture Module SHALL detect receipt edges and crop the image to receipt boundaries within 2 seconds
4. THE Receipt Capture Module SHALL compress captured or uploaded images to reduce file size while maintaining readability
5. WHEN an image capture or upload fails, THE Receipt Capture Module SHALL display an error message indicating the specific failure reason

### Requirement 2: OCR Processing

**User Story:** As a user, I want the app to automatically extract receipt information from images using multiple OCR options, so that I don't have to manually type all the details.

#### Acceptance Criteria

1. THE Paperkeep System SHALL provide four OCR engine options: VLM (Donut model), Tesseract.js, Remote API, and Manual Entry
2. WHEN the user initiates OCR processing, THE OCR Engine SHALL extract store name, date, total amount, and line items from the receipt image
3. WHILE OCR processing is active, THE OCR Engine SHALL display progress indicators showing processing status
4. THE OCR Engine SHALL complete processing within 10 seconds for VLM and Tesseract engines
5. WHEN OCR extraction completes, THE Paperkeep System SHALL present extracted data to the user for review and correction before saving
6. WHERE the user selects Manual Entry, THE Paperkeep System SHALL skip OCR processing and present empty fields for manual data input

### Requirement 3: Local Data Storage

**User Story:** As a user, I want all my receipt data stored locally on my device, so that my financial information remains private and accessible offline.

#### Acceptance Criteria

1. THE Receipt Storage SHALL persist receipt metadata using AsyncStorage or SQLite on the device
2. THE Receipt Storage SHALL store receipt images using the Expo FileSystem API in a dedicated directory
3. THE Receipt Storage SHALL store monetary amounts as integers representing cents to prevent floating-point precision errors
4. WHEN a receipt is saved, THE Receipt Storage SHALL include store name, date, total amount in cents, tags array, optional notes, original OCR text, image reference, and creation timestamp
5. THE Receipt Storage SHALL maintain data integrity by validating all required fields before persisting
6. WHEN storage operations fail, THE Receipt Storage SHALL provide error messages indicating storage capacity or permission issues

### Requirement 4: Receipt Browsing and Management

**User Story:** As a user, I want to browse all my receipts in a visual grid and view detailed information, so that I can easily find and review past purchases.

#### Acceptance Criteria

1. THE Paperkeep System SHALL display receipts in reverse chronological order with the most recent receipt first
2. THE Paperkeep System SHALL render receipts in a card-based masonry grid layout with 2 columns
3. WHEN the user taps a Receipt Card, THE Paperkeep System SHALL expand a detail panel showing complete receipt information and the original image
4. THE Paperkeep System SHALL allow users to edit receipt details including store name, date, amount, tags, and notes after saving
5. WHEN the user initiates receipt deletion, THE Paperkeep System SHALL remove both metadata and associated image from local storage
6. THE Paperkeep System SHALL implement pull-to-refresh functionality to reload the receipt list

### Requirement 5: Receipt Organization

**User Story:** As a user, I want to organize receipts with tags and search through them, so that I can quickly find specific receipts when needed.

#### Acceptance Criteria

1. THE Paperkeep System SHALL allow users to assign multiple tags to each receipt
2. WHEN the user begins typing a tag, THE Paperkeep System SHALL suggest existing tags from previously tagged receipts
3. THE Paperkeep System SHALL provide search functionality filtering by store name, date range, and tags
4. THE Paperkeep System SHALL support filtering receipts by multiple tags simultaneously using AND logic
5. WHEN search or filter criteria are applied, THE Paperkeep System SHALL update the receipt list within 1 second to show only matching receipts

### Requirement 6: Data Export and Import

**User Story:** As a user, I want to export all my receipt data and import it on another device, so that I can backup my data and transfer it between devices.

#### Acceptance Criteria

1. WHEN the user initiates export, THE Paperkeep System SHALL create a ZIP file containing receipt metadata as JSON and all associated images
2. THE Paperkeep System SHALL use Expo FileSystem and Expo Sharing APIs to save and share the export package
3. WHEN the user initiates import, THE Paperkeep System SHALL open a document picker allowing ZIP file selection
4. WHEN importing a ZIP file, THE Paperkeep System SHALL extract and restore all receipt metadata and images to local storage
5. IF imported data conflicts with existing receipts, THEN THE Paperkeep System SHALL prompt the user to choose between merge, replace, or skip options
6. THE Paperkeep System SHALL validate the structure of imported data before applying changes to prevent data corruption

### Requirement 7: Application Settings

**User Story:** As a user, I want to configure OCR engine preferences and other app settings, so that I can customize the app behavior to my needs.

#### Acceptance Criteria

1. THE Paperkeep System SHALL provide a settings interface for selecting the default OCR engine
2. THE Paperkeep System SHALL allow users to toggle auto-crop functionality on or off
3. WHERE Tesseract OCR is selected, THE Paperkeep System SHALL provide language selection options
4. WHERE Remote API OCR is selected, THE Paperkeep System SHALL allow users to configure API endpoint URLs
5. THE Paperkeep System SHALL provide a reset option that restores all settings to default values
6. WHEN settings are modified, THE Paperkeep System SHALL persist changes immediately to local storage

### Requirement 8: User Interface and Design

**User Story:** As a user, I want a visually appealing and intuitive interface with consistent design, so that the app is pleasant and easy to use.

#### Acceptance Criteria

1. THE Paperkeep System SHALL use the color scheme: background #FEFCF8, primary #6B7F5A, accent #D4A574
2. THE Paperkeep System SHALL support both light and dark mode based on device settings
3. THE Paperkeep System SHALL use Inter font for UI elements and JetBrains Mono for dates and prices
4. THE Paperkeep System SHALL apply card-based layouts with soft shadows and rounded edges throughout the interface
5. THE Paperkeep System SHALL implement swipe gestures for delete and edit actions on receipt cards
6. THE Paperkeep System SHALL provide responsive layouts that adapt to different screen sizes and orientations

### Requirement 9: Navigation

**User Story:** As a user, I want intuitive navigation between different sections of the app, so that I can easily access all features.

#### Acceptance Criteria

1. THE Paperkeep System SHALL implement React Navigation with stack and bottom tab navigators
2. THE Paperkeep System SHALL provide navigation routes for: Home (receipt list), Capture, Receipt Detail, Settings, and Export
3. WHEN the user navigates between screens, THE Paperkeep System SHALL maintain navigation state and allow back navigation
4. THE Paperkeep System SHALL display the current screen title in the navigation header
5. THE Paperkeep System SHALL provide visual indicators for the active tab in bottom navigation

### Requirement 10: Offline-First Architecture

**User Story:** As a user, I want the app to work completely offline without internet connectivity, so that I can manage receipts anywhere without depending on network availability.

#### Acceptance Criteria

1. THE Paperkeep System SHALL function fully without requiring internet connectivity for core features
2. THE Paperkeep System SHALL process receipts using on-device OCR engines (VLM or Tesseract) without network requests
3. WHERE Remote API OCR is selected and network is unavailable, THEN THE Paperkeep System SHALL display an error message and offer alternative OCR options
4. THE Paperkeep System SHALL store and retrieve all data from local device storage without cloud synchronization
5. THE Paperkeep System SHALL maintain data consistency and integrity during offline operation
