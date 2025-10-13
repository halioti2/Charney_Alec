import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  usePaymentsAPI, 
  usePayoutQueue, 
  usePaymentHistory, 
  usePayoutScheduling 
} from '../hooks/usePaymentsAPI';

// Mock the service layer
const mockPaymentsMockAPI = {
  payoutQueue: {
    getPayoutQueue: vi.fn(),
    getRequiresAttentionQueue: vi.fn()
  },
  paymentHistory: {
    getPaymentHistory: vi.fn()
  },
  payouts: {
    schedulePayout: vi.fn(),
    retryFailedPayouts: vi.fn()
  }
};

vi.mock('../services/paymentsMockService', () => ({
  PaymentsMockAPI: mockPaymentsMockAPI
}));

describe('usePaymentsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePaymentsAPI Hook', () => {
    it('initializes with correct default state', () => {
      const { result } = renderHook(() => usePaymentsAPI());
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isScheduling).toBe(false);
      expect(result.current.isRetrying).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.fetchPayoutQueue).toBe('function');
      expect(typeof result.current.fetchRequiresAttention).toBe('function');
      expect(typeof result.current.fetchPaymentHistory).toBe('function');
      expect(typeof result.current.schedulePayout).toBe('function');
      expect(typeof result.current.retryFailedPayouts).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('handles successful fetchPayoutQueue', async () => {
      const mockData = [{ id: 'payout-001', amount: 1000 }];
      mockPaymentsMockAPI.payoutQueue.getPayoutQueue.mockResolvedValue({
        data: mockData,
        error: null,
        status: 200
      });

      const { result } = renderHook(() => usePaymentsAPI());
      
      let returnedData;
      await act(async () => {
        returnedData = await result.current.fetchPayoutQueue();
      });

      expect(mockPaymentsMockAPI.payoutQueue.getPayoutQueue).toHaveBeenCalled();
      expect(returnedData).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('handles API errors in fetchPayoutQueue', async () => {
      mockPaymentsMockAPI.payoutQueue.getPayoutQueue.mockResolvedValue({
        data: null,
        error: 'Service unavailable',
        status: 500
      });

      const { result } = renderHook(() => usePaymentsAPI());
      
      let returnedData;
      await act(async () => {
        returnedData = await result.current.fetchPayoutQueue();
      });

      expect(returnedData).toEqual([]);
      expect(result.current.error).toBe('Service unavailable');
    });

    it('handles network errors in fetchPayoutQueue', async () => {
      mockPaymentsMockAPI.payoutQueue.getPayoutQueue.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => usePaymentsAPI());
      
      let returnedData;
      await act(async () => {
        returnedData = await result.current.fetchPayoutQueue();
      });

      expect(returnedData).toEqual([]);
      expect(result.current.error).toBe('Network error');
    });

    it('manages loading state correctly', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockPaymentsMockAPI.payoutQueue.getPayoutQueue.mockReturnValue(promise);

      const { result } = renderHook(() => usePaymentsAPI());
      
      // Start the async operation
      act(() => {
        result.current.fetchPayoutQueue();
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise({ data: [], error: null, status: 200 });
        await promise;
      });

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false);
    });

    it('clears error correctly', async () => {
      mockPaymentsMockAPI.payoutQueue.getPayoutQueue.mockResolvedValue({
        data: null,
        error: 'Test error',
        status: 500
      });

      const { result } = renderHook(() => usePaymentsAPI());
      
      // Generate an error
      await act(async () => {
        await result.current.fetchPayoutQueue();
      });

      expect(result.current.error).toBe('Test error');

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('usePayoutQueue Hook', () => {
    it('provides correct interface', () => {
      const { result } = renderHook(() => usePayoutQueue());
      
      expect(result.current).toHaveProperty('fetchPayoutQueue');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('clearError');
      
      expect(typeof result.current.fetchPayoutQueue).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });
  });

  describe('usePaymentHistory Hook', () => {
    it('provides correct interface', () => {
      const { result } = renderHook(() => usePaymentHistory());
      
      expect(result.current).toHaveProperty('fetchPaymentHistory');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('clearError');
      
      expect(typeof result.current.fetchPaymentHistory).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('handles fetchPaymentHistory with filters', async () => {
      const mockData = [{ id: 'payout-001', status: 'paid' }];
      mockPaymentsMockAPI.paymentHistory.getPaymentHistory.mockResolvedValue({
        data: mockData,
        error: null,
        status: 200
      });

      const { result } = renderHook(() => usePaymentHistory());
      
      const filters = { status: 'paid', achMethod: 'ach' };
      let returnedData;
      
      await act(async () => {
        returnedData = await result.current.fetchPaymentHistory(filters);
      });

      expect(mockPaymentsMockAPI.paymentHistory.getPaymentHistory).toHaveBeenCalledWith(filters);
      expect(returnedData).toEqual(mockData);
    });
  });

  describe('usePayoutScheduling Hook', () => {
    it('provides correct interface', () => {
      const { result } = renderHook(() => usePayoutScheduling());
      
      expect(result.current).toHaveProperty('schedulePayout');
      expect(result.current).toHaveProperty('retryFailedPayouts');
      expect(result.current).toHaveProperty('isScheduling');
      expect(result.current).toHaveProperty('isRetrying');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('clearError');
    });

    it('handles successful payout scheduling', async () => {
      const mockResult = { batchId: 'batch-123', scheduledCount: 2 };
      mockPaymentsMockAPI.payouts.schedulePayout.mockResolvedValue({
        data: mockResult,
        error: null,
        status: 201
      });

      const { result } = renderHook(() => usePayoutScheduling());
      
      const payoutData = {
        selectedItems: [{ id: 'payout-001' }],
        achEnabled: true
      };
      
      let returnedData;
      await act(async () => {
        returnedData = await result.current.schedulePayout(payoutData);
      });

      expect(mockPaymentsMockAPI.payouts.schedulePayout).toHaveBeenCalledWith(payoutData);
      expect(returnedData).toEqual(mockResult);
      expect(result.current.error).toBeNull();
    });

    it('handles payout scheduling errors', async () => {
      mockPaymentsMockAPI.payouts.schedulePayout.mockResolvedValue({
        data: null,
        error: 'Insufficient funds',
        status: 400
      });

      const { result } = renderHook(() => usePayoutScheduling());
      
      let returnedData;
      await act(async () => {
        returnedData = await result.current.schedulePayout({
          selectedItems: [],
          achEnabled: true
        });
      });

      expect(returnedData).toBeNull();
      expect(result.current.error).toBe('Insufficient funds');
    });

    it('manages scheduling loading state', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockPaymentsMockAPI.payouts.schedulePayout.mockReturnValue(promise);

      const { result } = renderHook(() => usePayoutScheduling());
      
      // Start scheduling
      act(() => {
        result.current.schedulePayout({ selectedItems: [], achEnabled: true });
      });

      expect(result.current.isScheduling).toBe(true);

      // Complete scheduling
      await act(async () => {
        resolvePromise({ data: { batchId: 'test', scheduledCount: 0 }, error: null, status: 201 });
        await promise;
      });

      expect(result.current.isScheduling).toBe(false);
    });

    it('handles retry failed payouts', async () => {
      mockPaymentsMockAPI.payouts.retryFailedPayouts.mockResolvedValue({
        data: { retriedCount: 3 },
        error: null,
        status: 200
      });

      const { result } = renderHook(() => usePayoutScheduling());
      
      const payoutIds = ['payout-001', 'payout-002', 'payout-003'];
      let returnedCount;
      
      await act(async () => {
        returnedCount = await result.current.retryFailedPayouts(payoutIds);
      });

      expect(mockPaymentsMockAPI.payouts.retryFailedPayouts).toHaveBeenCalledWith(payoutIds);
      expect(returnedCount).toBe(3);
    });
  });
});
