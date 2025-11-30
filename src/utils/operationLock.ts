/**
 * Operation lock utility to prevent concurrent operations
 */
export class OperationLock {
  private locks: Map<string, boolean> = new Map();

  /**
   * Acquire a lock for an operation
   * @param key - Unique key for the operation
   * @returns true if lock acquired, false if already locked
   */
  acquire(key: string): boolean {
    if (this.locks.get(key)) {
      return false;
    }
    this.locks.set(key, true);
    return true;
  }

  /**
   * Release a lock
   * @param key - Unique key for the operation
   */
  release(key: string): void {
    this.locks.delete(key);
  }

  /**
   * Check if an operation is locked
   * @param key - Unique key for the operation
   */
  isLocked(key: string): boolean {
    return this.locks.get(key) === true;
  }

  /**
   * Execute an operation with automatic lock management
   * @param key - Unique key for the operation
   * @param operation - Async operation to execute
   * @returns Result of the operation or null if locked
   */
  async withLock<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T | null> {
    if (!this.acquire(key)) {
      console.warn(`[OperationLock] Operation '${key}' is already in progress`);
      return null;
    }

    try {
      const result = await operation();
      return result;
    } finally {
      this.release(key);
    }
  }

  /**
   * Clear all locks (use with caution)
   */
  clearAll(): void {
    this.locks.clear();
  }
}

// Export singleton instance
export const operationLock = new OperationLock();
