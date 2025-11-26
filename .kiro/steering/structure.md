# Project Structure

## Directory Organization

### `/app`
File-based routing directory using Expo Router. All screens and layouts go here.
- `/app/(tabs)/` - Tab-based navigation screens
- `/app/_layout.tsx` - Root layout with theme provider and navigation setup
- `/app/modal.tsx` - Modal screens

### `/components`
Reusable React components organized by functionality.
- `/components/ui/` - UI primitives and base components
- Themed components use `themed-` prefix (e.g., `themed-text.tsx`, `themed-view.tsx`)

### `/hooks`
Custom React hooks for shared logic.
- Platform-specific hooks use `.web.ts` extension for web overrides
- Example: `use-color-scheme.ts` and `use-color-scheme.web.ts`

### `/constants`
Application-wide constants and configuration.
- `theme.ts` - Theme colors and styling constants

### `/assets`
Static assets like images, fonts, and icons.
- `/assets/images/` - Image assets with platform-specific variants

### `/scripts`
Build and utility scripts.

## Naming Conventions

### Files
- Component files: `kebab-case.tsx` (e.g., `hello-wave.tsx`)
- Hook files: `use-kebab-case.ts` (e.g., `use-color-scheme.ts`)
- Platform-specific: `filename.platform.tsx` (e.g., `icon-symbol.ios.tsx`)

### Components
- PascalCase for component names
- Themed components: `Themed` prefix (e.g., `ThemedText`, `ThemedView`)

### Imports
- Use `@/` path alias for absolute imports from project root
- Example: `import { ThemedText } from '@/components/themed-text'`

## Architecture Patterns

### Theming
- All components support light/dark mode via `useThemeColor` hook
- Theme colors defined in `/constants/theme.ts`
- Components accept `lightColor` and `darkColor` props

### Styling
- Use `StyleSheet.create()` for component styles
- Inline styles for dynamic values only
- Style objects defined at bottom of component files

### Navigation
- File-based routing via Expo Router
- Grouped routes use `(groupName)` folder syntax
- Layout files: `_layout.tsx`
- Index routes: `index.tsx`
