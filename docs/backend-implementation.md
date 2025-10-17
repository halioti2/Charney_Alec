# Backend Implementation Strategy

This document captures the decisions, rationale, and phased checklist for wiring the dashboard to Supabase. The team will follow the **Hybrid Realtime** approach: polling for the tab dashboards, realtime for the PDF verification flow, with manual refreshes on navigation to avoid stale data.

---

## Key Decisions

1. **Hybrid Realtime Model**  
   - Keep the dashboard tabs (Broker, Coordinator, Payments, Commission Tracker) on a polling loop managed inside `DashboardContext`.  
   - Use Supabase Realtime only inside Ashley’s PDF verification flow for the “magic moment.”  
   - After a successful submission, manually trigger a `refetchTransactions()` call so the dashboard is fresh when the user returns.  
   - Confirm the Supabase tables targeted by Realtime (`commission_documents`, `commission_evidences`, `commission_checklists`, `transactions`, `transaction_events`) exist in the live schema and that Realtime replication is enabled for each before wiring listeners.

2. **Reuse Existing Context Architecture**  
   - Extend `DashboardContext` (similar to the prior `AuthContext` pattern) to own data fetching, manual refresh, and (later) realtime wiring.  
   - Frontend components consume data from context; no tab should call Supabase directly.
   - **All database writes must go through secure Netlify functions** to maintain proper authentication and data validation.
   - **All database reads use direct Supabase client** for optimal performance and real-time capabilities.

## **Hybrid Architecture Implementation (Stage 2.8)**

### **Client-Side (Direct Supabase)**
**Use for**: Read operations, real-time subscriptions, UI data fetching
```javascript
// ✅ GOOD: Direct reads for fast UI updates
const { data } = await supabase.from('commission_payouts').select('*');

// ✅ GOOD: Real-time subscriptions for live updates  
supabase.from('transactions').on('UPDATE', handleUpdate).subscribe();
```

### **Server-Side (Netlify Functions)**
**Use for**: Write operations, business logic, secure operations
```javascript
// ✅ GOOD: Writes via Netlify functions for security
const response = await fetch('/.netlify/functions/schedule-payout', {
  method: 'POST',
  body: JSON.stringify({ payout_ids: [id1, id2] })
});
```

### **DashboardContext Integration**
```javascript
// Direct Supabase reads (fast)
const refetchPaymentData = async () => {
  const rawPayouts = await fetchCommissionPayouts(); // Direct Supabase
  setPaymentData(transformPayoutsForUI(rawPayouts));
};

// Netlify function writes (secure)
const schedulePayouts = async (payoutIds) => {
  const response = await fetch('/.netlify/functions/schedule-payout', {
    method: 'POST',
    body: JSON.stringify({ payout_ids: payoutIds })
  });
  await refetchPaymentData(); // Refresh after write
};
```

3. **Phased Rollout by Tab (Updated Scope)**
   - **Stage 1: Coordinator Tab Only** - Wire coordinator queue, verification modal, and PDF workflow
   - **Stage 2: Payments Tab Only** - Hook up payments view and transaction tracking  
   - **Stage 3: Broker & Commission Tracker** - Deferred until frontend UI changes are completed on these sections

4. **Netlify Functions for Security**
   - **All database mutations** (inserts, updates, deletes) must use authenticated Netlify functions
   - **Read operations** can use direct Supabase client calls from frontend for better performance
   - **Authentication** handled via JWT tokens passed to functions
   - **Data validation** and business logic enforced server-side

---

## Why Hybrid (Pros / Cons)

### Pros
- **High demo impact**: PDF uploads feel instant without re-engineering every component.  
- **Incremental**: Polling logic for dashboards remains useful even after we later add more realtime coverage.  
- **Lower risk**: Only one realtime subscription to manage; easy cleanup on component unmount.  
- **Leverages existing skillset**: Mirrors how `AuthContext.jsx` already listens to Supabase events.

