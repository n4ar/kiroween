import { storage } from '@/src/services/storage';
import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();
  const [userTheme, setUserTheme] = useState<'light' | 'dark' | 'auto' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadThemeSetting = async () => {
      try {
        const settings = await storage.getSettings();
        setUserTheme(settings.theme);
      } catch (error) {
        console.error('Error loading theme setting:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeSetting();
  }, []);

  // If still loading, return system scheme
  if (isLoading) {
    return systemColorScheme;
  }

  // If user theme is 'auto' or not set, use system scheme
  if (userTheme === 'auto' || !userTheme) {
    return systemColorScheme;
  }

  // Return user's explicit theme choice
  return userTheme;
}
