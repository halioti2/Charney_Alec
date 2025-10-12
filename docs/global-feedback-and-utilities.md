# Global Feedback & Utilities Reference

This note captures the current state of the “Global Feedback & Utilities” workstream in the React migration.

## Toast Notifications (Feedback)

- `ToastContext` (`src/context/ToastContext.jsx`) exposes `pushToast`/`dismissToast` APIs backed by React state.  
  - IDs are generated per toast (`generateToastId`) and the context is memoized for stable references.
- `ToastContainer` (`src/components/ToastContainer.jsx`) renders stacked notifications in the bottom-right:
  - Auto-dismiss after 4s (overridable per toast), with manual close button (`×`).
  - Uses `pointer-events-none` on the wrapper to avoid blocking the page.
- Consumption examples:
  - Commission modal actions push status toasts (`src/pages/DashboardPage.jsx:25-72`).
  - Broker detail panel save button confirms plan persistence (`src/components/BrokerDetailPanel.jsx:61-68`).
- Tests validate push/dismiss behavior (`src/components/__tests__/ToastContainer.test.jsx:15-24`).
- Legacy `successNotification` div is gone with the removal of `initLegacyDashboard.js`; toasts now cover all flows.

## Formatting Utilities

- `formatCurrency`, `formatPercent`, and `formatNumber` live in `src/lib/formatters.js`.
  - Currency uses memoized `Intl.NumberFormat` for USD default and supports overrides.
  - Percent formatter handles whole numbers vs fractions (`fromFraction` option) and digit precision clamping.
  - Number formatter wraps `Intl.NumberFormat` for general numeric output.
- Unit tests cover common formatting cases (`src/lib/__tests__/formatters.test.js`).
- Shared helpers are used across broker/coordinator components (metrics tiles, tables, calculation forms) to prevent bespoke string manipulation.

## Accessibility Items (In Progress)

- Escape key closes modals/panels (`src/components/CommissionModal.jsx:31-41`, `src/components/BrokerDetailPanel.jsx:31-40`).
- Focus trap and keyboard routing are not yet implemented; plan to add a reusable focus-trap hook during the post-Supabase accessibility pass.

## Next Steps / Parking Lot

1. Introduce an actual focus trap util (see below) once the Supabase integration and upcoming feature work land.
2. Add automated accessibility regression coverage (axe/RTL or similar) to satisfy the open checklist bullet.

### What is a Focus Trap Hook?

A focus trap confines keyboard focus to a dialog/panel while it is open. A typical hook:

- Stores the previously focused element.
- Finds focusable children in the overlay.
- On `Tab`/`Shift+Tab`, loops focus within the dialog.
- Restores focus to the trigger when the dialog closes.

We can postpone implementing this (and the related accessibility checklist item) until after Supabase integration and the next three features are delivered; document it under the accessibility TODO list so it stays visible.
