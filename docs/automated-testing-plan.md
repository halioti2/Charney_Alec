# Stage 2.6: Automated Testing Suite

## Overview
Create comprehensive automated tests for payment workflow functions, RLS policies, and data validation.

## Testing Categories

### 1. **RPC Function Tests**
Test the commission payout RPC function with various scenarios:

```sql
-- Test file: supabase/test_commission_payout_rpc_comprehensive.sql

BEGIN;
-- Test 1: Valid payout creation
SELECT plan(10);

-- Test basic payout creation
SELECT results_eq(
  $$ SELECT create_commission_payout('test-transaction-1', 1500.00, '2024-01-15') $$,
  $$ VALUES (true) $$,
  'Should create valid commission payout'
);

-- Test duplicate prevention
SELECT results_eq(
  $$ SELECT create_commission_payout('test-transaction-1', 1500.00, '2024-01-15') $$,
  $$ VALUES (false) $$,
  'Should prevent duplicate payouts for same transaction'
);

-- Test amount validation
SELECT results_eq(
  $$ SELECT create_commission_payout('test-transaction-2', -100.00, '2024-01-15') $$,
  $$ VALUES (false) $$,
  'Should reject negative amounts'
);

-- Test transaction existence validation
SELECT results_eq(
  $$ SELECT create_commission_payout('nonexistent-transaction', 1500.00, '2024-01-15') $$,
  $$ VALUES (false) $$,
  'Should reject payouts for nonexistent transactions'
);

-- Test date validation
SELECT results_eq(
  $$ SELECT create_commission_payout('test-transaction-3', 1500.00, '1990-01-15') $$,
  $$ VALUES (false) $$,
  'Should reject payouts with invalid dates'
);

SELECT * FROM finish();
ROLLBACK;
```

### 2. **RLS Policy Tests**
Verify Row Level Security policies work correctly:

```sql
-- Test file: supabase/test_rls_policies.sql

BEGIN;
SELECT plan(8);

-- Test coordinator access
SET LOCAL ROLE coordinator_role;
SELECT ok(
  (SELECT COUNT(*) FROM commission_payouts) > 0,
  'Coordinators should see commission payouts'
);

-- Test agent access restrictions  
SET LOCAL ROLE agent_role;
SET LOCAL current_setting.agent_id = 'agent-123';
SELECT results_eq(
  $$ SELECT COUNT(*) FROM commission_payouts WHERE agent_id != 'agent-123' $$,
  $$ VALUES (0::bigint) $$,
  'Agents should only see their own payouts'
);

-- Test admin access
SET LOCAL ROLE admin_role;
SELECT ok(
  (SELECT COUNT(*) FROM commission_payouts) > 0,
  'Admins should see all commission payouts'
);

SELECT * FROM finish();
ROLLBACK;
```

### 3. **Netlify Function Integration Tests**
Test all payment operation functions:

```javascript
// File: netlify/functions/__tests__/payment-functions.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handler as schedulePayoutHandler } from '../schedule-payout.js';
import { handler as updateStatusHandler } from '../update-payout-status.js';
import { handler as processAchHandler } from '../process-ach-payment.js';

describe('Payment Function Integration Tests', () => {
  
  describe('schedule-payout.js', () => {
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
      expect(body.payout.status).toBe('scheduled');
    });

    it('should reject invalid payout ID', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'invalid-payout',
          ach_enabled: false
        })
      };

      const response = await schedulePayoutHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(404);
      expect(body.success).toBe(false);
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
      expect(body.payout.status).toBe('paid');
    });

    it('should reject invalid status transitions', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'test-payout-paid',
          new_status: 'ready' // Can't go from paid back to ready
        })
      };

      const response = await updateStatusHandler(event);
      
      expect(response.statusCode).toBe(422);
    });
  });

  describe('process-ach-payment.js', () => {
    it('should initiate ACH payment successfully', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'test-payout-scheduled',
          ach_provider: 'mock',
          test_mode: true
        })
      };

      const response = await processAchHandler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.ach_result.status).toBe('initiated');
    });

    it('should reject ACH for ineligible payouts', async () => {
      const event = {
        httpMethod: 'POST',
        headers: { authorization: 'Bearer valid-jwt-token' },
        body: JSON.stringify({
          payout_id: 'test-payout-already-paid',
          ach_provider: 'mock'
        })
      };

      const response = await processAchHandler(event);
      
      expect(response.statusCode).toBe(422);
    });
  });
});
```

