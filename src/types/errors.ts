/**
 * Error categories
 */
export type ErrorCategory = 'storage' | 'ocr' | 'camera' | 'import' | 'network';

/**
 * Error codes
 */
export enum ErrorCode {
  // Storage errors
  STORAGE_INSUFFICIENT_SPACE = 'STORAGE_INSUFFICIENT_SPACE',
  STORAGE_PERMISSION_DENIED = 'STORAGE_PERMISSION_DENIED',
  STORAGE_DATABASE_CORRUPTION = 'STORAGE_DATABASE_CORRUPTION',
  STORAGE_FILE_SYSTEM_ERROR = 'STORAGE_FILE_SYSTEM_ERROR',

  // OCR errors
  OCR_MODEL_LOADING_FAILED = 'OCR_MODEL_LOADING_FAILED',
  OCR_PROCESSING_TIMEOUT = 'OCR_PROCESSING_TIMEOUT',
  OCR_NETWORK_ERROR = 'OCR_NETWORK_ERROR',
  OCR_INVALID_IMAGE_FORMAT = 'OCR_INVALID_IMAGE_FORMAT',

  // Camera/Image errors
  CAMERA_PERMISSION_DENIED = 'CAMERA_PERMISSION_DENIED',
  CAMERA_UNAVAILABLE = 'CAMERA_UNAVAILABLE',
  IMAGE_INVALID_FILE = 'IMAGE_INVALID_FILE',
  IMAGE_PROCESSING_FAILED = 'IMAGE_PROCESSING_FAILED',

  // Import/Export errors
  EXPORT_INVALID_ZIP_STRUCTURE = 'EXPORT_INVALID_ZIP_STRUCTURE',
  EXPORT_CORRUPTED_DATA = 'EXPORT_CORRUPTED_DATA',
  EXPORT_INSUFFICIENT_STORAGE = 'EXPORT_INSUFFICIENT_STORAGE',
  EXPORT_PERMISSION_ERROR = 'EXPORT_PERMISSION_ERROR',

  // Network errors
  NETWORK_UNAVAILABLE = 'NETWORK_UNAVAILABLE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  STORAGE_ERROR = "STORAGE_ERROR",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  FEATURE_NOT_AVAILABLE = "FEATURE_NOT_AVAILABLE",
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public category: ErrorCategory,
    public recoverable: boolean,
    public userMessage: string
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
