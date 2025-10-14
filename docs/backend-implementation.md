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
- **Schema alignment & replication**: The remote schema uses `commission_evidences` (replacing the old `commission_extractions`/`evidence` split). *Mitigation*: reconcile migrations with the live Supabase project and ensure Realtime replication is enabled for every table the listener depends on.  
- **Coordination + shared context**: If individual tabs bypass `DashboardContext` and hit Supabase directly, the manual refresh contract breaks and state drifts. *Mitigation*: enforce the shared hook across tracks and document the rule in each context pack.  
- **Complexity creep**: Must document clearly that dashboards rely on polling; future contributors shouldn’t bolt on extra realtime without coordinating.

---

## Implementation Checklist

### Preflight – Supabase Configuration
1. **Enable Realtime Sources**
   - [ ] In the Supabase dashboard, enable Realtime for the target tables (rename to match the live schema: `transactions`, `commission_documents`, `commission_evidences`, `commission_checklists`, `transaction_events`).  
   - [ ] Document any table-name differences between local migrations (`supabase/schema.sql`) and the hosted project; update migrations or listener targets accordingly.
2. **Validate RLS Policies**
   - [ ] Ensure authenticated users have `SELECT` access on every table the frontend polls/listens to, even with RLS enabled (e.g., create `USING (auth.uid() IS NOT NULL)` policies for `select`).  
   - [ ] Add explicit policies for Realtime channels (insert/update/delete as needed) so the PDF modal listener can receive events.
3. **Seed Demo Auth Flow**
   - [ ] Create a dedicated demo user in Supabase Auth (e.g., `demo@veritas.com`).  
   - [ ] Store credentials in environment variables (`VITE_DEMO_EMAIL`, `VITE_DEMO_PASSWORD` or similar).  
   - [ ] Add a startup effect in the app shell that silently signs in the demo user so the frontend always runs under the `authenticated` role.

### Stage 1 – Ashley (PDF Verification Flow)
1. **Context Enhancements**
   - [ ] Extend `DashboardContext` with `transactions`, `setTransactions`, and a `refetchTransactions()` function (calls Supabase via RPC or REST).  
   - [ ] Add a polling hook (30–60 s) inside the context; return a cleanup function.
2. **Realtime Listener**
   - [ ] In `VerificationForm.jsx`, subscribe to the relevant channel (`commission_evidences`, `commission_checklists` or the confirmed production table names).  
   - [ ] Update local modal state as events arrive; be sure to unsubscribe on unmount and guard against duplicate subscriptions.  
   - [ ] After a successful submit, call `refetchTransactions()` before navigating back to the Coordinator tab so polling consumers stay in sync.  
   - [ ] Verify Supabase Row Level Security and Realtime replication settings allow the listener to receive events while the modal is open.
3. **Testing & QA**
   - [ ] Manual upload test (PDF → realtime update → submit → Coordinator shows new item immediately).  
   - [ ] Ensure no duplicate listeners by navigating in/out repeatedly.
4. **Smoke Test Refresh Safety Net**
   - [ ] Place a temporary debug trigger/button that calls `refetchTransactions()` and confirm the dashboard state updates.  
   - [ ] Remove or hide the debug trigger before release once integration tests cover the path.

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
