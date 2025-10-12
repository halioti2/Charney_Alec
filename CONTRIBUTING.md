# Contributing Guidelines

## Branch Strategy
- Base all work on `main`.  
- Use feature branch prefixes per track:
  - `feature/pdf-<task>` – Track A (Ethan, Ashley)
  - `feature/payments-<task>` – Track B (Erica)
  - `feature/commission-viz-<task>` – Track C (Rad)
- Rebase before pushing (`git pull --rebase origin main`).  
- Open PRs with a reviewer from another track; no direct pushes to `main`.

## LLM Context Pack Workflow
1. Open the relevant context file in `docs/context-track-*.md`.  
2. Start the LLM prompt with:
   - Branch name  
   - “Do / Don’t” list  
   - Links to journey/spec docs  
3. Paste only the files you plan to modify; avoid cross-track directories.  
4. Request tests and story/state verification where applicable.

## Tests & Linting
- Run targeted tests before pushing:
  - `npm run test -- --run src/features/payments/__tests__`
  - `npm run test -- --run src/features/commissionViz/__tests__`
  - `npm run test -- --run src/features/pdfAudit/__tests__`
- Lint (once configured): `npm run lint`

## Commit & PR Checklist
- ✅ Feature branch named with correct prefix.  
- ✅ All tests for your feature pass.  
- ✅ No files outside your track scope modified unless coordinated.  
- ✅ Update documentation if APIs, schema, or workflows change.  
- ✅ PR description includes context doc links and testing notes.

## Daily Integration Cadence
- Each evening, pull the latest `main` and rebase your branch.  
- Use a shared “integration” branch if large merges are pending.  
- Resolve conflicts locally; do not rely on the LLM to fix merge conflicts.
