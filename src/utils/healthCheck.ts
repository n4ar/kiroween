import { ocrService } from '@/src/services/ocr';
import { storage } from '@/src/services/storage';
import { SecureStorage } from '@/src/services/storage/SecureStorage';
import { OCREngineType } from '@/src/types';

export interface HealthStatus {
  healthy: boolean;
  storage: {
    initialized: boolean;
    sqliteAvailable: boolean;
  };
  ocr: {
    availableEngines: OCREngineType[];
    defaultEngine: OCREngineType;
  };
  secureStorage: {
    available: boolean;
    configured: boolean;
  };
  issues: string[];
}

/**
 * Health check utility for system diagnostics
 */
export class HealthCheck {
  /**
   * Perform a comprehensive health check
   */
  static async check(): Promise<HealthStatus> {
    const issues: string[] = [];
    
    // Check storage
    const storageInitialized = storage.isInitialized();
    const sqliteAvailable = storage.isSQLiteAvailable();

    if (!storageInitialized) {
      issues.push('Storage not initialized');
    }

    if (!sqliteAvailable) {
      issues.push('SQLite not available - receipt storage disabled');
    }

    // Check OCR engines
    const availableEngines = await ocrService.getAvailableEngines();
    const defaultEngine = ocrService.getDefaultEngine();

    if (availableEngines.length === 0) {
      issues.push('No OCR engines available');
    }

    if (!availableEngines.includes(defaultEngine)) {
      issues.push(`Default engine '${defaultEngine}' is not available`);
    }

    // Check secure storage
    const secureStorageAvailable = await SecureStorage.isAvailable();
    const secureStorageConfigured = await SecureStorage.hasAIVendorConfig();

    if (!secureStorageAvailable) {
      issues.push('Secure storage not available (web platform)');
    }

    const healthy = issues.length === 0 || 
      // Allow app to be "healthy" with minor issues
      (storageInitialized && availableEngines.length > 0);

    return {
      healthy,
      storage: {
        initialized: storageInitialized,
        sqliteAvailable,
      },
      ocr: {
        availableEngines,
        defaultEngine,
      },
      secureStorage: {
        available: secureStorageAvailable,
        configured: secureStorageConfigured,
      },
      issues,
    };
  }

  /**
   * Get a human-readable health report
   */
  static async getReport(): Promise<string> {
    const status = await this.check();
    
    let report = '=== Resight Health Check ===\n\n';
    
    report += `Overall Status: ${status.healthy ? '✅ Healthy' : '⚠️ Issues Detected'}\n\n`;
    
    report += '📦 Storage:\n';
    report += `  - Initialized: ${status.storage.initialized ? '✅' : '❌'}\n`;
    report += `  - SQLite: ${status.storage.sqliteAvailable ? '✅' : '⚠️ Unavailable'}\n\n`;
    
    report += '🔍 OCR:\n';
    report += `  - Default Engine: ${status.ocr.defaultEngine}\n`;
    report += `  - Available Engines: ${status.ocr.availableEngines.join(', ') || 'None'}\n\n`;
    
    report += '🔐 Secure Storage:\n';
    report += `  - Available: ${status.secureStorage.available ? '✅' : '⚠️ No'}\n`;
    report += `  - AI Vendor Configured: ${status.secureStorage.configured ? '✅' : '❌'}\n\n`;
    
    if (status.issues.length > 0) {
      report += '⚠️ Issues:\n';
      status.issues.forEach(issue => {
        report += `  - ${issue}\n`;
      });
    }
    
    return report;
  }

  /**
   * Log health status to console
   */
  static async logStatus(): Promise<void> {
    const report = await this.getReport();
    console.log(report);
  }
}