### Cons / Mitigations
- **Manual refresh is non-negotiable**: Skipping `refetchTransactions()` after a PDF submit leaves the Coordinator tab stale until the next poll. *Mitigation*: wire and test the manual refresh path before demoing; fail fast in the UI if the refresh call errors.  
- **Realtime teardown risks**: Rapid modal open/close cycles can leak listeners if cleanup is missed. *Mitigation*: guard the subscription effect against double registration and always unsubscribe on unmount/navigation.  
- **Schema alignment & replication**: The remote schema uses `commission_evidences` (replacing the old `commission_extractions`/`evidence` split). *Mitigation*: reconcile migrations with the live Supabase project and ensure Realtime replication is enabled for every table the listener depends on.  
- **Coordination + shared context**: If individual tabs bypass `DashboardContext` and hit Supabase directly, the manual refresh contract breaks and state drifts. *Mitigation*: enforce the shared hook across tracks and document the rule in each context pack.  
- **Complexity creep**: Must document clearly that dashboards rely on polling; future contributors shouldn’t bolt on extra realtime without coordinating.

---

## Implementation Checklist

### Preflight – Supabase Configuration
1. **Enable Realtime Sources**
   - [x] In the Supabase dashboard, enable Realtime for the target tables (rename to match the live schema: `transactions`, `commission_documents`, `commission_evidences`, `commission_checklists`, `transaction_events`).  
   - [x] Document any table-name differences between local migrations (`supabase/schema.sql`) and the hosted project; update migrations or listener targets accordingly.
2. **Validate RLS Policies**
   - [x] Ensure authenticated users have `SELECT` access on every table the frontend polls/listens to, even with RLS enabled (e.g., create `USING (auth.uid() IS NOT NULL)` policies for `select`).  
   - [X] Add explicit policies for Realtime channels (insert/update/delete as needed) so the PDF modal listener can receive events.
3. **Seed Demo Auth Flow**
   - [x] Create a dedicated demo user in Supabase Auth (e.g., `demo@veritas.com`).  
   - [x] Store credentials in environment variables (`VITE_DEMO_EMAIL`, `VITE_DEMO_PASSWORD` or similar).  
   - [x] Add a startup effect in the app shell that silently signs in the demo user so the frontend always runs under the `authenticated` role.
4. **Netlify Functions Setup**
   - [x] Configure Netlify CLI and `netlify.toml` for local development with `netlify dev`
   - [x] Set up function directory structure in `netlify/functions/`
   - [x] Ensure environment variables are accessible to functions

### **Stage 1: Coordinator Tab Backend Integration**
**Scope:** Only wire the Coordinator tab components and PDF workflow functionality

**Goals:**
- Enable coordinator queue to show live transaction updates via Realtime
- Wire verification modal to read from `commission_evidences` 
- Connect PDF workflow (Path A auto-approval, Path B manual verification)
- Ensure coordinator can see real-time updates when documents arrive

**Components in Scope:**
- `CoordinatorQueue` component
- `VerificationModal` component  
- PDF workflow realtime listeners
- Manual refresh functionality for coordinator actions

**Components NOT in Scope:**
- Broker tab components
- Commission tracker components
- Any broker-specific data fetching

**DashboardContext Extensions for Stage 1:**
```javascript
// Add only coordinator-specific state and methods
const [transactions, setTransactions] = useState([])
const [coordinatorData, setCoordinatorData] = useState(null)
const [isRefreshing, setIsRefreshing] = useState(false)

const refetchCoordinatorData = async () => {
  // Refresh coordinator queue and related data
}

const subscribeToTransactionUpdates = () => {
  // Realtime listeners for coordinator queue
}
```

**Netlify Functions Required:**
- [x] `approve-transaction.js` - Handles manual verification approval with data validation
- [x] `create-test-transaction.js` - Creates test data for Phase 1A/1B testing

### Phase 1A – Auto-Approval Happy Path (See `docs/parse-pdf-user-journey.md#path-a` & Track A checklist items 2–3)
- **Coordinator queue** shows updates via Realtime
- Auto-approved transactions appear instantly in coordinator view
- NO changes to broker, payments, or commission tracker tabs
1. **Workflow Finalization**
   - [x] Confirm n8n promotes clean `commission_evidences` payloads to `transactions.final_*` when `requires_review = false`.  
   - [x] Structure documented in `supabaseService.js` transformation functions.  
   - [x] Emit `transaction_events` for parsing success and auto-approval.
