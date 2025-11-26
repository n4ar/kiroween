import { storage } from '@/src/services/storage';
import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [userTheme, setUserTheme] = useState<'light' | 'dark' | 'auto' | null>(null);
  const systemColorScheme = useRNColorScheme();

  useEffect(() => {
    const loadThemeSetting = async () => {
      try {
        const settings = await storage.getSettings();
        setUserTheme(settings.theme);
      } catch (error) {
        console.error('Error loading theme setting:', error);
      } finally {
        setHasHydrated(true);
      }
    };

    loadThemeSetting();
  }, []);

  if (!hasHydrated) {
    return 'light';
  }

  // If user theme is 'auto' or not set, use system scheme
  if (userTheme === 'auto' || !userTheme) {
    return systemColorScheme ?? 'light';
  }

  // Return user's explicit theme choice
  return userTheme;
}
