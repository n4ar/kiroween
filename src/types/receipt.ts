/**
 * Core receipt data model
 */
export interface Receipt {
  id: string;
  storeName: string;
  date: Date;
  totalAmount: number; // In cents
  tags: string[];
  notes?: string;
  ocrText: string;
  imageUri: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OCR result structure
 */
export interface OCRResult {
  storeName: string;
  date: Date | null;
  totalAmount: number | null; // In cents
  lineItems: LineItem[];
  rawText: string;
  confidence: number; // 0-1
}

/**
 * Line item from receipt
 */
export interface LineItem {
  description: string;
  amount: number; // In cents
}

/**
 * Application settings
 */
export interface AppSettings {
  ocrEngine: 'vlm' | 'tesseract' | 'remote' | 'manual';
  autoCrop: boolean;
  tesseractLanguage: string;
  remoteApiEndpoint?: string;
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Search criteria for filtering receipts
 */
export interface SearchCriteria {
  query?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number; // In cents
  maxAmount?: number; // In cents
}
