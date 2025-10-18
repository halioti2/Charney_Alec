# Commission Payout RPC Function - Expected Behavior Documentation

## Overview
The `create_commission_payout` RPC function is the core business logic component for automatic commission payout creation in the Charney system. This document defines its expected behavior, validation rules, and integration patterns.

## Function Signature

```sql
CREATE OR REPLACE FUNCTION create_commission_payout(
  p_transaction_id UUID
) 
RETURNS TABLE(
  payout_id UUID, 
  amount NUMERIC, 
  status TEXT,
  agent_id UUID,
  created_at TIMESTAMPTZ
)
```

## Expected Behavior

### 1. Input Validation

#### **Transaction Existence Check**
- **Input**: Valid UUID for `p_transaction_id`
- **Expected**: Function queries `transactions` table for the provided ID
- **Success**: Proceeds to next validation step
- **Failure**: Raises exception with message: `"Transaction not found: [transaction_id]"`

#### **Transaction Status Validation**
- **Input**: Transaction with any status
- **Expected**: Only transactions with `status = 'approved'` are eligible
- **Success**: Proceeds to payout calculation
- **Failure**: Raises exception with message: `"Transaction must be approved to create payout. Current status: [actual_status]"`

#### **Duplicate Payout Prevention**
- **Input**: Transaction ID that may already have a payout
- **Expected**: Checks `commission_payouts` table for existing `transaction_id`
- **Success**: No existing payout found, proceeds to creation
- **Failure**: Raises exception with message: `"Payout already exists for transaction: [transaction_id]"`

### 2. Payout Calculation

#### **Formula**
```
Payout Amount = Sale Price × Commission % × Agent Split %
```

#### **Field Mapping**
- **Sale Price**: `transactions.final_sale_price`
- **Commission %**: `transactions.final_listing_commission_percent` (default: 3.0%)
- **Agent Split %**: `transactions.final_agent_split_percent` (default: 100.0%)

#### **Expected Calculations**
| Sale Price | Commission % | Agent Split % | Expected Payout |
|------------|--------------|---------------|-----------------|
| $1,000,000 | 3.0% | 100% | $30,000.00 |
| $750,000 | 3.0% | 70% | $15,750.00 |
| $500,000 | 2.5% | 80% | $10,000.00 |

#### **Amount Validation**
- **Expected**: Payout amount > 0
- **Failure**: Raises exception with message: `"Invalid payout amount calculated: [amount]"`

### 3. Database Operations

#### **Commission Payout Creation**
```sql
INSERT INTO commission_payouts (
  transaction_id,
  agent_id,
  payout_amount,
  status,
  auto_ach,
  created_at
)
```

**Expected Values:**
- `transaction_id`: Input parameter
- `agent_id`: From `transactions.agent_id`
- `payout_amount`: Calculated amount
- `status`: Always `'ready'`
- `auto_ach`: Always `false` (manual payment default)
- `created_at`: Current timestamp

#### **Transaction Update**
```sql
UPDATE transactions SET 
  latest_payout_id = [new_payout_id],
  pending_payout_amount = [calculated_amount],
  updated_at = NOW()
```

#### **Audit Trail Creation**
```sql
INSERT INTO transaction_events (
  transaction_id,
  event_type,
  actor_name,
  metadata,
  created_at
)
```

**Expected Metadata:**
```json
{
  "payout_id": "uuid",
  "payout_amount": 32406.19,
  "calculation_method": "auto_rpc",
  "sale_price": 1080206.45,
  "commission_percent": 3.0,
  "agent_split_percent": 100.0
}
```

### 4. Return Values

#### **Success Response**
```json
[
  {
    "payout_id": "6d513bc0-2c85-4345-aa37-0cd2af25fd4e",
    "amount": 32406.19,
    "status": "ready",
    "agent_id": "74aa1341-1c89-460d-9dee-9977b8c9d656",
    "created_at": "2025-10-17T00:36:11.973Z"
  }
]
```

#### **Error Response**
```json
{
  "code": "P0001",
  "message": "Transaction not found: 00000000-0000-0000-0000-000000000000",
  "details": null,
  "hint": null
}
```

## Integration Patterns

### 1. n8n Workflow Integration

#### **HTTP Request Configuration**
```json
{
  "method": "POST",
  "url": "https://[project].supabase.co/rest/v1/rpc/create_commission_payout",
  "headers": {
    "apikey": "[service_role_key]",
    "Authorization": "Bearer [service_role_key]",
    "Content-Type": "application/json"
  },
  "body": {
    "p_transaction_id": "{{ $json.id }}"
  }
}
```

