# Commission Payout RPC Function Documentation

## Function: `create_commission_payout(p_transaction_id UUID)`

### Purpose
Automatically creates a commission payout record when a transaction is approved. This function is called by both n8n workflows (auto-approval) and Netlify functions (manual approval) to ensure consistent payout creation.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_transaction_id` | UUID | Yes | The ID of the approved transaction for which to create a payout |

### Return Value

Returns a table with the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `payout_id` | UUID | The ID of the newly created commission payout |
| `amount` | NUMERIC | The calculated payout amount |
| `status` | TEXT | The payout status (always 'ready' for new payouts) |
| `agent_id` | UUID | The ID of the agent who will receive the payout |
| `created_at` | TIMESTAMPTZ | Timestamp when the payout was created |

### Business Logic

#### Payout Amount Calculation
```
payout_amount = sale_price × (commission_percent / 100) × (agent_split_percent / 100)
```

**Default Values:**
- `commission_percent`: 3.0% if not specified
- `agent_split_percent`: 100.0% if not specified

#### Validation Rules
1. **Transaction Exists**: Must be a valid transaction ID
2. **Transaction Approved**: Transaction status must be 'approved'
3. **No Duplicate Payouts**: Cannot create multiple payouts for the same transaction
4. **Positive Amount**: Calculated payout amount must be greater than 0

### Side Effects

1. **Creates commission_payouts record** with status 'ready'
2. **Updates transactions table**:
   - Sets `latest_payout_id` to the new payout ID
   - Sets `pending_payout_amount` to the calculated amount
   - Updates `updated_at` timestamp
3. **Creates transaction_events record** for audit trail with:
   - `event_type`: 'payout_created'
   - `actor_name`: 'System'
   - `metadata`: Calculation details and amounts

### Error Conditions

| Error | Condition | Message |
|-------|-----------|---------|
| Transaction Not Found | Invalid transaction ID | "Transaction not found: {id}" |
| Not Approved | Transaction status ≠ 'approved' | "Transaction must be approved to create payout. Current status: {status}" |
| Duplicate Payout | Payout already exists | "Payout already exists for transaction: {id}" |
| Invalid Amount | Calculated amount ≤ 0 | "Invalid payout amount calculated: {amount}" |

### Usage Examples

#### From Netlify Function
```javascript
const { data: payoutResult, error } = await userSupabase
  .rpc('create_commission_payout', { 
    p_transaction_id: transaction_id 
  });

if (error) throw error;
console.log('Payout created:', payoutResult[0]);
```

#### From n8n Workflow
```javascript
// Supabase RPC Node
{
  "function": "create_commission_payout",
  "parameters": {
    "p_transaction_id": "{{$node['Approve_Transaction'].json['id']}}"
  }
}
```

### Security

- **Function Security**: `SECURITY DEFINER` - runs with elevated privileges
- **Access Control**: Only `authenticated` users can execute
- **RLS Compliance**: Respects Row Level Security policies on all tables
- **Audit Trail**: All operations logged in transaction_events

### Dependencies

**Required Tables:**
- `transactions` (read)
- `commission_payouts` (write)
- `transaction_events` (write)
- `agents` (read, via transaction.agent_id)

**Required Permissions:**
- `authenticated` role must have execute permission on function
- RLS policies must allow authenticated users to read/write relevant tables