# Pain Points → Feature Coverage

| Pain Point | PDF Extractor UI (Ashley) | Payments UI (Erica) | Commission Viz UI (Rad) |
| --- | --- | --- | --- |
| Email process is slow / manual parsing | Upload + parsing modal replaces email scraping; drag/drop attachments stored centrally | — | — |
| No automation for deal sheet extraction | OCR + LLM auto-populate fields with confidence badge | — | — |
| No central payout source of truth | Parsed records + required docs stored together | Payout queue/history with statuses and transaction refs | Dashboard consumes payout status for trends |
| Manual split overrides/in-house edge cases | Editable fields + compliance checklist capture override docs | Manual override flag before scheduling payout | Drill-down highlights adjustments/clawbacks |
| Payout requests before GCI confirmed | Intake captures expected GCI for reconciliation | Queue only shows ready items once bank match exists | Visual timeline distinguishes pending vs closed |
| Missing audit trail / confidence | Confidence badge + low-score warnings, document checklist | Confirmation modal + history log of payouts | Data freshness banners, adjustment audit trail |
| Difficult to monitor agent performance | — | — | Date filters, sortable metrics, stalled-deal markers, inactive labels |
| Need to prevent duplicate/erroneous payouts | Checklist enforces doc completeness | Batch validation, zero/negative guardrails, ACH failure handling, transaction hashes | Dashboard flags inconsistencies for review |

Legend: “—” indicates the track does not directly address that pain point; optional Phase 2 features (e.g., auto ACH) are included where relevant.