2. **Realtime Verification**
   - [x] Validate queue table receives inserts/updates via Realtime subscription (Coordinator view).  
   - [x] Confirm polling tabs respect updated totals after `refetchTransactions()`.
3. **Demo QA**
   - [x] Run end-to-end email → approved flow using sample PDF; verify UI changes without manual input.
4. **Netlify Function Integration**
   - [x] Test transaction creation uses `create-test-transaction.js` function
   - [x] Server-side data validation and audit trail creation

#### **Stage 2.9: Approved Transaction Process Button Control**
- [X] **Disable process button for approved transactions**: Updated CoordinatorQueueTable to show disabled "Approved" button instead of "Process" for approved transactions
- [ ] **TODO: Revisit audit behavior for approved transactions**: Need to determine proper workflow for viewing/auditing already-approved transactions with generated payments

**Rationale**: Approved transactions already have generated payments and should not be edited through the PDF audit flow. The process button now clearly indicates when a transaction cannot be modified, preventing data integrity issues.

#### **Stage 2.10: Test Data and Calculation Precision Fixes**
- [X] **Fixed agent ID null issue**: Enhanced agent lookup in create-test-transaction with better error handling and debugging
- [X] **Fixed amount mismatch**: Updated transformTransactionsForUI to calculate and display actual agent payout amounts instead of total commission
- [X] **Fixed payout precision**: Added ROUND(amount, 2) to RPC function to prevent floating point precision errors
- [ ] **Debug sale price modification**: Added debugging to PDF audit form initialization to identify source of unexpected sale price changes
- [ ] **Investigate form data source**: Need to determine why PDF audit form is using different values than original transaction data

**Current Issues**:
- Sale price changing from $1,000,000 to $2,999,966 during approval (under investigation)
- Agent lookup may be failing due to empty agents table or permissions (enhanced debugging added)

**Expected Behavior**: Test transactions should maintain original sale price values and use real agent IDs for accurate payout calculations.

### Phase 1B – Manual Verification Flow (See `docs/parse-pdf-user-journey.md#path-b` & Track A checklist items 4–6)
- **Verification modal** reads from `commission_evidences`
- Coordinator can approve via modal
- Updates reflected in **coordinator queue** and in any relevant payments components
- Manual refresh available for coordinator actions
1. **Context Enhancements**
   - [x] Extend `DashboardContext` with `transactions`, `setTransactions`, `refetchTransactions()`, and a polling hook (30–60 s).  
   - [x] Share the context API with all tabs; ensure hybrid contract documented.  
2. **Verification Modal Integration**
   - [x] In `VerificationForm.jsx`, subscribe to `commission_evidences`/`commission_checklists` for modal open events and guard cleanup.  
   - [x] On modal open, fetch latest evidence record to pre-fill fields; display confidence badges and checklist state.  
   - [x] On submit, call backend endpoint/RPC to write `transactions.final_*`, create `transaction_events`, update `status = 'approved'`, and invoke `refetchTransactions()`.
3. **Testing & QA**
   - [x] Manual review scenario: email → `needs_review` → coordinator edits → approved (Coordinator queue + tabs refreshed).  
   - [x] Navigate in/out of modal repeatedly to confirm no duplicate listeners or stale evidence.
4. **Smoke Test Refresh Safety Net**
   - [x] Place a temporary debug trigger that calls `refetchTransactions()`; confirm state updates, then remove before release once automated tests cover the path.
5. **Netlify Function Integration**
   - [x] Replace direct Supabase calls with `approve-transaction.js` function
   - [x] Add proper form validation and data type conversion
   - [x] Implement JWT authentication for secure server-side updates
### **Stage 2: Payments Tab Backend Integration**  
**Scope:** Wire Payments tab components with complete payment workflow functionality

