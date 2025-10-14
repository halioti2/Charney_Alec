# Track A – PDF Workflow Backend (Ethan)

## Primary References
- `docs/user-journey-pdf-extraction.md`
- `docs/implementation-plan.md`
- `docs/supabase-schema-vision.md`
- `docs/painpoint-feature-matrix.md`

## Feature Branch
- Work from: `feature/pdf-workflow-backend-ethan`
- Rebase/sync with `main` before pushing; squash merge after review.

## Do / Don't
- **Do work in:**  
  - `supabase/` (migrations, SQL functions, storage policies)  
  - `netlify/functions/pdf-audit/**` or equivalent serverless folder  
  - `n8n/` workflows or exported JSON (store under `automation/pdf-audit/`)  
  - `src/lib/pdfAudit/**` for client helpers or API hooks  
  - Documentation updates in `docs/supabase-schema-vision.md`, `docs/context-track-a-ashley.md`
- **Do not touch:**  
  - Payments (`src/features/payments/**`, `docs/context-track-b-erica.md`)  
  - Commission visualization (`src/features/commissionViz/**`, `docs/context-track-c-rad.md`)  
  - React UI components owned by other tracks unless pairing

## Build Checklist
1. Finalize OCR + parsing plan; document node choices and env requirements.  
2. Build n8n workflow: intake webhook → OCR → extraction (LLM) → gatekeeper → Supabase writes (`commission_documents`, `commission_extractions`, `commission_checklists`, `transactions` flags).  
3. Implement Supabase edge functions or serverless endpoints as needed (e.g., signed URLs, checklist status updates).  
4. Populate golden sample dataset + spreadsheet for accuracy logging; automate comparison if possible.  
5. Provide stubbed REST endpoints or hooks that Ashley can consume (e.g., `/api/pdf-audit/:id`).  
6. Record setup/run instructions in `docs/pdf-workflow-readme.md` (create if missing).

## Documents 
- Deal Sheet (The primary parsed document)
- Contract Documents (e.g., Contract of Sale, Lease)
- Invoice
- Disclosure Forms


## LLM Usage Notes
- Start prompts with the branch name + explicit directories to avoid cross-track edits.  
- When generating SQL, remind the model we already added the schema; ask it to generate migrations, not re-create tables.  
- Prefer idempotent n8n JSON exports; keep credentials redacted.  
- Ask for unit-test scaffolding or Postman collections to validate endpoints.
