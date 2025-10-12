# Audit Trail Plan

## Event Taxonomy (Legacy `test.html`)

- **Ingestion**
  - Actor: `Clarity AI`
  - Action: `Commission created from email.`
- **Verification**
  - Actor: `Coordinator`
  - Action: `Corrected 'Sale Price'.`
- **Communication**
  - Actor: `Coordinator`
  - Action: `Requested 'Wire_Instructions.pdf'.`
  - Actor: `<Broker Name>`
  - Action: `Uploaded 'Wire_Instructions.pdf'.`
- **Approval**
  - Actor: `Coordinator`
  - Action: `Approved by Coordinator.`
  - Actor: `John Doe` (Broker)
  - Action: `Final approval by Broker.`
- **Payment**
  - Actor: `System`
  - Action: `Payment scheduled.`

These categories appear in both the legacy modal and the slide-in broker panel, grouped by category with expandable subsections.

## Audit Trail Component Checklist

- [x] **Data Modeling**
  - Map Supabase `transaction_events` rows into `{ id, category, actorName, actorId, eventType, createdAt, metadata, visibleToAgent }`.
  - Normalize `event_type` strings (matching taxonomy above) to ensure consistent grouping.
- [x] **Component Structure**
  - Build a reusable `<AuditTrailList events={[]}>` component that groups events, displays actor/timestamp/action text, and accepts visibility props.
- [x] **Interactions**
  - Support expand/collapse per category with accessible controls.
- [x] **Styling**
  - Mirror legacy indentation and accent borders; provide modal-friendly variant.
- [x] **Integration (Commission Modal)**
  - Render the audit trail list inside `CommissionModal` (powered by mock data for now).
- [X] **Integration (Broker Detail Panel)**
  - Introduce `AuditTrailDrawer` to replicate the legacy sidebar for agent clicks (panel migration can reuse this drawer).
- [x] **Testing**
  - Add grouping and interaction tests for the audit trail list and ensure modal tests cover actor rendering.

## API Contract (`transaction_events`)

### Shape

```ts
type TransactionEventPayload = {
  transactionId: string;
  eventType: 'ingestion' | 'verification' | 'communication' | 'approval' | 'payment' | string;
  actorId?: string;
  actorName: string;
  metadata?: Record<string, unknown>;
  visibleToAgent?: boolean;
};
```

### Create Event (Netlify Function)

- **Endpoint:** `POST /functions/transaction-events`
- **Request Body:** `TransactionEventPayload`
- **Auth:** Authenticated user (coordinator or broker for MVP). Function handles Supabase insert with service key.
- **Response:** `{ id: string; createdAt: string; eventType: string; metadata: Record<string, unknown> }`
- **Errors:** `401` unauthorized, `422` validation error (missing fields, invalid transaction), `500` on unexpected failures.

### Read Events

- **Endpoint:** `GET /functions/transaction-events?transactionId=<uuid>&visibleToAgent=true`
- **Response:** `TransactionEventPayload[]` with server timestamps and category ordering.
- **Pagination:** Optional `?cursor=<id>` for future scaling.

### Security Notes

- MVP allows both coordinators and brokers to write events via the function; tighten RLS/function checks later without changing the UI contract.
- `visible_to_agent` flag controls whether borrower-facing UIs see an event.