**Goals:**
- Connect payments view to transaction and payout data
- Enable complete payment workflow (creation, scheduling, processing, status tracking)
- Implement automatic payout creation when transactions are approved
- Wire payment-related realtime updates for instant status changes
- Ensure payments team can manage full commission payment lifecycle

**Components in Scope:**
- `PaymentsView` component
- `PayoutQueue` component - Wire to real payout data with working payment actions
- `PaymentHistory` component - Connect to real transaction/payment data
- Payment operation buttons (Schedule, Mark Paid, Process ACH)
- Payment-related manual refresh and status updates

**Components NOT in Scope:**
- Broker tab components  
- Commission tracker components
- Coordinator-specific functionality (already completed in Stage 1)

**DashboardContext Extensions for Stage 2:**
```javascript
// Add payments-specific state and methods
const [payouts, setPayouts] = useState([])
const [isRefreshingPayouts, setIsRefreshingPayouts] = useState(false)

const fetchPayouts = async () => {
  // Fetch commission payouts from Supabase
}

const refetchPayouts = async () => {
  setIsRefreshingPayouts(true);
  await fetchPayouts();
  setIsRefreshingPayouts(false);
}

const subscribeToPayoutUpdates = () => {
  // Realtime listeners for payout status changes
}
```

**Netlify Functions Required:**
- [X] `create_commission_payout` (Supabase RPC) - Auto-create payouts when transactions approved
- [X] `schedule-payout.js` - Handle payment scheduling with validation
- [X] `update-payout-status.js` - Update payout status (pending → processing → paid)
- [X] `process-ach-payment.js` - Process ACH payments with proper error handling

**Database Integration:**
- [X] Commission payouts automatically created via RPC when transactions approved
- [X] Payout data accessible through shared DashboardContext polling
- [X] Real-time updates for payment status changes
- [X] Audit trail for all payment operations through transaction_events

#### **Stage 2.1: Commission Payout RPC Function**
- [X] Create `create_commission_payout` RPC function in Supabase
- [X] Add function to migration file: `supabase/migrations/[timestamp]_create_commission_payout_rpc.sql`
- [X] Test RPC function with sample transaction data
- [X] Verify RLS policies allow authenticated users to execute function
- [X] Document function parameters and return values

#### **Stage 2.2: Auto-Payout Integration with Approval Flows**
- [X] Update `netlify/functions/approve-transaction.js` to call RPC after transaction approval
- [X] Add Supabase RPC node to n8n workflow after auto-approval
- [X] Add error handling for payout creation failures in both flows
- [ ] Test end-to-end: approval → payout creation → audit trail
- [X] Document RPC integration with code comments per strategy

#### **Stage 2.3: Payment Operation Functions**
- [X] Create `netlify/functions/schedule-payout.js` for payment scheduling
- [X] Create `netlify/functions/update-payout-status.js` for status updates
- [X] Create `netlify/functions/process-ach-payment.js` for ACH processing
- [X] Add proper authentication and error handling to all payment functions
- [ ] Test each function independently with sample data

#### **Stage 2.4: Frontend Context Integration**
- [X] Extend `DashboardContext` with payout-related state (`payouts`, `setPayouts`, `isRefreshingPayouts`)
- [X] Create `fetchPayouts()` function in `src/lib/supabaseService.js`
- [X] Use the polling data (same hook as Coordinator) to populate the Payments tab
- [X] Update `PayoutQueue` component to consume real payout data from `DashboardContext`
- [X] Update `PaymentHistory` component to consume real transaction data from `DashboardContext`
- [X] Replace mock data imports with `DashboardContext` consumption

#### **Stage 2.5: Payment Actions Integration**
- [X] Wire "Schedule Payout" button to call `schedule-payout.js` function
- [X] Wire "Mark as Paid" button to call `update-payout-status.js` function
- [X] Wire "Process ACH" button to call `process-ach-payment.js` function
- [X] Trigger `refetchTransactions()` and `refetchPayouts()` after scheduling/approving payouts so totals stay current
- [X] Add manual refresh capability for payments tab
- [ ] Surface ACH flags and failure states using real data from Supabase
- [ ] Test all payment button actions work correctly with real data

