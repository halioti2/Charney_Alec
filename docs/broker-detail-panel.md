# Broker Detail Panel Reference

This document describes the React implementation of the Broker Detail Panel (`src/components/BrokerDetailPanel.jsx`) and its supporting pieces.

## Overview

- Rendered from `DashboardPage` when `panelAgent` in `DashboardContext` resolves to a matching commission (`src/pages/DashboardPage.jsx`).
- Opens when a table row's agent name is clicked inside `AgentPerformanceTable`, which sets `panelAgent` via dashboard context (`src/components/AgentPerformanceTable.jsx`).
- Sits in a fixed, right-aligned overlay with a scrim backdrop (`BrokerDetailPanel.jsx:71`), mimicking the legacy sliding panel.

## Entry and Exit

- The overlay includes a full-screen backdrop button that closes the panel on click (`BrokerDetailPanel.jsx:72-77`).
- Escape key presses invoke `onClose`, keeping parity with accessibility expectations (`BrokerDetailPanel.jsx:31-40`).
- Close button in the header also triggers `onClose` and is labelled for screen readers (`BrokerDetailPanel.jsx:84-100`).

## Layout and Tabs

- Header presents agent name, email, and "Agent Detail" sublabel (`BrokerDetailPanel.jsx:84-91`).
- Two tabs manage the panel body state:
  - `Transaction History` (default) shows agent summary and grouped audit trail.
  - `Commission Plan` exposes editable plan inputs and derived payout snapshot.
- Tab buttons apply Tailwind classes to reflect active state while remaining keyboard accessible (`BrokerDetailPanel.jsx:101-118`).

## History Tab

- Snapshot card summarizes status, score, property, and sale price using data from the passed `commission` object (`BrokerDetailPanel.jsx:125-142`).
- Audit history renders with `<AuditTrailList variant="panel" />`, inheriting grouped expand/collapse behavior and the panel-style styling (`BrokerDetailPanel.jsx:143`, `src/components/AuditTrailList.jsx:48-140`).
- Audit data reuses `commission.auditTrail`, keeping view parity with the commission modal (`src/lib/dashboardData.js:118-157`).

## Commission Plan Tab

- Controlled inputs handle primary split, cap totals, and deductions; fields can be cleared to an empty string while editing before defaulting back to `0` on blur (`BrokerDetailPanel.jsx:14-132`, `BrokerDetailPanel.jsx:219-294`).
- Brokerage split automatically mirrors `100 - agentSplit`, preventing misaligned totals (`BrokerDetailPanel.jsx:42-52`, `BrokerDetailPanel.jsx:219-231`).
- Derived commission snapshot shows GCI, referral/franchise deductions, agent share, and net payout calculated via `calculateCommission` from dashboard context (`BrokerDetailPanel.jsx:44-51`, `BrokerDetailPanel.jsx:215-266`, `src/context/DashboardContext.jsx:78-95`).
- "Save Plan" persists the normalized numeric plan back to `agentPlans` and fires a toast confirmation (`BrokerDetailPanel.jsx:90-132`, `BrokerDetailPanel.jsx:269-272`).

## Accessibility and UX Notes

- Panel is rendered `aria-modal="true"` with `role="dialog"` and `aria-labelledby` referencing the agent name heading for context (`BrokerDetailPanel.jsx:79-83`).
- Category toggles in the audit trail list expose `aria-expanded` and keyboard support both in modal and panel variants (`src/components/AuditTrailList.jsx:68-138`).
- Input labels use uppercase microcopy consistent with the Tailwind token set, keeping visual parity with legacy design.

## Testing Coverage

- `BrokerDetailPanel.test.jsx` verifies the history tab renders snapshot metadata and the audit trail entry, and that plan defaults populate correctly when the plan tab is active (`src/components/__tests__/BrokerDetailPanel.test.jsx:41-50`).
- `AuditTrailList.test.jsx` includes panel-variant tests covering the arrow toggle and grouped category expansion (`src/components/__tests__/AuditTrailList.test.jsx:24-37`).

## Future Integration Notes

- Toast notifications still rely on mock handlers until Supabase-backed mutations are introduced; ensure backend integration preserves the same payload shape consumed by the panel save handler.
- When replacing mock data, confirm the incoming commission objects supply `auditTrail`, `salePrice`, and split defaults, or extend the context initializer to derive sensible fallbacks.
