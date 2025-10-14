# Backend Implementation Strategy

This document captures the decisions, rationale, and phased checklist for wiring the dashboard to Supabase. The team will follow the **Hybrid Realtime** approach: polling for the tab dashboards, realtime for the PDF verification flow, with manual refreshes on navigation to avoid stale data.

---

## Key Decisions

1. **Hybrid Realtime Model**  
   - Keep the dashboard tabs (Broker, Coordinator, Payments, Commission Tracker) on a polling loop managed inside `DashboardContext`.  
   - Use Supabase Realtime only inside Ashley’s PDF verification flow for the “magic moment.”  
   - After a successful submission, manually trigger a `refetchTransactions()` call so the dashboard is fresh when the user returns.  
   - Confirm the Supabase tables targeted by Realtime (`commission_documents`, `commission_extractions`, `commission_checklists`, `transactions`) exist in the live schema and that Realtime replication is enabled for each before wiring listeners.

2. **Reuse Existing Context Architecture**  
   - Extend `DashboardContext` (similar to the prior `AuthContext` pattern) to own data fetching, manual refresh, and (later) realtime wiring.  
   - Frontend components consume data from context; no tab should call Supabase directly.

3. **Phased Rollout (Ashley → Erica → Rad)**  
   - Stage the work to de-risk integration: finish the PDF flow first (largest UX impact), then Payments, then Commission Tracker.

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
- **Schema alignment & replication**: The hybrid plan references `commission_extractions` and `commission_checklists`, yet the current checked-in schema stops at `transactions`/`evidence`. *Mitigation*: reconcile migrations with the live Supabase project and ensure Realtime replication is enabled for every table the listener depends on.  
- **Coordination + shared context**: If individual tabs bypass `DashboardContext` and hit Supabase directly, the manual refresh contract breaks and state drifts. *Mitigation*: enforce the shared hook across tracks and document the rule in each context pack.  
- **Complexity creep**: Must document clearly that dashboards rely on polling; future contributors shouldn’t bolt on extra realtime without coordinating.

---

## Implementation Checklist

### Stage 1 – Ashley (PDF Verification Flow)
1. **Context Enhancements**
   - [ ] Extend `DashboardContext` with `transactions`, `setTransactions`, and a `refetchTransactions()` function (calls Supabase via RPC or REST).  
   - [ ] Add a polling hook (30–60 s) inside the context; return a cleanup function.
2. **Realtime Listener**
   - [ ] In `VerificationForm.jsx`, subscribe to the relevant channel (`commission_extractions`, `commission_checklists` or the confirmed production table names).  
   - [ ] Update local modal state as events arrive; be sure to unsubscribe on unmount and guard against duplicate subscriptions.  
   - [ ] After a successful submit, call `refetchTransactions()` before navigating back to the Coordinator tab so polling consumers stay in sync.  
   - [ ] Verify Supabase Row Level Security and Realtime replication settings allow the listener to receive events while the modal is open.
3. **Testing & QA**
   - [ ] Manual upload test (PDF → realtime update → submit → Coordinator shows new item immediately).  
   - [ ] Ensure no duplicate listeners by navigating in/out repeatedly.

### Stage 2 – Erica (Payments Tab)
1. **Consume Context**
   - [ ] Use the polling data (same hook as Coordinator) to populate the Payments tab.  
   - [ ] Trigger `refetchTransactions()` after scheduling/approving payouts so totals stay current.  
   - [ ] For the MVP, read-only data comes from the context produced in Stage 1. No direct Supabase payouts integration yet.
2. **Supabase Writes**
   - [ ] (Deferred) Implement mutations via Netlify functions or Supabase RPCs once backend endpoints exist.  
   - [ ] Surface ACH flags and failure states using the mock data contract already defined.  
   - [ ] Coordinate with backend to reuse the shared refresh helper (`refetchTransactions()` or follow-up RPCs) immediately after any mutation.
3. **Testing**
   - [ ] Verify manual refresh after actions.  
   - [ ] Confirm nothing blocks PDF realtime operations (shared context must remain stable).

### Stage 3 – Rad (Commission Tracker Tab)
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
- Finalize the polling hook in `DashboardContext` and share the API (data + `refetchTransactions`).  
- Audit `supabase/schema.sql` (and pending migrations) so it matches the tables referenced by this plan; add or rename tables as needed before enabling listeners.  
- Coordinate with backend (Ethan) on Supabase RPC signatures for transactions and payouts and document any required PostgREST policies for Realtime access.  
- Update the track context packs with the staged timeline and pointers to this file.  
- Schedule cross-track testing once Stage 1 is complete to verify the manual refresh path and the single Realtime subscription lifecycle.

---

## Notes for Team Context Packs
- **Document realtime vs. polling**: Each track’s context should state explicitly that dashboards rely on polling and that manual `refetchTransactions()` calls are required after significant actions.  
- **Specify active view keys**: Ensure tabs use the correct `activeView` values (`broker`, `coordinator`, `payments`, `commission`) so components stay isolated.  
- **Mention deferred backend work**: Payments writes and bank integrations are out of scope for the current sprint; the UI is powered by Ashley’s context data until Supabase endpoints are ready.
- **Use a single shared context**: All tabs must consume the shared `DashboardContext`; do not introduce tab-specific contexts or duplicate polling hooks.
- **PDF Parse Dashboard-Ashley-context notes**: Document the realtime subscription lifecycle (subscribe on modal open, unsubscribe on close) inside the Track A context so future updates preserve the manual `refetchTransactions()` call.