#### **Stage 2.6: Testing & Validation**
- [ ] Test complete flow: Transaction Approval → Payout Creation → Payment Scheduling → UI Display
- [ ] Verify both auto and manual approval paths create payouts correctly
- [ ] Test all payment button actions (schedule, mark paid, process ACH)
- [ ] Test error scenarios (invalid payments, ACH failures, network errors)
- [ ] Verify manual refresh after actions updates totals correctly
- [ ] Confirm nothing blocks PDF realtime operations (shared context must remain stable)
- [ ] Validate RLS policies work correctly for payout and payment access

#### **Stage 2.7: Integration Quality Assurance**
- [ ] Coordinate with backend to reuse the shared refresh helper (`refetchTransactions()`) immediately after any mutation
- [ ] Ensure payments tab uses correct `activeView` value (`payments`) for component isolation
- [ ] Test that all payment operations properly update the UI state
- [ ] Verify payment status changes reflect immediately in PaymentHistory
- [ ] Test edge cases: rapid button clicks, network failures, invalid data

#### **Stage 2.8: Critical Data Display Issues (URGENT)**
- [X] **Fix Coordinator auto-refresh**: Added automatic payment data refresh when transactions update via realtime subscriptions
- [X] **Fix Payments data transformation**: Fixed field name mapping (agent_name → broker, property_address → propertyAddress) and added null checking with parseFloat for amounts
- [X] **Fix Payments manual refresh requirement**: Enhanced polling frequency (30s for payments vs 45s for coordinator) and added cross-tab refresh triggers
- [X] **Debug PayoutQueue data flow**: Added comprehensive logging and null-safe transformation with fallback values for missing data
- [X] **Verify real-time subscription lifecycle**: Updated subscriptions to refresh both coordinator and payment data on transaction changes
- [X] **Test cross-tab data consistency**: Enhanced realtime subscriptions to refresh both datasets, added test data migration for validation
- [X] **Validate data in browser console**: Created comprehensive test script (test-commission-payouts.js) with NaN detection and data validation

**✅ Stage 2.8 Complete - Hybrid Architecture Successfully Implemented**

### **Implementation Summary:**
1. **Fixed Data Transformation Issues**: Resolved `$NaN` values and missing broker/property data by fixing Supabase query relationships and field mappings
2. **Implemented Hybrid Model**: Direct Supabase reads for performance, Netlify functions for secure writes
3. **Enhanced DashboardContext**: Added payment operation handlers (`schedulePayouts`, `processPayment`, `updatePayoutStatus`) that call Netlify functions
4. **Updated PayoutQueue**: Integrated with hybrid model handlers for secure payment operations
5. **Created Test Infrastructure**: Comprehensive browser console tests for data validation and debugging

### **Architectural Benefits Achieved:**
- **Performance**: Read operations are instant (direct Supabase)
- **Security**: Write operations use service role keys safely on server
- **Real-time**: Native Supabase subscriptions for live updates
- **Maintainability**: Clear separation between reads and writes
- **Scalability**: Server-side functions can be optimized independently



### **Stage 3: Broker & Commission Tracker Integration (Future)**
**Scope:** Complete remaining dashboard tabs after frontend UI is ready

**Prerequisites:**
- Frontend UI changes completed for Broker tab
- Frontend UI changes completed for Commission Tracker tab
- Components structure finalized for both sections

**Goals:**
- Wire broker dashboard to commission data
- Connect commission tracker to tracking data
- Complete full dashboard realtime integration

**Status:** **DEFERRED** - Waiting for frontend component completion

1. **Consume Context & Metrics**
   - [ ] Read aggregated metrics exposed from `DashboardContext` (initially polling, later Supabase RPC).  
   - [ ] Call `refetchTransactions()` or a dedicated `refetchAgentMetrics()` after drill-down edits.
