import { storage } from '@/src/services/storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeContextType = {
  colorScheme: 'light' | 'dark';
  themeSetting: 'light' | 'dark' | 'auto';
  setThemeSetting: (theme: 'light' | 'dark' | 'auto') => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeSetting, setThemeSettingState] = useState<'light' | 'dark' | 'auto'>('auto');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load theme setting from storage with retry logic
    const loadTheme = async () => {
      let retries = 0;
      const maxRetries = 30; // 3 seconds max wait
      
      while (retries < maxRetries) {
        try {
          // Check if storage is initialized before trying to use it
          if (storage.isInitialized()) {
            const settings = await storage.getSettings();
            updateTheme(settings.theme);
            setIsReady(true);
            return;
          }
          // Storage not initialized yet, wait and retry
          retries++;
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          // Error getting settings, wait and retry
          retries++;
          if (retries >= maxRetries) {
            // Use default theme after max retries
            console.warn('Could not load theme settings, using default theme');
            updateTheme('auto');
            setIsReady(true);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Max retries reached without initialization
      console.warn('Storage not ready after retries, using default theme');
      updateTheme('auto');
      setIsReady(true);
    };

    loadTheme();
  }, []);

  useEffect(() => {
    // Update color scheme when system theme or theme setting changes
    updateTheme(themeSetting);
  }, [systemColorScheme, themeSetting]);

  const updateTheme = (theme: 'light' | 'dark' | 'auto') => {
    setThemeSettingState(theme);
    if (theme === 'auto') {
      setColorScheme(systemColorScheme ?? 'light');
    } else {
      setColorScheme(theme);
    }
  };

  const setThemeSetting = async (theme: 'light' | 'dark' | 'auto') => {
    updateTheme(theme);
    // Note: Actual saving to storage is handled by the settings screen
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, themeSetting, setThemeSetting }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
