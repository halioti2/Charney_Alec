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

1. **Data Modeling**
   - Map Supabase `transaction_events` rows into `{ id, category, actorName, actorId, eventType, createdAt, metadata, visibleToAgent }`.
   - Normalize `event_type` strings (matching taxonomy above) to ensure consistent grouping.
2. **Component Structure**
   - Build a reusable `<AuditTrailList events={[]}>` component:
     - Groups events by category.
     - Displays actor name, relative timestamp, and action text.
     - Supports optional metadata rendering (e.g., diffs, links).
   - Expose props for visibility filtering (e.g., hide events where `visibleToAgent === false`).
3. **Interactions**
   - Support expand/collapse per category (default expanded for current modal view, collapsed in broker panel).
   - Allow keyboard navigation and ARIA attributes for accessibility.
4. **Styling**
   - Mirror legacy indentation and border treatments (category header in red, items with left border accent).
   - Provide variants for modal and broker panel contexts if needed.
5. **Integration**
   - Wire into commission modal (already seeded with grouped data).
   - Replace the legacy broker detail panel history DOM once the React panel is in place.
6. **Testing**
   - Unit test grouping logic (no empty categories rendered).
   - RTL tests verifying expand/collapse toggles and accessibility labels.

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

