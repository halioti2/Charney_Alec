---

project: Commission Dashboard Revamp
author: Ethan (CDO)
last_updated: 2025-10-12
related_docs: PDF Extractor UI (Ashley), Payment UI (Erica), Commission Viz UI (Rad)
------------------------------------------------------------------------------------

# Commission Dashboard (LLM-Friendly Format)

---

## 🧾 Glossary of Key Terms

| Term               | Definition                                                      |
| ------------------ | --------------------------------------------------------------- |
| `GCI`              | Gross Commission Income — total commission earned on a deal     |
| `ACP`              | Agent Commission Payout — portion of GCI paid to the agent      |
| `in-house listing` | A property listing directly sourced by the brokerage            |
| `deal sheet`       | Summary file (usually Excel or PDF) outlining transaction terms |
| `disclosure form`  | NYC-required agent-client representation declaration            |

---

## 📍 Current Workflow

### Swimlane: Current State

| Actor        | Action                              | Data                       | Tool              |
| ------------ | ----------------------------------- | -------------------------- | ----------------- |
| Agent/Broker | Sends email with commission request | Address, sale price, split | Email             |
| CDO          | Manually parses details from email  | Unstructured PDF/email     | Manual / PDF      |
| Accountant   | Verifies if commission was received | Bank transaction           | Bank dashboard    |
| Accountant   | Confirms split is accurate          | Deal history / QB entries  | QuickBooks        |
| Accountant   | Sends payout via ACH                | Verified GCI + ACP         | Bank (manual ACH) |

### 📝 Steps (Current Flow)

1. Broker sends an email to `charneydeals@` with address, sale price, proposed split.
2. Ethan or the accountant manually extracts relevant deal fields.
3. Accountant checks whether seller payment (`GCI`) has been received.
4. If matched, `ACP` is approved and ACH is initiated manually.
5. Payout is logged in QuickBooks for record-keeping.
6. If GCI is not yet received, ACP is deferred until verification.

---

## ⚠️ Pain Points

* [ ] Email-driven process is error-prone and slow
* [ ] No automation for field extraction from `deal sheet`
* [ ] No central source of truth for matched payouts
* [ ] Manual checks required for split overrides (e.g., `in-house listing`, referral)
* [ ] Agents sometimes request payouts before GCI is confirmed
* [ ] No confidence scores or audit trail on data source verifications

---

## 🎯 Target Workflow

### Swimlane: Proposed Flow

| Actor         | Action                                 | Data Extracted           | Tool                  |
| ------------- | -------------------------------------- | ------------------------ | --------------------- |
| Agent/Broker  | Uploads `deal sheet` / structured form | Address, GCI, ACP, split | Dashboard (PDF UI)    |
| LLM Extractor | Auto-extracts fields from PDF/Excel    | High-confidence metadata | OCR + LLM + UI        |
| CDO           | Flags low-confidence extractions       | Confidence scores        | Backend audit queue   |
| Accountant    | Verifies bank receipt of GCI           | ACH record               | Bank / QB API         |
| Agent         | Gets approval notification             | ACP amount + timestamp   | Dashboard / Email     |
| System        | Logs payout and syncs to dashboard     | GCI, ACP                 | QuickBooks / Internal |

### 🧭 Steps (Target Flow)

1. Agent uploads `deal sheet` or fills web form (Excel/PDF input).
2. LLM + OCR extract all necessary fields with confidence scoring.
3. Backend stores verified entries; low-confidence fields are flagged for review.
4. System checks if `GCI` is received in bank via integration or proxy.
5. Once matched, system triggers `ACP` notification to agent.
6. Payout logged in QuickBooks and visualized on the dashboard.

---

## ✅ Key Requirements

### PDF Field Extraction

* [ ] Auto-parse `deal sheet` with OCR and fallback to LLM
* [ ] Flag low-confidence fields for human-in-the-loop audit
* [ ] Map extracted fields to unified data schema
* [ ] Allow coordinators to edit parsed fields directly in the verification form
* [ ] Display confidence badge states (green/yellow/red) with inline warnings for low scores
* [ ] Enforce compliance checklist completion (deal sheet, contract, invoice, disclosure) before submission
* [ ] Support drag-and-drop uploads and store attached documents alongside the parsed record

### Commission Visualization

* [ ] Dashboard view per `agent`
* [ ] Track `GCI`, `ACP`, transaction volume, pipeline flow
* [ ] Visualize stalled deals (contract, inspection, etc.)
* [ ] Time filter support: last 6M, YTD, quarterly
* [ ] Provide sortable metrics and drill-down agent detail views
* [ ] Indicate inactive agents and display data freshness timestamps
* [ ] Handle clawbacks or negative adjustments so GCI reflects true revenue

### Payment Flow (UI only)

* [ ] Manual override for referral splits
* [ ] Match `GCI` record in bank to `ACP` payout request
* [ ] Trigger ACH (Square, Plaid, or proxy)
* [ ] Prevent double-payment via transaction hash
* [ ] Show payout queue with batch selection and running totals
* [ ] Disable scheduling when bank info or payout amount is invalid
* [ ] Provide confirmation modal and success toast after scheduling
* [ ] Maintain payment history tab with status updates and audit log

## Payment Flow (Phase 2)
* [ ] Manual override for referral splits
* [ ] Match `GCI` record in bank to `ACP` payout request
* [ ] Trigger ACH (Square, Plaid, or proxy)
* [ ] Prevent double-payment via transaction hash
* [ ] Optional automated ACH toggle with provider integration and failure handling
* [ ] Surface ACH transaction references and failure notifications in history
---

## 🔗 Track Feature Cross-Reference

- **PDF Extractor UI (Ashley):** Dual-panel verification modal, confidence badge states, editable fields, compliance checklist with drag/drop uploads, error messaging for invalid files or low confidence results.
- **Payment UI (Erica):** Payout queue/history tabs, batch selection with totals, confirmation modal, missing-bank-info guardrails, optional automated ACH flow with provider references and failure notifications.
- **Commission Viz UI (Rad):** Date-range picker + presets, sortable performance table, agent drill-down route, inactive-agent indicators, data freshness banner, stalled-deal markers, clawback handling.

---

## 🔍 Assumptions & Open Questions

### Team Roles

* [ ] Is there a `broker` vs `agent` structure at Charney that needs distinct dashboards?
* [ ] Are team splits or overrides negotiated individually?

### Data Sources

* [ ] Can we access QuickBooks via API or CSV dump for historical matching?
* [ ] Where are deal sheets currently stored after email? Local drive or cloud?
* [ ] Is bank account ACH data accessible via Plaid or similar proxy?

### Legal & Compliance

* [ ] NYC `disclosure forms` required for every deal?
* [ ] Can we enforce this in the dashboard submission step?
