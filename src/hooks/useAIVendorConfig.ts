import { SecureStorage } from '@/src/services/storage/SecureStorage';
import { AIVendorConfig } from '@/src/types';
import { useEffect, useRef, useState } from 'react';

/**
 * Hook to manage AI vendor configuration
 */
export function useAIVendorConfig() {
  const [config, setConfig] = useState<AIVendorConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const savedConfig = await SecureStorage.getAIVendorConfig();
      setConfig(savedConfig);
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('[useAIVendorConfig] Failed to load config:', error);
      
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`[useAIVendorConfig] Retrying... (${retryCountRef.current}/${maxRetries})`);
        setTimeout(() => loadConfig(), 1000 * retryCountRef.current); // Exponential backoff
      } else {
        setError('Failed to load configuration. Please try again.');
      }
    } finally {
      // Only set loading to false if we're not retrying
      if (retryCountRef.current === 0 || retryCountRef.current >= maxRetries) {
        setLoading(false);
      }
    }
  };

  const saveConfig = async (newConfig: AIVendorConfig) => {
    try {
      setError(null);
      await SecureStorage.saveAIVendorConfig(newConfig);
      setConfig(newConfig);
    } catch (error) {
      console.error('[useAIVendorConfig] Failed to save config:', error);
      setError('Failed to save configuration');
      throw error;
    }
  };

  const deleteConfig = async () => {
    try {
      setError(null);
      await SecureStorage.deleteAIVendorConfig();
      setConfig(null);
    } catch (error) {
      console.error('[useAIVendorConfig] Failed to delete config:', error);
      setError('Failed to delete configuration');
      throw error;
    }
  };

  const isConfigured = config !== null && !!config.apiKey;

  return {
    config,
    loading,
    error,
    isConfigured,
    saveConfig,
    deleteConfig,
    reload: loadConfig,
  };
}
