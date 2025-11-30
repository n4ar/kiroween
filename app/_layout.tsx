import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ocrService } from '@/src/services/ocr';
import { initializeOCREngines } from '@/src/services/ocr/initializeEngines';
import { storage } from '@/src/services/storage';
import { CleanupUtil } from '@/src/utils/cleanup';
import { HealthCheck } from '@/src/utils/healthCheck';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const { colorScheme } = useTheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="ocr-process" options={{ headerShown: false }} />
        <Stack.Screen name="ocr-review" options={{ title: 'Review Receipt' }} />
        <Stack.Screen name="receipt-save" options={{ headerShown: false }} />
        <Stack.Screen name="receipt-detail" options={{ title: 'Receipt Details' }} />
        <Stack.Screen name="gallery-picker" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
        <Stack.Screen name="export-import" options={{ title: 'Export & Import' }} />
        <Stack.Screen name="ai-vendor-settings" options={{ title: 'AI Vendor Settings' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize storage and OCR services
    const initializeApp = async () => {
      try {
        console.log('[App] Starting initialization...');

        // Initialize storage (will use AsyncStorage fallback if SQLite fails)
        await storage.initialize();

        // Show warning if SQLite is not available
        if (!storage.isSQLiteAvailable()) {
          console.warn('⚠️ SQLite is not available. Receipt storage will not work. Please rebuild the app with: bun run android');
        }

        // Initialize OCR engines
        initializeOCREngines();

        // Set default engine from settings
        const settings = await storage.getSettings();
        ocrService.setDefaultEngine(settings.ocrEngine);

        // Clean up old temporary files in background
        CleanupUtil.cleanupTempFiles()
          .then((result: { cleaned: number; errors: number }) => {
            console.log(`[App] Cleanup: ${result.cleaned} files removed, ${result.errors} errors`);
          })
          .catch((error: unknown) => {
            console.warn('[App] Cleanup failed:', error);
          });

        // Run health check in background
        HealthCheck.logStatus().catch((error: unknown) => {
          console.warn('[App] Health check failed:', error);
        });
        
        console.log('[App] Initialization complete');
        setIsInitialized(true);
      } catch (error) {
        console.error('[App] Failed to initialize app:', error);
        // Still mark as initialized to allow app to start
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEFCF8' }}>
        <ActivityIndicator size="large" color="#6B7F5A" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
        <RootLayoutContent />
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}
