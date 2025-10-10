# Dashboard State Refactor Plan

## Legacy State Sources

The current dashboard logic inside `initLegacyDashboard.js` owns data and UI state imperatively:

- **Data Sets**
  - `mockData`: array of 50 commission records (agent, property, sale price, audit trail, email chain).
  - `agentPlans`: split/cap settings per agent.
  - `mockStockData`: ticker entries for market pulse + alerts.
- **Derived utilities**
  - `calculateCommission(deal, plan)` lives alongside the mock data.
  - Static mock user profile (`Alex Johnson`) and avatar URL.

- **UI state handled in the DOM**
  - View toggle (`broker` vs `coordinator`) toggles `.hidden` classes.
  - Theme toggle reads/writes localStorage and adds/removes `html.dark`.
  - Active commission modal (incl. TRID view) rebuilds DOM on each change.
  - Broker detail panel tracks open/closed state with CSS classes.
  - Stock ticker interval mutates DOM every 4 seconds.
  - Success notification uses `setTimeout` and manual show/hide.

## React State Targets

To bring parity into React we’ll create a dashboard context (`DashboardProvider`) that exposes:

- `commissions`: array of commission objects (start with mock data).
- `agentPlans`: map keyed by agent name.
- `ticker`: market ticker entries plus alert configuration.
- `user`: `{ name, avatarUrl }`.
- `theme`: `'light' | 'dark'` with setter that persists to localStorage.
- `activeView`: `'broker' | 'coordinator'`.
- `activeCommissionId` and modal visibility state.
- `panel`: `{ isOpen, agentId }`.
- `notification`: toast payload (message + type) with queue/helpers.

Utility hooks:

- `useDashboardData()` – read-only data access.
- `useDashboardActions()` – mutations (set theme, switch view, open modal, update plan, etc.).
- `useCommissionCalculations(dealId)` – returns derived commission numbers via shared helpers.
- `useTicker()` – handles interval updates via `useEffect`.

Shared helpers to extract from legacy code:

- `calculateCommission(deal, plan)` (pure function).
- `formatCurrency`, `formatPercent`.
- `generateMockData(seed?)` (used until Supabase integration lands).

## Migration Order

1. Build `DashboardContext` with mock data + view/theme state.
2. Migrate header/layout to consume context for view/theme toggles.
3. Incrementally replace broker/coordinator sections with React components driven by the context.
4. Move modal/panel state into context; render modals via React portals.
5. Replace notification + ticker timers with React hooks.
6. Once all consumers use context, delete `initLegacyDashboard.js`.

This document will evolve as pieces move into React-driven state. Update the checklist alongside changes.