#### **Expected Workflow**
1. **PDF Processing** → Extract transaction data
2. **Auto-Approval Logic** → Update transaction status to 'approved'
3. **RPC Call** → Create commission payout
4. **Notifications** → Send confirmation emails

### 2. Netlify Function Integration

#### **JavaScript Call Pattern**
```javascript
const { data, error } = await supabase.rpc('create_commission_payout', {
  p_transaction_id: transactionId
});

if (error) {
  console.error('Payout creation failed:', error.message);
  return { success: false, error: error.message };
}

return { 
  success: true, 
  payout: data[0],
  message: 'Payout created successfully'
};
```

## Error Handling Patterns

### 1. Validation Errors (Expected)
- **Transaction not found**
- **Transaction not approved**
- **Duplicate payout exists**
- **Invalid payout amount**

### 2. System Errors (Unexpected)
- **Database connection issues**
- **Permission violations**
- **Constraint violations**

### 3. Integration Error Handling

#### **n8n Workflow**
- **Continue workflow on payout errors** (transaction approval still valid)
- **Log errors for manual review**
- **Send notification to payments team**

#### **Netlify Functions**
- **Non-blocking payout creation** (transaction approval succeeds regardless)
- **Return payout error in response** (don't throw exceptions)
- **Trigger manual payout creation workflow**

## Testing Scenarios

### 1. Happy Path Testing
```sql
-- Test with valid approved transaction
SELECT * FROM create_commission_payout('882034e4-0bc1-43d2-a563-93e01162416e');
```

### 2. Validation Testing
```sql
-- Test with non-existent transaction
SELECT * FROM create_commission_payout('00000000-0000-0000-0000-000000000000');

-- Test with non-approved transaction (requires setup)
-- Test with existing payout (requires duplicate call)
```

### 3. Calculation Testing
```sql
-- Verify calculation accuracy
SELECT 
  final_sale_price,
  final_listing_commission_percent,
  final_agent_split_percent,
  (final_sale_price * 
   COALESCE(final_listing_commission_percent, 3.0) / 100.0 *
   COALESCE(final_agent_split_percent, 100.0) / 100.0) as expected_amount
FROM transactions 
WHERE id = 'test-transaction-id';
```

## Performance Expectations

### 1. Execution Time
- **Expected**: < 100ms for typical transaction
- **Maximum**: < 500ms for complex scenarios
- **Timeout**: 30 seconds (Supabase default)

### 2. Concurrency
- **Support**: Multiple simultaneous calls for different transactions
- **Protection**: Database-level uniqueness constraints prevent race conditions
- **Isolation**: Each function call operates independently

### 3. Resource Usage
- **Database Connections**: Uses connection pooling
- **Memory**: Minimal (single transaction processing)
- **Locks**: Brief row-level locks during INSERT operations

## Security Considerations

### 1. Authentication
- **Required**: Service role key or authenticated user session
- **Permission**: `GRANT EXECUTE ON FUNCTION TO authenticated`
- **Elevation**: `SECURITY DEFINER` allows bypassing RLS policies

### 2. Data Access
- **Read Access**: All transaction and agent data
- **Write Access**: Commission payouts, transaction updates, audit events
- **Isolation**: Function operates with elevated privileges safely

### 3. Audit Trail
- **Complete Logging**: All operations logged to `transaction_events`
- **Immutable Records**: Event history cannot be modified
- **Compliance**: Meets financial audit requirements

## Maintenance and Monitoring

### 1. Key Metrics
- **Success Rate**: > 99% for valid inputs
- **Error Distribution**: Track validation vs. system errors
- **Performance**: Monitor execution time trends

### 2. Alerting
- **High Error Rate**: > 5% failures in 15-minute window
- **Performance Degradation**: > 1 second average execution time
- **System Errors**: Any database connection or permission errors

### 3. Regular Maintenance
- **Monthly**: Review calculation accuracy and business rule changes
- **Quarterly**: Performance optimization and index analysis
- **Annually**: Security review and privilege audit

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-17 | Initial implementation with core business logic |
| 1.0.1 | 2025-10-17 | Enhanced error handling and validation |
| 1.0.2 | 2025-10-17 | Added comprehensive audit trail metadata |

---

*This document reflects the implemented behavior of the commission payout RPC function as of Stage 2.2 completion. For implementation details, see the source code in `supabase/migrations/20241016120000_create_commission_payout_rpc.sql`.*