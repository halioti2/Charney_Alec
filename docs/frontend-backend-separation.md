# Frontend-Backend Separation Guide

## Overview
The Charney Commission Tracker uses a clear separation between client-side and server-side operations for security, maintainability, and proper business logic encapsulation.

## Architecture Pattern

```
Frontend (React/Vite)
├─ READ Operations (Direct Supabase Client)
│  ├─ Transaction display
│  ├─ Commission payout listing  
│  ├─ Agent information
│  └─ Dashboard metrics
│
└─ WRITE Operations (Netlify Functions)
   ├─ Transaction approval
   ├─ Commission payout creation
   ├─ Payment processing
   └─ Status updates
```

## Client-Side Operations (Frontend)

### Purpose
- **Data Display**: Fetch and display data for UI components
- **Real-time Updates**: Subscribe to database changes for live updates
- **User Interaction**: Handle form inputs and UI state management

### Implementation
- **File**: `src/lib/supabaseService.js`
- **Authentication**: Uses client-side Supabase client with user session
- **Security**: Protected by Row Level Security (RLS) policies
- **Scope**: READ-ONLY operations

### Functions
```javascript
// ✅ Client-side READ operations
fetchTransactions()           // Dashboard transaction display
fetchCommissionPayouts()      // Payments tab data
fetchTransactionForVerification() // Modal data
transformPayoutsForUI()       // Data formatting
```

## Server-Side Operations (Netlify Functions)

### Purpose
- **Business Logic**: Enforce business rules and validation
- **Security**: Use service role privileges safely
- **Integration**: Interface with external services (n8n, payment providers)
- **Audit**: Create comprehensive audit trails

### Implementation
- **Location**: `netlify/functions/`
- **Authentication**: Uses service role key server-side
- **Security**: Bypasses RLS with elevated privileges
- **Scope**: CREATE, UPDATE, DELETE operations

### Functions
```javascript
// ✅ Server-side WRITE operations
approve-transaction.js        // Approve transactions + create payouts
process-payment.js           // Execute ACH payments
process-ach-payment.js       // Handle ACH processing
schedule-payout.js           // Schedule future payments
update-payment-status.js     // Update payment status
update-payout-status.js      // Update payout status
create-test-transaction.js   // Testing utilities
```

## Security Benefits

### Client-Side Security
- **Limited Scope**: Only read operations exposed to browser
- **User Context**: Operations restricted to user's authorized data
- **RLS Protection**: Database policies prevent unauthorized access
- **No Secrets**: Service role keys never exposed to frontend

### Server-Side Security
- **Elevated Privileges**: Can perform operations requiring service role
- **Business Logic**: Validates all operations before database changes
- **Audit Trail**: Creates comprehensive logs for compliance
- **Error Handling**: Sanitizes errors before returning to client

## Data Flow Examples

### 1. Commission Payout Creation
```
User clicks "Approve Transaction"
    ↓
Frontend calls Netlify function
    ↓
approve-transaction.js validates business rules
    ↓
Calls Supabase RPC create_commission_payout
    ↓
Updates transaction status
    ↓
Creates audit trail
    ↓
Returns success/error to frontend
    ↓
Frontend refreshes dashboard data
```

### 2. Payment Processing
```
User clicks "Process Payment"
    ↓
Frontend calls Netlify function
    ↓
process-payment.js validates payout eligibility
    ↓
Integrates with ACH provider
    ↓
Updates payout status
    ↓
Creates payment record
    ↓
Sends notifications
    ↓
Returns result to frontend
```

### 3. Dashboard Display
```
Component mounts
    ↓
fetchCommissionPayouts() called
    ↓
Direct Supabase query (client-side)
    ↓
transformPayoutsForUI() formats data
    ↓
Component renders with transformed data
    ↓
Real-time subscription updates UI automatically
```

## Development Guidelines

### When to Use Client-Side
- ✅ Displaying data in UI components
- ✅ Real-time updates and subscriptions
- ✅ Form state management
- ✅ Data transformation for display
- ✅ User preference settings

### When to Use Server-Side
- ✅ Creating or modifying database records
- ✅ Operations requiring business logic validation
- ✅ Integration with external APIs
- ✅ Operations requiring elevated privileges
- ✅ Financial transactions
- ✅ Audit trail creation

### Anti-Patterns to Avoid
- ❌ Creating payouts directly from frontend
- ❌ Exposing service role keys to browser
- ❌ Business logic in UI components
- ❌ Direct database writes from frontend
- ❌ Bypassing Netlify function validation

## File Organization

```
src/lib/supabaseService.js
├─ fetchTransactions() - READ
├─ fetchCommissionPayouts() - READ  
├─ fetchTransactionForVerification() - READ
└─ transformPayoutsForUI() - UTILITY

netlify/functions/
├─ approve-transaction.js - WRITE
├─ process-payment.js - WRITE
├─ schedule-payout.js - WRITE
├─ update-payment-status.js - WRITE
├─ update-payout-status.js - WRITE
└─ create-test-transaction.js - UTILITY
```

## Error Handling

### Client-Side Error Handling
```javascript
// Handle network and permission errors
try {
  const data = await fetchCommissionPayouts();
  return data;
} catch (error) {
  console.error('Failed to fetch payouts:', error);
  return []; // Safe fallback
}
```

### Server-Side Error Handling
```javascript
// Validate business rules and return structured errors
try {
  const result = await createPayout(transactionId);
  return { success: true, data: result };
} catch (error) {
  console.error('Payout creation failed:', error);
  return { 
    success: false, 
    error: error.message,
    code: 'PAYOUT_CREATION_FAILED'
  };
}
```

## Testing Strategy

### Client-Side Testing
- **Unit Tests**: Data transformation functions
- **Integration Tests**: Supabase query functionality
- **Component Tests**: UI rendering with mock data
- **E2E Tests**: User interaction flows

### Server-Side Testing
- **Unit Tests**: Business logic validation
- **Integration Tests**: Database operations
- **API Tests**: Netlify function endpoints
- **Security Tests**: Authorization and validation

## Migration Notes

### From Direct Client Operations
If migrating from direct client-side database operations:

1. **Identify Write Operations**: Find any client-side CREATE/UPDATE/DELETE
2. **Create Netlify Functions**: Move business logic to server-side
3. **Update Frontend Calls**: Replace direct DB calls with function calls
4. **Add Error Handling**: Implement proper error responses
5. **Test Security**: Verify RLS policies work correctly

### Benefits of Migration
- **Enhanced Security**: Service role keys protected
- **Better Performance**: Server-side operations are faster
- **Easier Debugging**: Centralized business logic
- **Improved Compliance**: Comprehensive audit trails
- **Scalable Architecture**: Can optimize server and client independently

---

*This separation ensures secure, maintainable, and scalable commission tracking operations while providing a responsive user experience.*