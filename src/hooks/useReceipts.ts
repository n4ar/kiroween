import { storage } from '@/src/services/storage';
import { Receipt, SearchCriteria } from '@/src/types';
import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for managing receipts
 */
export function useReceipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all receipts
   */
  const loadReceipts = useCallback(async () => {
    try {
      setError(null);
      // Ensure storage is initialized before loading
      await storage.initialize();
      const allReceipts = await storage.getAllReceipts();
      setReceipts(allReceipts);
    } catch (err) {
      console.error('Error loading receipts:', err);
      setError('Failed to load receipts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh receipts
   */
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadReceipts();
    setIsRefreshing(false);
  }, [loadReceipts]);

  /**
   * Delete a receipt
   */
  const deleteReceipt = useCallback(async (id: string) => {
    try {
      await storage.deleteReceipt(id);
      setReceipts((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Error deleting receipt:', err);
      throw err;
    }
  }, []);

  /**
   * Search receipts
   */
  const searchReceipts = useCallback(
    (criteria: SearchCriteria): Receipt[] => {
      return receipts.filter((receipt) => {
        // Text search
        if (criteria.query) {
          const searchText = `${receipt.storeName} ${receipt.notes || ''}`.toLowerCase();
          if (!searchText.includes(criteria.query.toLowerCase())) {
            return false;
          }
        }

        // Tag filter (AND logic)
        if (criteria.tags && criteria.tags.length > 0) {
          if (!criteria.tags.every((tag) => receipt.tags.includes(tag))) {
            return false;
          }
        }

        // Date range
        if (criteria.dateFrom && receipt.date < criteria.dateFrom) {
          return false;
        }
        if (criteria.dateTo && receipt.date > criteria.dateTo) {
          return false;
        }

        // Amount range
        if (
          criteria.minAmount &&
          receipt.totalAmount < criteria.minAmount
        ) {
          return false;
        }
        if (
          criteria.maxAmount &&
          receipt.totalAmount > criteria.maxAmount
        ) {
          return false;
        }

        return true;
      });
    },
    [receipts]
  );

  /**
   * Get all unique tags
   */
  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>();
    receipts.forEach((receipt) => {
      receipt.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [receipts]);

  // Load receipts on mount
  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  return {
    receipts,
    isLoading,
    isRefreshing,
    error,
    refresh,
    deleteReceipt,
    searchReceipts,
    getAllTags,
  };
}