### 4. **End-to-End Workflow Tests**
Test complete payment workflows:

```javascript
// File: src/features/payments/__tests__/payment-workflow.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PayoutQueue from '../components/PayoutQueue';
import PaymentHistory from '../components/PaymentHistory';

describe('Payment Workflow E2E Tests', () => {
  
  it('should complete full payout scheduling workflow', async () => {
    render(<PayoutQueue />);
    
    // Select payouts
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // Select first payout
    
    // Click schedule button
    const scheduleButton = screen.getByText('Schedule Payout');
    fireEvent.click(scheduleButton);
    
    // Confirm in modal
    await waitFor(() => {
      expect(screen.getByText('Schedule Payout')).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByText('Confirm & Schedule');
    fireEvent.click(confirmButton);
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/Successfully scheduled/)).toBeInTheDocument();
    });
  });

  it('should handle payment status updates', async () => {
    render(<PaymentHistory />);
    
    // Find Mark as Paid button
    await waitFor(() => {
      const markPaidButton = screen.getByText('Mark as Paid');
      expect(markPaidButton).toBeInTheDocument();
      
      fireEvent.click(markPaidButton);
    });
    
    // Verify payment marked as paid
    await waitFor(() => {
      expect(screen.getByText(/marked as paid/)).toBeInTheDocument();
    });
  });
});
```

### 5. **Data Validation Tests**
Test business logic and data integrity:

```javascript
// File: src/features/payments/__tests__/validation.test.js

import { describe, it, expect } from 'vitest';
import { validatePayoutAmount, validateStatusTransition } from '../utils/paymentValidation';

describe('Payment Validation Tests', () => {
  
  describe('Payout Amount Validation', () => {
    it('should accept valid positive amounts', () => {
      expect(validatePayoutAmount(1500.00)).toBe(true);
      expect(validatePayoutAmount(0.01)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validatePayoutAmount(-100)).toBe(false);
      expect(validatePayoutAmount(0)).toBe(false);
      expect(validatePayoutAmount(null)).toBe(false);
    });
  });

  describe('Status Transition Validation', () => {
    it('should allow valid transitions', () => {
      expect(validateStatusTransition('ready', 'scheduled')).toBe(true);
      expect(validateStatusTransition('scheduled', 'processing')).toBe(true);
      expect(validateStatusTransition('processing', 'paid')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(validateStatusTransition('paid', 'ready')).toBe(false);
      expect(validateStatusTransition('cancelled', 'processing')).toBe(false);
    });
  });
});
```

## Test Runner Setup

### Package.json Test Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:supabase": "supabase test db",
    "test:functions": "vitest netlify/functions/__tests__",
    "test:e2e": "vitest src/**/*.test.js --run"
  }
}
```

### Test Database Setup
```sql
-- File: supabase/test_setup.sql

-- Create test data
INSERT INTO agents (id, name, email) VALUES 
  ('test-agent-1', 'Test Agent 1', 'agent1@test.com'),
  ('test-agent-2', 'Test Agent 2', 'agent2@test.com');

INSERT INTO transactions (id, agent_id, property_address, final_sale_price, status) VALUES
  ('test-transaction-1', 'test-agent-1', '123 Test St', 500000, 'approved'),
  ('test-transaction-2', 'test-agent-2', '456 Test Ave', 300000, 'approved');

-- Create test payouts
INSERT INTO commission_payouts (id, transaction_id, agent_id, payout_amount, status) VALUES
  ('test-payout-1', 'test-transaction-1', 'test-agent-1', 15000, 'ready'),
  ('test-payout-2', 'test-transaction-2', 'test-agent-2', 9000, 'scheduled');
```

## Coverage Goals
- **RPC Functions**: 100% code coverage with edge cases
- **Netlify Functions**: 90%+ coverage with error scenarios  
- **UI Components**: 80%+ coverage with user interactions
- **Business Logic**: 100% validation rule coverage
- **RLS Policies**: Complete access control verification

## CI/CD Integration
- Run tests on every PR
- Require passing tests for deployment
- Generate coverage reports
- Test against staging Supabase instance