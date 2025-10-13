/**
 * React Hook for Payment API Operations
 * 
 * This hook provides a clean interface for components to interact with
 * the payment service layer. It handles loading states, error handling,
 * and provides a consistent API regardless of whether using mock or real data.
 */

import { useState, useCallback } from 'react';
import { PaymentsMockAPI } from '../services/paymentsMockService';
import { PaymentQueueItem, PaymentHistoryItem } from '../../../mocks/paymentsMockData';

interface UsePaymentsAPIReturn {
  // Loading states
  isLoading: boolean;
  isScheduling: boolean;
  isRetrying: boolean;
  
  // Error states
  error: string | null;
  
  // Data operations
  fetchPayoutQueue: () => Promise<PaymentQueueItem[]>;
  fetchRequiresAttention: () => Promise<PaymentQueueItem[]>;
  fetchPaymentHistory: (filters?: any) => Promise<PaymentHistoryItem[]>;
  schedulePayout: (data: any) => Promise<{ batchId: string; scheduledCount: number } | null>;
  retryFailedPayouts: (payoutIds: string[]) => Promise<number>;
  
  // Utility functions
  clearError: () => void;
}

export const usePaymentsAPI = (): UsePaymentsAPIReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchPayoutQueue = useCallback(async (): Promise<PaymentQueueItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await PaymentsMockAPI.payoutQueue.getPayoutQueue();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payout queue';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRequiresAttention = useCallback(async (): Promise<PaymentQueueItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await PaymentsMockAPI.payoutQueue.getRequiresAttentionQueue();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attention queue';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPaymentHistory = useCallback(async (filters?: {
    status?: 'all' | 'paid' | 'scheduled' | 'ready';
    achMethod?: 'all' | 'ach' | 'manual';
    limit?: number;
    offset?: number;
  }): Promise<PaymentHistoryItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await PaymentsMockAPI.paymentHistory.getPaymentHistory(filters);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment history';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const schedulePayout = useCallback(async (payoutData: {
    selectedItems: PaymentQueueItem[];
    achEnabled: boolean;
    batchNote?: string;
  }): Promise<{ batchId: string; scheduledCount: number } | null> => {
    setIsScheduling(true);
    setError(null);
    
    try {
      const response = await PaymentsMockAPI.payouts.schedulePayout(payoutData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule payout';
      setError(errorMessage);
      return null;
    } finally {
      setIsScheduling(false);
    }
  }, []);

  const retryFailedPayouts = useCallback(async (payoutIds: string[]): Promise<number> => {
    setIsRetrying(true);
    setError(null);
    
    try {
      const response = await PaymentsMockAPI.payouts.retryFailedPayouts(payoutIds);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data?.retriedCount || 0;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry payouts';
      setError(errorMessage);
      return 0;
    } finally {
      setIsRetrying(false);
    }
  }, []);

  return {
    // Loading states
    isLoading,
    isScheduling,
    isRetrying,
    
    // Error state
    error,
    
    // Data operations
    fetchPayoutQueue,
    fetchRequiresAttention,
    fetchPaymentHistory,
    schedulePayout,
    retryFailedPayouts,
    
    // Utility
    clearError
  };
};

// Export individual hooks for specific use cases
export const usePayoutQueue = () => {
  const api = usePaymentsAPI();
  return {
    fetchPayoutQueue: api.fetchPayoutQueue,
    isLoading: api.isLoading,
    error: api.error,
    clearError: api.clearError
  };
};

export const usePaymentHistory = () => {
  const api = usePaymentsAPI();
  return {
    fetchPaymentHistory: api.fetchPaymentHistory,
    isLoading: api.isLoading,
    error: api.error,
    clearError: api.clearError
  };
};

export const usePayoutScheduling = () => {
  const api = usePaymentsAPI();
  return {
    schedulePayout: api.schedulePayout,
    retryFailedPayouts: api.retryFailedPayouts,
    isScheduling: api.isScheduling,
    isRetrying: api.isRetrying,
    error: api.error,
    clearError: api.clearError
  };
};
