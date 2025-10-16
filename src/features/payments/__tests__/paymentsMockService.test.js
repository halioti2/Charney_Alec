import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  PaymentQueueService, 
  PaymentHistoryService, 
  PayoutService,
  AgentService,
  PaymentsMockAPI 
} from '../services/paymentsMockService';

// Mock the delay function to speed up tests
vi.mock('../services/paymentsMockService', async () => {
  const actual = await vi.importActual('../services/paymentsMockService');
  return {
    ...actual,
    // Override simulateDelay to be instant in tests
    simulateDelay: vi.fn(() => Promise.resolve())
  };
});

describe('PaymentsMockService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PaymentQueueService', () => {
    describe('getPayoutQueue', () => {
      it('returns valid payout items', async () => {
        const response = await PaymentQueueService.getPayoutQueue();
        
        expect(response.status).toBe(200);
        expect(response.error).toBeNull();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.count).toBe(response.data.length);
        
        // All items should be ready status with valid amounts and bank accounts
        response.data.forEach(item => {
          expect(item.status).toBe('ready');
          expect(item.payout_amount).toBeGreaterThan(0);
          expect(item.bank_account).not.toBeNull();
        });
      });

      it('filters out invalid items', async () => {
        const response = await PaymentQueueService.getPayoutQueue();
        
        // Should not include items with zero amounts or missing bank accounts
        const invalidItems = response.data.filter(item => 
          item.payout_amount <= 0 || !item.bank_account
        );
        
        expect(invalidItems).toHaveLength(0);
      });
    });

    describe('getRequiresAttentionQueue', () => {
      it('returns items that need attention', async () => {
        const response = await PaymentQueueService.getRequiresAttentionQueue();
        
        expect(response.status).toBe(200);
        expect(response.error).toBeNull();
        expect(Array.isArray(response.data)).toBe(true);
        
        // All items should have attention-worthy issues
        response.data.forEach(item => {
          const needsAttention = (
            !item.bank_account || 
            item.payout_amount <= 0 ||
            item.status === 'failed'
          );
          expect(needsAttention).toBe(true);
        });
      });
    });
  });

  describe('PaymentHistoryService', () => {
    describe('getPaymentHistory', () => {
      it('returns payment history without filters', async () => {
        const response = await PaymentHistoryService.getPaymentHistory();
        
        expect(response.status).toBe(200);
        expect(response.error).toBeNull();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.count).toBeGreaterThan(0);
      });

      it('filters by status correctly', async () => {
        const response = await PaymentHistoryService.getPaymentHistory({
          status: 'paid'
        });
        
        expect(response.status).toBe(200);
        response.data.forEach(item => {
          expect(item.status).toBe('paid');
        });
      });

      it('filters by ACH method correctly', async () => {
        const achResponse = await PaymentHistoryService.getPaymentHistory({
          achMethod: 'ach'
        });
        
        achResponse.data.forEach(item => {
          expect(item.ach_reference).toBeTruthy();
        });

        const manualResponse = await PaymentHistoryService.getPaymentHistory({
          achMethod: 'manual'
        });
        
        manualResponse.data.forEach(item => {
          expect(item.ach_reference).toBeFalsy();
        });
      });

      it('applies pagination correctly', async () => {
        const response = await PaymentHistoryService.getPaymentHistory({
          limit: 2,
          offset: 0
        });
        
        expect(response.data.length).toBeLessThanOrEqual(2);
      });

      it('sorts by date correctly', async () => {
        const response = await PaymentHistoryService.getPaymentHistory();
        
        if (response.data.length > 1) {
          for (let i = 1; i < response.data.length; i++) {
            const prevDate = new Date(
              response.data[i-1].paid_at || 
              response.data[i-1].scheduled_at || 
              response.data[i-1].created_at
            );
            const currentDate = new Date(
              response.data[i].paid_at || 
              response.data[i].scheduled_at || 
              response.data[i].created_at
            );
            
            expect(prevDate.getTime()).toBeGreaterThanOrEqual(currentDate.getTime());
          }
        }
      });
    });
  });

  describe('PayoutService', () => {
    describe('schedulePayout', () => {
      it('successfully schedules payout with valid data', async () => {
        const payoutData = {
          selectedItems: [
            { id: 'payout-001', payout_amount: 1000 },
            { id: 'payout-002', payout_amount: 2000 }
          ],
          achEnabled: true,
          batchNote: 'Test batch'
        };

        const response = await PayoutService.schedulePayout(payoutData);
        
        expect(response.status).toBe(201);
        expect(response.error).toBeNull();
        expect(response.data.batchId).toBeTruthy();
        expect(response.data.scheduledCount).toBe(2);
      });

      it('returns error for empty selection', async () => {
        const payoutData = {
          selectedItems: [],
          achEnabled: true
        };

        const response = await PayoutService.schedulePayout(payoutData);
        
        expect(response.status).toBe(400);
        expect(response.error).toBe('No items selected for payout');
        expect(response.data).toBeNull();
      });

      it('simulates random failures', async () => {
        // Mock Math.random to force failure
        const originalRandom = Math.random;
        Math.random = vi.fn(() => 0.01); // Force failure (< 0.05)

        const payoutData = {
          selectedItems: [{ id: 'payout-001', payout_amount: 1000 }],
          achEnabled: true
        };

        const response = await PayoutService.schedulePayout(payoutData);
        
        expect(response.status).toBe(429);
        expect(response.error).toContain('transfer limit exceeded');
        
        // Restore Math.random
        Math.random = originalRandom;
      });
    });

    describe('retryFailedPayouts', () => {
      it('successfully retries failed payouts', async () => {
        const payoutIds = ['payout-001', 'payout-002'];
        
        const response = await PayoutService.retryFailedPayouts(payoutIds);
        
        expect(response.status).toBe(200);
        expect(response.error).toBeNull();
        expect(response.data.retriedCount).toBe(2);
      });
    });
  });

  describe('AgentService', () => {
    describe('getAgentBankAccount', () => {
      it('returns bank account for valid agent', async () => {
        // Using agent ID from mock data
        const response = await AgentService.getAgentBankAccount('agent-001');
        
        expect(response.status).toBe(200);
        expect(response.error).toBeNull();
        expect(response.data).toBeTruthy();
        expect(response.data.agent_id).toBe('agent-001');
      });

      it('returns 404 for non-existent agent', async () => {
        const response = await AgentService.getAgentBankAccount('non-existent-agent');
        
        expect(response.status).toBe(404);
        expect(response.error).toBe('Bank account not found');
        expect(response.data).toBeNull();
      });
    });
  });

  describe('PaymentsMockAPI Integration', () => {
    it('exports all service classes correctly', () => {
      expect(PaymentsMockAPI.payoutQueue).toBe(PaymentQueueService);
      expect(PaymentsMockAPI.paymentHistory).toBe(PaymentHistoryService);
      expect(PaymentsMockAPI.payouts).toBe(PayoutService);
      expect(PaymentsMockAPI.agents).toBe(AgentService);
    });

    it('provides consistent API interface', async () => {
      // Test that all methods return proper API response structure
      const queueResponse = await PaymentsMockAPI.payoutQueue.getPayoutQueue();
      const historyResponse = await PaymentsMockAPI.paymentHistory.getPaymentHistory();
      
      [queueResponse, historyResponse].forEach(response => {
        expect(response).toHaveProperty('data');
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('status');
        expect(typeof response.status).toBe('number');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles service errors gracefully', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Force an error by mocking the filter method to throw
      const originalFilter = Array.prototype.filter;
      Array.prototype.filter = vi.fn(() => {
        throw new Error('Simulated error');
      });

      const response = await PaymentQueueService.getPayoutQueue();
      
      expect(response.status).toBe(500);
      expect(response.error).toBe('Failed to fetch payout queue');
      expect(response.data).toEqual([]);
      
      // Restore original methods
      Array.prototype.filter = originalFilter;
      consoleSpy.mockRestore();
    });
  });
});
