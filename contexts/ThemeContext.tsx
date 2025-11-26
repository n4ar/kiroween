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
      const maxRetries = 20; // 2 seconds max wait
      
      while (retries < maxRetries) {
        try {
          const settings = await storage.getSettings();
          updateTheme(settings.theme);
          setIsReady(true);
          return;
        } catch (error) {
          // Storage not ready yet, wait and retry
          retries++;
          if (retries >= maxRetries) {
            console.error('Error loading theme after retries:', error);
            // Use default theme
            setIsReady(true);
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
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