2. **Drill-down Data**
   - [ ] Use mock data until Supabase endpoints are ready; ensure the API contract matches `agent_metrics` and `deal_stage_snapshots`.  
   - [ ] When live data arrives, invoke the shared refresh helper after any edit to keep polling consumers accurate.
3. **Testing**
   - [ ] Table sorting, inactive agent flags, stalled-deal markers.  
   - [ ] Confirm manual refresh ensures accurate data after returning from PDF or Payments actions.

---

## Next Steps
- Complete Phase 1A/1B tasks, then finalize the polling hook in `DashboardContext` and share the API (data + `refetchTransactions`).  
- Audit `supabase/schema.sql` (and pending migrations) so it matches the tables referenced by this plan; add or rename tables as needed before enabling listeners.  
- Coordinate with backend (Ethan) on Supabase RPC signatures for transactions and payouts and document any required PostgREST policies for Realtime access.  
- Update the track context packs with the phased timeline and pointers to this file / `docs/parse-pdf-user-journey.md`.  
- Schedule cross-track testing once Phase 1B is complete to verify the manual refresh path and the single Realtime subscription lifecycle.

### Caveats (MVP RLS + Realtime)

| Caveat | Impact | Follow-up |
| ------ | ------ | --------- |
| RLS policies grant `FOR ALL` access to the `authenticated` role. | Any authenticated session can read/write/delete core tables; safe for a single trusted user, risky once roles expand. | Split policies into scoped `SELECT`/`INSERT` rules and add predicates (e.g., brokerage ownership) before multi-user rollout. |
| Frontend must attach a valid auth session despite “no login” UX. | Without a Supabase JWT, Realtime and polling still fail under RLS. | Auto-sign in with a seeded user or issue service-role tokens server-side until proper auth is implemented. |
| Policies don’t cover anon/service-role consumers. | If Netlify functions or tests use the anon key, they will hit RLS denials. | Add role-specific policies (or use service role server-side) when those execution paths appear. |
| Realtime follows RLS policy decisions. | Missing/incorrect policies will silently drop channel events. | Re-run realtime smoke test (PDF modal) after every policy update. |

---

## Notes for Team Context Packs
- **Document realtime vs. polling**: Each track’s context should state explicitly that dashboards rely on polling and that manual `refetchTransactions()` calls are required after significant actions.  
- **Specify active view keys**: Ensure tabs use the correct `activeView` values (`broker`, `coordinator`, `payments`, `commission`) so components stay isolated.  
- **Mention deferred backend work**: Payments writes and bank integrations are out of scope for the current sprint; the UI is powered by Ashley’s context data until Supabase endpoints are ready.
- **Use a single shared context**: All tabs must consume the shared `DashboardContext`; do not introduce tab-specific contexts or duplicate polling hooks.
- **PDF Parse Dashboard-Ashley-context notes**: Document the realtime subscription lifecycle (subscribe on modal open, unsubscribe on close) inside the Track A context so future updates preserve the manual `refetchTransactions()` call.

---

## Development Workflow

### **Local Development Setup**
```bash
# Use Netlify Dev for local development (required for functions)
netlify dev

# This automatically:
# - Starts Vite dev server on port 3000
# - Starts Netlify functions on port 8888
# - Proxies function calls to /.netlify/functions/
# - Loads environment variables for both frontend and functions
```

### **Function Development Patterns**
```javascript
// Standard function structure (following project patterns)
import { createClient } from '@supabase/supabase-js';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { param1, param2 } = JSON.parse(event.body);
    const jwt = event.headers.authorization?.split(' ')[1];
    
    if (!jwt) throw new Error('Authentication token is required.');
    
    const userSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error('User not found or token invalid.');

    // Function logic here...

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
}
```

### **Security Model**
- ✅ **Reads**: Direct Supabase client calls from frontend (faster, cached)
- ✅ **Writes**: Netlify functions only (secure, validated, audited)
- ✅ **Authentication**: JWT tokens passed to all functions
- ✅ **Data Validation**: Server-side type checking and business logic
- ✅ **Audit Trail**: All mutations create `transaction_events` records

```
