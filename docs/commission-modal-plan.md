# Commission Modal Migration Plan

## Current Legacy Behavior (from `test.html`)

- Opens when clicking “Needs Viewing” or commission rows; populated by `initLegacyDashboard`.
- Tabs: “Transaction History” (email/audit trail) and “Commission Plan” (splits, cap progress).
- Actions: Approve, Request Info, Flag Conflict, Generate Disclosure (TRID).
- Calculation form recalculates Agent Net payout based on inputs (sale price, commission %, referral %).
- TRID modal printable and send-ready.
- Success notification toast using `successNotification` div.
- Audit trail entries expandable; broker side panel shares similar data.

## Supabase Data Mapping

- `transactions`: final deal values (sale price, commission %, agent split, status, referrals JSON).
- `agents`: name, email, default split/cap (support calculation defaults).
- `brokerages`: franchise fee %, E&O, transaction fee (global deductions).
- `evidence`: text snippets, attachments for email/source view.
- **To add**: `transaction_events` table for audit history (type, actor, timestamp, payload).

### CommissionRecord (frontend derived type)

```ts
type CommissionRecord = {
  id: string;
  status: string;
  propertyAddress: string | null;
  buyerName: string | null;
  sellerName: string | null;
  salePrice: number | null;
  grossCommissionPercent: number | null;
  referralFeePct: number | null;
  agentSplitPercent: number | null;
  agent: { id: string; name: string; email: string } | null;
  brokerage: { id: string; franchiseFeePct: number; eoFee: number; transactionFee: number };
  referrals: Array<{ name: string; percent: number }>;
  evidence: EvidenceSnippet[];
  auditTrail: TransactionEvent[];
};
```

All derived values (GCI, agent net, cap progress) come from `calculateCommission()` helper plus brokerage deductions.

## Migration Checklist

1. **Data Loader**
   - Create `useCommissionRecord(id)` hook that returns `CommissionRecord` (mock adapter now).
   - Map `transactions` + `agents` + `brokerages`; flatten `final_referrals`.
   - Convert `evidence` rows into display chain.
   - Stub `auditTrail` while `transaction_events` table is pending.

2. **React Components**
- `CommissionModal` (modal shell, portal, open/close state).
- `CommissionTabs` (history vs. plan).
- `EmailChain` (renders evidence snippets).
- `CommissionCalculationForm` (controlled inputs + breakdown, leverages `calculateCommission`, supports history two-column card layout).
   - `CommissionActions` (Approve/Request/Flag buttons).
- `CommissionTRIDView` (printable document component – see `docs/trid-modal-checklist.md`).
   - `NotificationToast` (reuse global toast context once built).

3. **State Management**
   - Store `activeCommissionId`, modal visibility in `DashboardContext`.
   - Keep calculation form state local but derive defaults from `CommissionRecord`.
   - Provide handlers: `approveCommission`, `requestInfo`, `flagConflict`, `generateDisclosure` (mock for now, future RPC integration).

### Supabase / Netlify Integration Notes

- Frontend handlers should eventually call Netlify functions that proxy Supabase RPCs:
  - `POST /functions/commission-approve` → `{ commissionId: string, approvedBy: string, notes?: string }`
  - `POST /functions/commission-request-info` → `{ commissionId: string, requestedBy: string, message: string }`
  - `POST /functions/commission-flag` → `{ commissionId: string, flaggedBy: string, reason: string }`
- Each function is expected to:
  - Write a `transaction_events` record capturing the action, actor, and payload.
  - Update `transactions.status` atomically (e.g., `approved`, `needs_info`, `flagged`).
  - Return `{ success: boolean, status: string, eventId: string }` so the UI can reconcile toast messaging.
- Until those endpoints exist, the React handlers remain mocked but log the payload shape for easy substitution.

4. **Testing**
   - Unit: `calculateCommission` (existing) + new edge cases if needed.
   - Component: 
     - Modal opens with seeded data.
     - Inputs update derived values.
     - Action buttons trigger toasts (mock functions).
      - Regression: toggling modal open/closed does not trigger hook-order warnings (Vitest coverage added).
   - Snapshot/print test for TRID component (ensure stable structure).

5. **Cleanup**
   - Remove modal-related DOM manipulation from `initLegacyDashboard.js`.
   - Ensure accessibility (focus trap, Escape closes, return focus to trigger).
   - Connect toast system instead of manual DOM show/hide.

## Future Enhancements (post-MVP)

- Wire Supabase RPCs for approve/request/flag (maybe Netlify functions).
- Replace mock audit trail with real `transaction_events`.
- Support real-time updates (listen to Supabase channels).
- Multi-user edits and analytics dashboards (component architecture already context-driven).
