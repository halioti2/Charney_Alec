# Charney Dashboard React Migration

Use this checklist to migrate the legacy DOM-driven dashboard into idiomatic React components backed by Supabase data.

- [X] **Bootstrap React State**
  - [X] Define a `dashboardData` context or hook for mock data parity, ready to swap in Supabase.
  - [X] Mirror existing data shapes (agents, commissions, audit trail, stock ticker, user profile).
  - [X] Tests: Add context unit tests ensuring mock data loads and theme/view defaults are correct.

- [X] **Shell & Layout**
  - [X] Refactor header (logo, view toggle, theme toggle, user avatar) into a React component using state/context.
  - [X] Implement view switching via React state instead of DOM class toggling.
  - [X] Move theme preference handling into a custom hook (`useTheme`) with localStorage fallback.
  - [X] Tests: Snapshot or RTL tests covering header interactions (theme toggle, view switching, user display).

- [X] **Broker View Components**
  - [X] Split key metrics tiles into reusable metric card components.
  - [X] Convert the “Agent Performance” table to React, including sorting and disclosure buttons.
  - [X] Wrap the commission forecast chart using a React-friendly Chart.js component.
  - [X] Rebuild “Market Pulse” ticker in React using requestAnimationFrame or CSS animations fed by state.
  - [X] Render market alerts as React components with dismiss handlers.
  - [X] Tests: Component tests for metrics/table/ticker rendering with mock data; chart smoke test.

- [X] **Coordinator View Components**
  - [X] Create “Today’s Focus” summary component driven by derived data.
  - [X] Replace commission queue table with React components and selection handlers.
  - [X] Port “Your Journey” progress widget to React (cap progress logic + styling).
  - [X] Wrap “Weekly Volume” chart in the shared chart component.
  - [X] Tests: RTL tests validating coordinator metrics, queue interactions, and chart rendering.

- [ ] **Commission Modal & Detail** (see `docs/commission-modal-plan.md` & `docs/trid-modal-checklist.md`)
  - [X] Define a `CommissionRecord` data loader that joins transactions, agents, brokerages, evidence (mock for now).
  - [X] Build React replacements: modal shell, email chain, calculation form, action buttons, TRID view.
  - [X] Add toast/notification hooks for modal actions.
  - [X] Verify printable TRID content and send/share workflow parity.
  - [X] Tests: commission math unit tests (existing), modal interaction tests, TRID snapshot/print verification.
  - [X] Mirror TRID modal layout, typography, and footer actions exactly as rendered in `test.html` (header treatment, loan/closing cost tables, signature block, print button).
  - [X] Validate email chain and audit trail components match `test.html` structure (actor labels, timestamps, attachment styling, expand/collapse interactions).
  - [X] Translate legacy modal/TRID styles into Tailwind utilities (document Charney color/typography tokens, include fallback guidance for designer handoff).
  - [X] Capture Supabase/Netlify dependencies for commission actions; keep UI handlers stubbed until RPC endpoints for approve/request/flag are ready (document expected payloads before integration).

- [ ] **Audit Trail / Transaction Events** (see `docs/audit-trail-plan.md`)
  - [ ] Design and add a `transaction_events` table (type, actor, metadata) to Supabase during integration.
  - [ ] Create Netlify function / Supabase RPC contract for writing audit trail entries from modal actions.
  - [ ] Build React audit trail list component with grouping + expand/collapse parity for broker panel.
  - [ ] Replace legacy broker panel history DOM with React implementation using new component.
  - [ ] Seed mock events until backend writes are wired.
  - [ ] Tests: render audit trail list with grouped events; verify expand/collapse + timestamp formatting.

- [ ] **Broker Detail Panel**
  - [ ] Convert sliding panel to a React component using portal + animation library or CSS transitions.
  - [ ] Render audit trail entries with expand/collapse managed by state.
  - [ ] Manage commission-plan inputs via React forms and validation.
  - [ ] Tests: Panel open/close tests, audit trail toggle verification, plan form validation/unit tests.

- [ ] **Global Feedback & Utilities**
  - [ ] Replace `successNotification` with a Toast context/component.
  - [ ] Centralize currency/percent formatting utilities.
  - [ ] Implement keyboard accessibility (Escape closes modal/panel, focus traps).
  - [ ] Tests: Accessibility regression tests, formatter unit tests, toast behavior tests.

- [ ] **Supabase Integration**
  - [ ] Map mock data loaders to Supabase RPC or table queries.
  - [ ] Add async data fetching with loading/error states.
  - [ ] Secure RPC calls through Netlify functions as needed.
  - [ ] Review current Supabase schema against dashboard data needs (tables, columns, RPCs).
  - [ ] Plan and apply any schema migrations required for new fields/tables.
  - [ ] Tests: Integration tests against Supabase mocks; contract tests for Netlify functions.

- [ ] **Cleanup**
  - [ ] Remove `initLegacyDashboard.js` once all sections are React-based.
  - [ ] Prune unused CSS and convert remaining bespoke styles to Tailwind where practical.
  - [ ] Add Jest/RTL smoke tests for critical components (modal calculations, tables, chart wrappers).

Keep this list updated as pieces move from the imperative helper into React components.
