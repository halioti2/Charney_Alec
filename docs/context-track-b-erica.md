# Track B – Payments Dashboard UI (Erica)

## Primary References
- `docs/user-journey-payments.md`
- `docs/implementation-plan.md`
- `docs/supabase-schema-vision.md` (payments tables)
- `docs/painpoint-feature-matrix.md`

## Feature Branch
- Use: `feature/payments-dashboard-erica`
- Rebase on `main` before each push/PR; tag reviewers from Track A or C.

## Do / Don't
- **Do work in:**  
  - `src/features/payments/**` (create structure: `components/`, `hooks/`, `__tests__/`)  
  - `src/pages/PaymentsDashboard.jsx` (new page entry)  
  - `src/routes.jsx` or equivalent to register the page (coordinate before editing)  
  - CSS modules or Tailwind layers scoped to payments (`src/styles/payments.css` if needed)
- **Do not touch:**  
  - `src/features/pdfAudit/**` (Ashley/Ethan)  
  - `src/features/commissionViz/**` (Rad)  
  - Legacy commission modal or TRID components unless pairing with Track C  
  - Supabase schema files (only backend modifies)

## Build Checklist
1. Create `PayoutQueue` table component: selectable rows, running total panel, empty states.  
2. Build `PaymentHistory` table with read-only rows, filters, ACH badge indicators.  
3. Implement reusable `SchedulePayoutModal` + success toast integration (hook into Toast context).  
4. Handle edge cases from journey: missing bank info flag, zero-selection guard, failure banner placeholder.  
5. Provide mock data provider (`paymentsMockService.ts`) with same shape as Supabase API.  
6. Add tests covering selection logic, modal state, toast trigger, ACH toggle behaviour.  
7. Register a dedicated "Payments" tab/route in the dashboard header; payments components should only render when that tab is active to prevent leaking state into Broker/Coordinator views.
   - Use active view key: `payments`.

## LLM Usage Notes
- Paste branch + do/don’t list up front.  
- Emphasize that outputs should live under `src/features/payments/`.  
- Ask for component-level unit tests using RTL/Vitest.  
- Ensure styling instructions mention Tailwind tokens already defined (Charney brand colors).
