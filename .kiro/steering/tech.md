# Technology Stack

## Package Manager
**Always use Bun** for all package management and script execution commands.

## Core Technologies
- **React Native**: 0.81.5
- **React**: 19.1.0
- **Expo**: ~54.0.25
- **TypeScript**: ~5.9.2
- **Expo Router**: ~6.0.15 (file-based routing)

## Key Libraries
- `@react-navigation/native` - Navigation framework
- `expo-image` - Optimized image component
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Gesture handling
- `expo-haptics` - Haptic feedback
- `expo-symbols` - SF Symbols support

## Development Tools
- ESLint with `eslint-config-expo`
- TypeScript with strict mode enabled
- Expo development tools

## Common Commands

### Development
```bash
bun start              # Start Expo development server
bun run android        # Run on Android emulator
bun run ios            # Run on iOS simulator
bun run web            # Run in web browser
```

### Package Management
```bash
bun install            # Install dependencies
bun add <package>      # Add a package
bun remove <package>   # Remove a package
```

### Code Quality
```bash
bun run lint           # Run ESLint
```

### Project Management
```bash
bun run reset-project  # Reset to blank project structure
```

## Build Configuration
- **New Architecture**: Enabled
- **Typed Routes**: Enabled (experimental)
- **React Compiler**: Enabled (experimental)
- **Edge-to-Edge**: Enabled on Android
