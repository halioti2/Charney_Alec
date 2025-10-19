---

# PDF Intake Journeys

This document captures the two flows the MVP must support. Both depend on the hybrid data strategy: Supabase Realtime drives queue updates, dashboard tabs poll via `DashboardContext`, and the verification modal fetches evidence on demand. Implementation references: `docs/backend-implementation.md` (Phase 1A/1B) and `docs/context-track-a-ethan.md`.

---

## Path A – Auto-Approval Happy Path (Demo Focus)

**Purpose:** Showcase end-to-end automation with zero human input for the live demo.

| Step | Status / Intake Status | System Actions | Notes |
| ---- | ---------------------- | -------------- | ----- |
| 1 | `in_queue` / `pending_processing` | n8n inserts (or upserts) the `transactions` row when the email arrives. Realtime pushes the new record to the Coordinator queue. | Coordinator sees the row instantly—no polling or user action. |
| 2 | `in_review` / `processing` | n8n downloads the PDF, runs OCR + LLM extraction, emits progress event. | Queue row updates in place; the UI renders a “In Review…” indicator. |
| 3 | Successful extraction (`requires_review = false`) | n8n writes a `commission_evidences` record containing `extraction_data`, `confidence`, `requires_review = false`, `error_type = null`, and logs `transaction_events` (e.g., `document_parsed_successfully`). | Evidence JSON is the source-of-truth snapshot for audit trail. |
| 4 | Auto approval | n8n promotes evidence data into `transactions.final_*`, sets `status = 'approved'`, `intake_status = 'completed'`, and emits the final update. | No coordinator interaction; dashboard tabs refresh via `refetchTransactions()`. |

**Frontend expectations**
- Coordinator queue listens via Realtime; user never clicks.  
- Tabs continue to rely on polling/`refetchTransactions()` for aggregates even during the demo.  
- Auto-approval logic (the “fake-out”) lives in n8n—it checks `requires_review = false` before promoting data.

**Implementation references**
- Backend Implementation **Phase 1A – Auto-Approval**.  
- Track A (Ethan) checklist items 2–3.

---

## Path B – Manual Verification Path (Production Flow)

**Purpose:** Provide the human-in-the-loop experience when AI confidence drops.

| Step | Status / Intake Status | System Actions | Notes |
| ---- | ---------------------- | -------------- | ----- |
| 1 | Same as Path A | Queue insert surfaced via Realtime. | Hybrid contract identical to Path A. |
| 2 | Extraction returns `requires_review = true` or conflicts | n8n stores the flagged `commission_evidences` record and related `transaction_events` (e.g., `document_requires_review`). | Evidence JSON must include confidence scores / conflict markers. |
| 3 | Workflow pauses → `status = 'needs_review'`, `intake_status = 'completed'` | `transactions.final_*` remain unset; the queue row signals the coordinator to act. | Status naming is all lowercase (`needs_review`) to avoid case-sensitive bugs. |
| 4 | Coordinator opens Verification Modal | UI performs a one-time fetch: latest `commission_evidences` by `transaction_id`, pre-fills form fields, renders confidence badges, loads checklist attachments. | Modal does **not** maintain a realtime listener; fetch-on-open keeps state predictable. |
| 5 | Coordinator edits + submits | Frontend calls a Netlify function/Supabase RPC that writes `transactions.final_*`, updates `status = 'approved'`, creates `transaction_events` (e.g., `submitted_for_approval`), and invokes `refetchTransactions()` to refresh polling consumers. | RLS policies must allow the RPC/Edge Function to perform the write; errors should surface in UI toasts. |

**UI micro-interactions (Path B)**
- Checklist gating: form submit is disabled until required documents are attached.  
- Confidence badges: Green ≥ 90, Yellow 60–89, Red < 60 (thresholds configurable via context).  
- Audit log: transaction events appear immediately in the history panel once the submit succeeds.

**Frontend expectations**
- Queue updates remain realtime; modal performs fetch-on-open.  
- Manual submit path must call shared refresh helper per hybrid contract.  
- After approval, coordinator is navigated back to the queue; the freshly approved row should be visible (validated by smoke test).

**Implementation references**
- Backend Implementation **Phase 1B – Manual Verification**.  
- Track A (Ethan) checklist items 4–6.

---

## Shared Vocabulary & Signals

- `status`: `in_queue` → `in_review` → `approved` (Path A) or `needs_review` → `approved` (Path B).  
- `intake_status`: `pending_processing` → `processing` → `completed`.  
- `commission_evidences.requires_review` determines which path triggers.  
- `transaction_events` record milestones (`document_parsed_successfully`, `submitted_for_approval`, etc.) consumed by the audit log.

> **Naming Convention Reminder**  
> Status values and enums remain lowercase `snake_case` for consistency (`needs_review`, not `Needs Review`). This avoids case-sensitive query bugs and matches existing schema conventions.

---

## Cross-Links

- Phase plans: `docs/backend-implementation.md#phase-1a-auto-approval-happy-path` & `#phase-1b-manual-verification-flow`.  
- Backend responsibilities: `docs/context-track-a-ethan.md`.  
- Dashboard UX overview: `docs/user-journey-overview.md`.
