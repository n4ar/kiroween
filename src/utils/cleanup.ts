import * as FileSystem from 'expo-file-system';

/**
 * Cleanup utility for managing temporary files and memory
 */
export class CleanupUtil {
  private static readonly TEMP_PREFIXES = ['ImagePicker_', 'Camera_', 'DocumentScanner_'];
  private static readonly MAX_TEMP_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Clean up old temporary files
   */
  static async cleanupTempFiles(): Promise<{ cleaned: number; errors: number }> {
    let cleaned = 0;
    let errors = 0;

    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        console.warn('[CleanupUtil] Cache directory not available');
        return { cleaned, errors };
      }

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      const now = Date.now();

      for (const file of files) {
        try {
          // Check if it's a temp file we created
          const isTemp = this.TEMP_PREFIXES.some(prefix => file.startsWith(prefix));
          if (!isTemp) continue;

          const filePath = `${cacheDir}${file}`;
          const info = await FileSystem.getInfoAsync(filePath);

          if (info.exists && info.modificationTime) {
            const age = now - info.modificationTime * 1000;
            
            if (age > this.MAX_TEMP_AGE_MS) {
              await FileSystem.deleteAsync(filePath, { idempotent: true });
              cleaned++;
              console.log(`[CleanupUtil] Deleted old temp file: ${file}`);
            }
          }
        } catch (error) {
          console.error(`[CleanupUtil] Error cleaning file ${file}:`, error);
          errors++;
        }
      }

      console.log(`[CleanupUtil] Cleanup complete: ${cleaned} files cleaned, ${errors} errors`);
    } catch (error) {
      console.error('[CleanupUtil] Cleanup failed:', error);
      errors++;
    }

    return { cleaned, errors };
  }

  /**
   * Get cache directory size
   */
  static async getCacheSize(): Promise<number> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) return 0;

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      let totalSize = 0;

      for (const file of files) {
        try {
          const filePath = `${cacheDir}${file}`;
          const info = await FileSystem.getInfoAsync(filePath);
          if (info.exists && info.size) {
            totalSize += info.size;
          }
        } catch (error) {
          console.error(`[CleanupUtil] Error getting size for ${file}:`, error);
        }
      }

      return totalSize;
    } catch (error) {
      console.error('[CleanupUtil] Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  static async clearAllCache(): Promise<void> {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      if (!cacheDir) {
        console.warn('[CleanupUtil] Cache directory not available');
        return;
      }

      const files = await FileSystem.readDirectoryAsync(cacheDir);

      for (const file of files) {
        try {
          const filePath = `${cacheDir}${file}`;
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        } catch (error) {
          console.error(`[CleanupUtil] Error deleting ${file}:`, error);
        }
      }

      console.log('[CleanupUtil] All cache cleared');
    } catch (error) {
      console.error('[CleanupUtil] Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Delete a specific file safely
   */
  static async deleteFile(uri: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        console.log(`[CleanupUtil] Deleted file: ${uri}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[CleanupUtil] Failed to delete file ${uri}:`, error);
      return false;
    }
  }
}
