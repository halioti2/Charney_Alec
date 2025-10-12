# Track C – Commission Visualization (Rad)

## Primary References
- `docs/user-journey-commision-visualization.md`
- `docs/implementation-plan.md`
- `docs/supabase-schema-vision.md` (agent metrics, deal stage tables)
- `docs/painpoint-feature-matrix.md`

## Feature Branch
- Work on: `feature/commission-viz-rad`
- Keep branch rebased on `main`; request reviews from Track A or B after major merges.

## Do / Don't
- **Do work in:**  
  - `src/features/commissionViz/**` (create `components/`, `hooks/`, `__tests__/`)  
  - `src/pages/CommissionDashboard.jsx` and supporting routes  
  - Visualization helpers under `src/lib/commissionViz/**` (formatters, selectors)  
  - Tailwind utility overrides in `src/styles/commissionViz.css` if needed
- **Do not touch:**  
  - Payments (`src/features/payments/**`)  
  - PDF audit (`src/features/pdfAudit/**`)  
  - Supabase schema migrations (coordinate with backend)
- **Do not remove** existing coordinator/broker components until replacement is confirmed.

## Build Checklist
1. Implement date-range picker with presets + custom range (wired to context/store).  
2. Build `AgentPerformanceTable` replacement featuring sortable columns, score badge, empty state per journey.  
3. Add drill-down view `/commissions/agent/:id` with deal list, adjustments, inactive flag.  
4. Surface data freshness banner + loader for large ranges; include stalled stage markers using `deal_stage_snapshots`.  
5. Provide mock data service matching Supabase agent metrics schema.  
6. Add RTL snapshot tests for table sorting, detail navigation, empty states.

## LLM Usage Notes
- Start each prompt with branch and directories allowed.  
- Request composable components; avoid modifying global providers unless coordinated.  
- Ask for memoized selectors/hooks to keep future data integration straightforward.  
- Use Tailwind tokens defined in `tailwind.config.cjs` (Charney palette, fonts).
