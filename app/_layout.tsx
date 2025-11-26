import { ThemeProvider as CustomThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ExpoTextExtractorEngine, ManualEngine, ocrService, RemoteAPIEngine, VLMEngine } from '@/src/services/ocr';
import { storage } from '@/src/services/storage';
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
        // Initialize storage
        await storage.initialize();

        // Register OCR engines
        ocrService.registerEngine('manual', new ManualEngine());
        ocrService.registerEngine('tesseract', new ExpoTextExtractorEngine());
        ocrService.registerEngine('remote', new RemoteAPIEngine(''));
        ocrService.registerEngine('vlm', new VLMEngine());

        // Set default engine
        const settings = await storage.getSettings();
        ocrService.setDefaultEngine(settings.ocrEngine);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
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
