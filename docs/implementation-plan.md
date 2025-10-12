# Implementation Plan: Tracks A/B/C

This plan splits work across three tracks:

- **Track A** – PDF audit workflow (backend + verification modal UI, led by Ethan + Ashley)
- **Track B** – Payments dashboard UI (batch payouts, optional ACH) led by Erica
- **Track C** – Commission visualization dashboards (agent performance views) led by Rad

---

## Weekend 1 — Alignment, Design & Foundations

### Saturday, Oct 11 (10am–4pm) – Hackathon Day
- **Team (Tracks A, B, C)**  
  - Sprint kickoff & alignment meeting using user-journey template.  
  - Produce final user journeys for:
    - **Priority:** PDF audit flow (upload & email intake).  
    - Payments dashboard.  
    - Commission dashboard.  
  - Deliverable: completed user-journey documents for each flow.

### Saturday Night – Ethan
- Merge individual journeys into a shared context doc for LLM support.  
- Deliverable: consolidated user-journey reference.

### Sunday, Oct 12 (10am–4pm)
- **Track A (Ashley + Ethan)**  
  - Build static PDF verification modal components (`DealSheetViewer`, editable form, confidence badge, compliance checklist).  
  - Deliverable: PDF audit UI scaffold that matches the PDF journey.
- **Track B (Erica)**  
  - Implement static Payments dashboard (payout queue table with checkboxes, running total summary, confirmation modal, success toast, payment history tab, ACH toggle state).  
  - Add a top-level "Payments" tab alongside Broker/Coordinator within `DashboardHeader`, ensuring routes/state are scoped to the tab.  
  - Deliverable: static Payments UI ready for wiring.
- **Track C (Rad)**  
  - Construct static Commission visualization screens (date-range selector, sortable Agent Performance table, drill-down detail view, no-data states, data freshness banner).  
  - Add a top-level "Commission Tracker" tab; isolate components so the tab owns its own state providers and does not interfere with other views.  
  - Deliverable: static Commission dashboards ready for data binding.
- **Ethan (backend prep)**  
  - Draft PDF workflow technical plan (OCR choice, n8n steps) and define golden-document test suite with logging sheet.  
  - Deliverables: technical plan + accuracy test plan.

---

## Week 1 — Parallel Development

### Mon 13 + Tue 14 (6:30pm–10pm)
- **Ethan (Track A)**  
  - Build n8n workflow (OCR node, extractor, gatekeeper, Supabase writes).  
  - Run first accuracy tests with golden set.  
  - Deliverable: functional backend saving to Supabase evidence tables.
- **Ashley (Track A UI)**  
  - Finish static PDF UI polish; coordinate with Ethan on webhook endpoints.
- **Erica & Rad (Track B)**  
  - Complete static Payments dashboard UI (ensure ACH toggle interactions + error states from journey).  
  - Deliverable: ready-for-data Payments UI.
- **Rad (Track C)**  
  - Continue Commission visualization build-out (agent detail route, stalled-deal indicators, inactive tags).  
  - Deliverable: ready-for-data Commission UI.

### Wednesday, Oct 15 (6:30pm–10pm)
- **Ethan + Frontend Designer (Track A)**  
  - Integrate PDF upload UI with n8n webhook; handle confidence + checklist states.  
  - Continue Payments refinement (hook in notifications triggers).  
  - Deliverable: working PDF audit flow via UI.
- **Team (Tracks B & C)**  
  - Shift focus to Commission dashboard if behind; otherwise begin wiring Payments UI to mock data.

---

## Week 2 — Integration & Presentation Prep

### Thursday, Oct 16 – Pursuit Presentation Checkpoint
- Milestone: demonstrate working PDF prototype + static dashboards.

### Sat 18 & Sun 19 (10am–4pm)
- **Saturday Goal**
  - **Track B (Erica):** connect Payments dashboard to Supabase / mock API, include ACH validation + failure flags.  
  - **Track C (Rad):** hook Commission dashboards to Supabase aggregates, implement drill-down API, stalled-deal logic.  
  - **Ethan + Frontend Designer (Track A):** refine PDF workflow, fix verification UI, target feature-complete MVP.
- **Sunday Goal**
  - Full-team end-to-end testing across all features.  
  - Compile bug/UX polish list.  
  - Begin presentation prep (slide deck + demo outline).

### Monday, Oct 20 – Presentation Rehearsal
- Team focus shifts entirely to Demo Day prep.  
- Deliverable: polished slides + rehearsed demo script.

### Tuesday, Oct 21 (6:30pm–10pm) – Queens Tech Demo
- Dry run with realistic conditions; capture final tweaks.

### Wednesday, Oct 22 – Demo Day
- Final presentation & live demo.

---

## Upcoming Deliverables Summary

| Date | Track | Deliverable |
| ---- | ----- | ----------- |
| Oct 11 | Team | Final user journeys (PDF, Payments, Commission) |
| Oct 11 night | Ethan | Shared context doc |
| Oct 12 | Track A | PDF audit UI + technical/test plans |
| Oct 12 | Track B (Erica) | Static Payments dashboard |
| Oct 12 | Track C (Rad) | Static Commission dashboards |
| Oct 13-14 | Track A | n8n workflow + initial accuracy run |
| Oct 13-14 | Track B | Static Payments UI completion |
| Oct 13-14 | Track C | Static Commission UI completion |
| Oct 15 | Track A | Integrated PDF audit feature |
| Oct 16 | All | Pursuit Presentation (working PDF + static dashboards) |
| Oct 18-19 | Track A | PDF MVP polish + accuracy fixes |
| Oct 18-19 | Track B | Payments dashboard wired to data |
| Oct 18-19 | Track C | Commission dashboard wired to data |
| Oct 18-19 | All | End-to-end testing & presentation prep |
| Oct 20 | All | Deck + demo rehearsal |
| Oct 21 | All | Queens Tech demo run |
| Oct 22 | All | Demo Day |

---

## Daily Sync & Integration Rhythm
- **Morning async check-in:** post branch status and blockers in the team channel.  
- **Evening merge window (9–10pm):** each track rebases from `main`, runs feature tests, and pushes updates.  
- Use `integration/<date>` branch for combined testing when multiple tracks need to validate cross-feature flow before merging to `main`.  
- Flag schema or contract changes in the channel before merging to avoid surprise migrations.
