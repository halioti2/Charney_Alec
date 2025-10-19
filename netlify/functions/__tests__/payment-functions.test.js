// File: netlify/functions/__tests__/payment-functions.test.js
// Comprehensive integration tests for payment operation functions

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabaseResponse = (data, error = null) => ({
  data,
  error,
  single: () => ({ data: data?.[0], error })
});

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'test-user-123', email: 'test@example.com' } }
    }))
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(mockSupabaseResponse([{
          id: 'test-payout-1',
          transaction_id: 'test-txn-1',
          agent_id: 'test-agent-1',
          payout_amount: 1500.00,
          status: 'ready'
        }])))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve(mockSupabaseResponse([{
            id: 'test-payout-1',
            status: 'scheduled',
            updated_at: new Date().toISOString()
          }])))
        }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve(mockSupabaseResponse([{}])))
  }))
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

// Import functions after mocking
import { handler as schedulePayoutHandler } from '../schedule-payout.js';
import { handler as updateStatusHandler } from '../update-payout-status.js';
import { handler as processAchHandler } from '../process-ach-payment.js';

describe('Payment Function Integration Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  describe('schedule-payout.js', () => {
    it('should handle OPTIONS request correctly', async () => {
      const event = { httpMethod: 'OPTIONS' };
      const response = await schedulePayoutHandler(event);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    });

    it('should reject non-POST requests', async () => {
      const event = { httpMethod: 'GET' };
      const response = await schedulePayoutHandler(event);
      
      expect(response.statusCode).toBe(405);
      expect(response.body).toBe('Method Not Allowed');
    });

    it('should schedule valid payout successfully', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'test-payout-1',
          ach_enabled: false,
          scheduled_date: new Date().toISOString(),
          notes: 'Test scheduling'
        })
      };

      const response = await schedulePayoutHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain('scheduled successfully');
    });

    it('should reject missing payout_id', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          ach_enabled: false
        })
      };

      const response = await schedulePayoutHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(body.error).toContain('payout_id is required');
    });

    it('should reject requests without authorization', async () => {
      const event = {
        httpMethod: 'POST',
        headers: {},
        body: JSON.stringify({
          payout_id: 'test-payout-1'
        })
      };

      const response = await schedulePayoutHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(body.error).toContain('Authentication token is required');
    });
  });

  describe('update-payout-status.js', () => {
    it('should update status with valid transition', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'test-payout-1',
          new_status: 'paid',
          paid_at: new Date().toISOString()
        })
      };

      const response = await updateStatusHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain('marked as paid');
    });

    it('should validate required fields', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          // Missing payout_id and new_status
        })
      };

      const response = await updateStatusHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(body.error).toBeDefined();
    });

    it('should handle different status transitions', async () => {
      const statuses = ['scheduled', 'processing', 'paid', 'failed', 'cancelled'];
      
      for (const status of statuses) {
        const event = {
          httpMethod: 'POST',
          headers: { authorization: 'Bearer valid-jwt-token' },
          body: JSON.stringify({
            payout_id: 'test-payout-1',
            new_status: status,
            ...(status === 'paid' && { paid_at: new Date().toISOString() }),
            ...(status === 'failed' && { failure_reason: 'Test failure' })
          })
        };

        const response = await updateStatusHandler(event);
        const body = JSON.parse(response.body);

        expect([200, 422]).toContain(response.statusCode);
        expect(body).toHaveProperty('success');
      }
    });
  });

  describe('process-ach-payment.js', () => {
    it('should initiate ACH payment successfully', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'test-payout-1',
          ach_provider: 'mock',
          test_mode: true
        })
      };

      const response = await processAchHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.ach_result).toBeDefined();
      expect(body.ach_result.provider).toBe('mock');
    });

    it('should validate ACH provider', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'test-payout-1',
          ach_provider: 'invalid-provider'
        })
      };

      const response = await processAchHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(body.error).toContain('Unsupported ACH provider');
    });

    it('should support different ACH providers', async () => {
      const providers = ['stripe', 'plaid', 'dwolla', 'mock'];
      
      for (const provider of providers) {
        const event = {
          httpMethod: 'POST',
          headers: { authorization: 'Bearer valid-jwt-token' },
          body: JSON.stringify({
            payout_id: 'test-payout-1',
            ach_provider: provider,
            test_mode: true
          })
        };

        const response = await processAchHandler(event);
        const body = JSON.parse(response.body);

        expect(response.statusCode).toBe(200);
        expect(body.success).toBe(true);
        expect(body.ach_result.provider).toBe(provider);
      }
    });

    it('should handle minimum amount validation', async () => {
      // Mock payout with amount below minimum
      const lowAmountResponse = mockSupabaseResponse([{
        id: 'test-payout-low',
        payout_amount: 0.50, // Below $1 minimum
        status: 'scheduled'
      }]);
      
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce(lowAmountResponse);

      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'test-payout-low',
          ach_provider: 'mock'
        })
      };

      const response = await processAchHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(body.error).toContain('below ACH minimum');
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase connection errors', async () => {
      // Mock network error
      mockSupabaseClient.auth.getUser.mockRejectedValueOnce(
        new Error('Network connection failed')
      );

      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'test-payout-1'
        })
      };

      const response = await schedulePayoutHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(body.error).toBeDefined();
    });

    it('should handle invalid JSON requests', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: 'invalid-json{'
      };

      const response = await schedulePayoutHandler(event);
      
      expect(response.statusCode).toBe(500);
    });

    it('should handle malformed JWT tokens', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer invalid.jwt.token' },
        body: JSON.stringify({
          payout_id: 'test-payout-1'
        })
      };

      // Mock invalid token response
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      const response = await schedulePayoutHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(500);
      expect(body.error).toContain('User not found');
    });
  });

  describe('Audit Trail Creation', () => {
    it('should create audit events for all operations', async () => {
      const operations = [
        { handler: schedulePayoutHandler },
        { handler: updateStatusHandler },
        { handler: processAchHandler }
      ];

      for (const { handler } of operations) {
        const insertSpy = vi.fn(() => Promise.resolve({ error: null }));
        mockSupabaseClient.from.mockReturnValueOnce({
          insert: insertSpy
        });

        const event = {
          httpMethod: 'POST',
          headers: { authorization: 'Bearer valid-jwt-token' },
          body: JSON.stringify({
            payout_id: 'test-payout-1',
            ...(handler === updateStatusHandler && { new_status: 'paid' }),
            ...(handler === processAchHandler && { ach_provider: 'mock' })
          })
        };

        await handler(event);
        
        // Verify audit event was attempted (may be mocked)
        expect(insertSpy).toHaveBeenCalled();
      }
    });
  });
});