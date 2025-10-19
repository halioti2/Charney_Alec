# PDF Extraction Journey – Detailed UX

This document expands on the two intake paths described in `docs/parse-pdf-user-journey.md` and links directly to the implementation roadmap (`docs/backend-implementation.md`). It focuses on the coordinator-facing verification modal, required signals, and UX fallbacks.

---

## Path A – Auto-Approval (Backend Implementation Phase 1A)

| Step | Status / Intake Status | System Actions | UI Notes |
| ---- | ---------------------- | -------------- | -------- |
| 1 | `in_queue` / `pending_processing` | n8n upserts the transaction when the email arrives. | Coordinator sees queue row appear instantly via Realtime; no clicks required. |
| 2 | `in_review` / `processing` | OCR + LLM run; progress event emitted. | Queue row shows “In Review…” indicator. |
| 3 | `requires_review = false` | n8n inserts `commission_evidences` snapshot and logs `transaction_events` (`document_parsed_successfully`). | Evidence JSON stored for audit trail; confidence typically ≥ 90. |
| 4 | `approved` / `completed` | n8n promotes evidence → `transactions.final_*`, writes final event. | Tabs refresh through `refetchTransactions()`; modal shows final values if opened post-approval. |

**Demo behavior**  
- Coordinator never opens the modal during Path A.  
- If they do later, the right panel displays locked final values with an informational badge (“Auto-approved at 99% confidence”).  
- No checklist interactions required.

---

## Path B – Manual Verification (Backend Implementation Phase 1B)

1. **Queue Entry** – Coordinator sees `status = needs_review`, `intake_status = completed`.  
2. **Modal Launch** – Clicking **Process** opens the two-panel layout:  
   - `DealSheetViewer.jsx` (left) renders the uploaded PDF and shows “Parsing…” skeleton until content loads.  
   - Right panel is composed of the verification form, confidence badge, compliance checklist, and action footer.
3. **Pre-Populated Fields** – The modal fetches the most recent `commission_evidences` by `transaction_id`; every parsed field is editable so the coordinator can correct AI mistakes.  
4. **Confidence Badge** – Thresholds: green ≥ 90, yellow 60–89, red < 60. Yellow/red states display a warning icon plus helper text (“Low confidence—verify carefully”).  
5. **Compliance Checklist** – Required documents: Deal Sheet, Contract, Invoice, Disclosure. Drag-and-drop uploads flip each item’s status to green; missing items keep the primary button disabled with helper text.  
6. **Submit Flow** – Once checklist is satisfied, the “Submit for Approval” button activates. On click:  
   - Frontend calls the verification RPC/Netlify function (Phase 1B deliverable).  
   - Backend writes `transactions.final_*`, creates `transaction_events` (e.g., `submitted_for_approval`), sets `status = approved`, and returns success.  
   - Modal closes, toast shows “Deal approved successfully,” queue row updates, and `refetchTransactions()` keeps polling tabs fresh.  
7. **Audit Trail** – `transaction_events` feed the audit-log component (see `docs/audit-trail-plan.md`).

---

## UX Edge Cases & Responses

| Scenario | Expected Response | Implementation Link |
| -------- | ----------------- | ------------------- |
| Non-PDF upload attempt | Inline error: “Invalid file type. Please upload a PDF.” File rejected. | Phase 1B upload handler |
| Password-protected/unreadable PDF | Banner: “Unable to read document. Please upload a valid deal sheet.” | Phase 1B modal error state |
| Confidence < 70 | Red badge + warning copy; prompts manual review. | Phase 1B form |
| Coordinator edits AI field | All inputs remain editable; edits persisted with submit payload. | Phase 1B RPC contract |
| Missing checklist docs | Primary button disabled; checklist item displays “Required.” | Phase 1B checklist gating |

---

## Component Map

- **DealSheetViewer.jsx** – Scrollable PDF viewer with loading skeleton.  
- **ConfidenceBadge.jsx** – Renders threshold-based styling and helper text.  
- **Verification form** – Edit-ready fields bound to `commission_evidences.extraction_data`.  
- **ComplianceChecklist.jsx** – Drag-and-drop uploader, status badges, error messaging.  
- **Action footer** – Primary submit, optional cancel; relies on context to trigger `refetchTransactions()`.

See `docs/backend-implementation.md#phase-1b-manual-verification-flow` for the engineering breakdown and the mapping of `broker_agent_name → final_broker_agent_name`.

---

## Future Enhancements (Backlog)

These items were in the legacy journey and remain compatible with the new architecture. They are tracked as post-Phase 1 follow-ups:

| Feature | Description | Suggested Phase |
| ------- | ----------- | --------------- |
| **Parsing animation refinements** | More expressive loading states while OCR runs (progress meter, status copy). | Phase 1A polish |
| **Checklist auto-population** | Auto-detect when required documents arrive via email and pre-attach them. | Future Phase (after 1B) |
| **Broker approval stage** | Optional second-level approval after coordinator submits (would reintroduce `pending_broker_approval`). | Future Phase (post-MVP) |
| **Manual Save Draft** | Allow coordinator to save partially reviewed data without committing final approval. | Future Phase (post-1B) |

---

## References

- Intake paths: `docs/parse-pdf-user-journey.md`  
- Implementation phases: `docs/backend-implementation.md#phase-1a-auto-approval-happy-path` & `#phase-1b-manual-verification-flow`  
- Backend ownership: `docs/context-track-a-ethan.md`  
- Audit log behavior: `docs/audit-trail-plan.md`
