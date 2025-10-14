# Track A – PDF Audit UI (Ashley)

## Primary References
- `docs/user-journey-pdf-extraction.md`
- `docs/implementation-plan.md`
- `docs/supabase-schema-vision.md` (PDF intake tables & checklist fields)

## Feature Branch
- Start every session on: `feature/pdf-audit-ui-<your-initials>` (replace placeholder)
- Rebase from `main` before pushing or opening a PR.

## Do / Don't
- **Do work in:**  
  - `src/features/pdfAudit/**` (create directory if missing)  
  - `src/pages/PdfAuditPage.jsx`  
  - `src/components/pdfAudit/**` (DealSheetViewer, VerificationForm, ComplianceChecklist)  
  - `src/styles/pdfAudit.css` (if dedicated styling is needed)  
  - Related test files under `src/features/pdfAudit/__tests__/`
- **Do not touch:**  
  - `src/features/payments/**` (Erica)  
  - `src/features/commissionViz/**` (Rad)  
  - Existing commission modal components unless coordinating with Track C  
  - Supabase schema files (handled centrally)

## Build Checklist
1. Implement the two-panel verification modal per the journey (PDF viewer + editable form).
2. Add confidence badge state handling (green/yellow/red thresholds).
3. Create compliance checklist with drag-and-drop upload zones and completion gating.
4. Wire UI actions to context stubs (no real data yet) so Ethan can hook the webhook later.
5. Use the shared `DashboardContext` for all data; no tab-specific contexts.
6. Respect the dashboard `activeView` contract—PDF verification actions should route back to the `coordinator` view via the shared context helpers.  
7. Subscribe to Supabase Realtime when the verification modal opens, unsubscribe on close/unmount, and call `refetchTransactions()` after a successful submit before navigating away (prevents stale dashboards).
8. Add Storybook entries or screenshots for design review, if possible.

## Backend Coordination Rules
- Confirm with Ethan which Supabase tables/events drive the modal (`commission_extractions`, `commission_checklists`, etc.) before wiring data dependencies.  
- Coordinate when schema fields change so the PDF listener and dashboard polling stay aligned.  
- Keep temporary mock fields/component state in the UI—avoid writing placeholder data into Supabase until backend migrations are ready.

## LLM Usage Notes
- Always paste this context plus the user journey into the LLM prompt.  
- Emphasize the branch name and do/don’t list to prevent cross-track edits.  
- Request declarative component structures; avoid global state changes.  
- Use TypeScript-friendly syntax if we convert later (keep props typed via JSDoc at minimum).
