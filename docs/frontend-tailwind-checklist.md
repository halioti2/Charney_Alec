# Frontend Tailwind Handoff Checklist

- [X] Mirror Charney brand tokens in `tailwind.config.cjs` (`charney-red`, `charney-cream`, etc.) and document fallback values.
- [X] Define `fontFamily.brand` to include `"Franklin Gothic"` with sensible fallbacks (`'Arial Narrow', Arial, sans-serif`).
- [X] Convert commission modal containers to Tailwind utility classes (spacing, typography, borders, shadows).
- [X] Recreate TRID modal header/body/footer layout with utility classes; log any custom CSS that remains.
- [X] Align email chain and audit trail typography, link styles, and highlight rules using utilities.
- [ ] Flag components still relying on bespoke CSS for future refactor or design input.
  - Legacy `src/pages/dashboard.css` still hosts panel/button styles used by remaining legacy DOM; revisit during panel migration.
- [ ] Capture before/after reference PNGs for commission modal in `/public/design/` (save current legacy screenshot as `commission-modal-legacy.png` and React build as `commission-modal-react.png`) so designers can diff styling adjustments.
- [ ] Review TRID modal scroll/print behavior after supabase integration; ensure UI tokens stay in sync with design once real data populates the disclosure.
