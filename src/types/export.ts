/**
 * Import result structure
 */
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Import strategy for conflict resolution
 */
export type ImportStrategy = 'merge' | 'replace' | 'skip';

/**
 * Export/Import service interface
 */
export interface IExportService {
  exportData(): Promise<string>; // Returns ZIP file URI
  importData(zipUri: string, strategy: ImportStrategy): Promise<ImportResult>;
}
