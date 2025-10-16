/**
 * Mock Payment Service - Simulates Supabase API calls
 * 
 * This service provides the same interface as the real Supabase API
 * but uses mock data for development and testing.
 * 
 * When ready for production, swap this service with real Supabase calls.
 */

import { 
  CommissionPayout, 
  PaymentQueueItem, 
  PaymentHistoryItem,
  PayoutBatch,
  Agent,
  Transaction,
  PayoutBankAccount,
  commissionPayoutsMock,
  paymentQueueMock,
  paymentHistoryMock,
  agentsMock,
  transactionsMock,
  bankAccountsMock
} from '../../../mocks/paymentsMockData';

// Simulate network delay for realistic API behavior
const simulateDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

// Simulate API response structure matching Supabase
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

interface ApiListResponse<T> {
  data: T[];
  error: string | null;
  status: number;
  count: number;
}

/**
 * Payment Queue Operations
 */
export class PaymentQueueService {
  /**
   * Get all transactions ready for payout
   * Simulates: SELECT * FROM commission_payouts WHERE status = 'ready' AND payout_amount > 0
   */
  static async getPayoutQueue(): Promise<ApiListResponse<PaymentQueueItem>> {
    await simulateDelay();
    
    try {
      // Filter for valid payout items (same logic as component)
      const validItems = paymentQueueMock.filter(item => 
        item.status === 'ready' && 
        item.bank_account !== null && 
        item.payout_amount > 0
      );

      return {
        data: validItems,
        error: null,
        status: 200,
        count: validItems.length
      };
    } catch (error) {
      return {
        data: [],
        error: 'Failed to fetch payout queue',
        status: 500,
        count: 0
      };
    }
  }

  /**
   * Get transactions that require attention
   * Simulates: Complex query for problematic transactions
   */
  static async getRequiresAttentionQueue(): Promise<ApiListResponse<PaymentQueueItem>> {
    await simulateDelay();
    
    try {
      const attentionItems = paymentQueueMock.filter(item => {
        return (
          !item.bank_account || 
          item.payout_amount <= 0 ||
          item.status === 'failed'
        );
      });

      return {
        data: attentionItems,
        error: null,
        status: 200,
        count: attentionItems.length
      };
    } catch (error) {
      return {
        data: [],
        error: 'Failed to fetch attention queue',
        status: 500,
        count: 0
      };
    }
  }
}

/**
 * Payment History Operations
 */
export class PaymentHistoryService {
  /**
   * Get payment history with optional filters
   * Simulates: SELECT * FROM commission_payouts WHERE status IN (...) ORDER BY paid_at DESC
   */
  static async getPaymentHistory(filters?: {
    status?: 'all' | 'paid' | 'scheduled' | 'ready';
    achMethod?: 'all' | 'ach' | 'manual';
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<PaymentHistoryItem>> {
    await simulateDelay();
    
    try {
      let filtered = [...paymentHistoryMock];
      
      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        filtered = filtered.filter(item => item.status === filters.status);
      }
      
      // Apply ACH method filter
      if (filters?.achMethod === 'ach') {
        filtered = filtered.filter(item => item.ach_reference);
      } else if (filters?.achMethod === 'manual') {
        filtered = filtered.filter(item => !item.ach_reference);
      }
      
      // Sort by payment date (most recent first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.paid_at || a.scheduled_at || a.created_at);
        const dateB = new Date(b.paid_at || b.scheduled_at || b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Apply pagination
      const offset = filters?.offset || 0;
      const limit = filters?.limit || 50;
      const paginatedData = filtered.slice(offset, offset + limit);

      return {
        data: paginatedData,
        error: null,
        status: 200,
        count: filtered.length
      };
    } catch (error) {
      return {
        data: [],
        error: 'Failed to fetch payment history',
        status: 500,
        count: 0
      };
    }
  }
}

/**
 * Payout Operations
 */
export class PayoutService {
  /**
   * Schedule a batch of payouts
   * Simulates: INSERT INTO payout_batches + UPDATE commission_payouts
   */
  static async schedulePayout(payoutData: {
    selectedItems: PaymentQueueItem[];
    achEnabled: boolean;
    batchNote?: string;
  }): Promise<ApiResponse<{ batchId: string; scheduledCount: number }>> {
    await simulateDelay(1000); // Longer delay for processing
    
    try {
      // Simulate validation
      if (!payoutData.selectedItems || payoutData.selectedItems.length === 0) {
        return {
          data: null,
          error: 'No items selected for payout',
          status: 400
        };
      }

      // Simulate random failure (5% chance for testing)
      if (Math.random() < 0.05) {
        return {
          data: null,
          error: 'Brokerage account daily transfer limit exceeded',
          status: 429
        };
      }

      // Generate mock batch ID
      const batchId = `batch-${Date.now()}`;
      const scheduledCount = payoutData.selectedItems.length;

      // In real implementation, this would:
      // 1. Create payout_batch record
      // 2. Update commission_payouts with batch_id and scheduled_at
      // 3. Trigger ACH processing if enabled
      
      console.log('Mock: Scheduling payout batch', {
        batchId,
        scheduledCount,
        achEnabled: payoutData.achEnabled,
        totalAmount: payoutData.selectedItems.reduce((sum, item) => sum + item.payout_amount, 0)
      });

      return {
        data: { batchId, scheduledCount },
        error: null,
        status: 201
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to schedule payout',
        status: 500
      };
    }
  }

  /**
   * Retry failed payouts
   * Simulates: UPDATE commission_payouts SET status = 'ready' WHERE id IN (...)
   */
  static async retryFailedPayouts(payoutIds: string[]): Promise<ApiResponse<{ retriedCount: number }>> {
    await simulateDelay();
    
    try {
      // Simulate retry logic
      const retriedCount = payoutIds.length;
      
      console.log('Mock: Retrying failed payouts', { payoutIds, retriedCount });

      return {
        data: { retriedCount },
        error: null,
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to retry payouts',
        status: 500
      };
    }
  }
}

/**
 * Agent Operations
 */
export class AgentService {
  /**
   * Get agent bank account information
   * Simulates: SELECT * FROM payout_bank_accounts WHERE agent_id = ?
   */
  static async getAgentBankAccount(agentId: string): Promise<ApiResponse<PayoutBankAccount>> {
    await simulateDelay();
    
    try {
      const bankAccount = bankAccountsMock.find(account => account.agent_id === agentId);
      
      return {
        data: bankAccount || null,
        error: bankAccount ? null : 'Bank account not found',
        status: bankAccount ? 200 : 404
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to fetch bank account',
        status: 500
      };
    }
  }
}

// Export all services as a unified API
export const PaymentsMockAPI = {
  payoutQueue: PaymentQueueService,
  paymentHistory: PaymentHistoryService,
  payouts: PayoutService,
  agents: AgentService
};
