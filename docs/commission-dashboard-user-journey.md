# User Journey: Commission Visualization Dashboard

## 1. Persona & Goal

*   **Persona:** Brokerage Manager / CDO
*   **Primary Goal:** To gain a clear, visual understanding of agent performance, deal flow, and revenue contribution over customizable time periods to make informed management and financial decisions.

## 2. Core User Flow

1.  The manager logs in and navigates to the "Commissions Dashboard".
2.  They are presented with a high-level overview of the brokerage's performance for a default time period (e.g., "Last 90 Days").
3.  The manager uses a date-range selector to analyze performance over different periods (monthly, quarterly, YTD, custom).
4.  The dashboard updates dynamically, showing charts and key metrics for the selected period.
5.  The manager can select a specific agent to drill down into their individual performance, viewing detailed charts and deal pipelines.

## 3. Key Metrics & Visualizations

The dashboard will focus on visualizing the following key areas for both the brokerage and individual agents.

### A. Revenue & Commissions

*   **Gross Commission Income (GCI):** Total revenue generated.
*   **Agent Payout:** The portion of GCI paid to the agent.
*   **Key Calculation:** `Agent Payout = GCI * 0.5`
*   **Visualization:** A time-series line or bar chart showing GCI and Agent Payout trends over the selected period.

### B. Deal Volume

*   **Definition:** The total dollar value of all transactions an agent has completed.
*   **Purpose:** Measures an agent's contribution in terms of property value.
*   **Visualization:** A bar chart comparing deal volume across agents. For an individual agent, a chart showing their deal volume trend over time.

### C. Transaction Count & Efficiency

*   **Definition:** The total number of transactions an agent has closed.
*   **Purpose:** Shows agent activity level and experience.
*   **Visualization:** A simple KPI card showing "Total Transactions" for the period. A bar chart comparing transaction counts across agents.

### D. Deal Flow & Pipeline

*   **Definition:** The rate and timing of deals moving through the sales pipeline.
*   **Metrics to Track:**
    *   Number of deals in progress.
    *   Average time-to-close (in days).
    *   Deals by stage (e.g., Lead, Active, Contract, Closed).
*   **Visualization:** A funnel chart or stacked bar chart showing where deals are in the pipeline. A KPI card for "Average Time-to-Close".

## 4. Dashboard Structure

*   **Single View:** A unified dashboard that provides both a brokerage overview and the ability to drill down into individual agent performance.
*   **Comparison:** The main view should make it easy to compare agents across key metrics (GCI, Deal Volume, Transaction Count).
*   **Variable Timescale:** A prominent date-range selector is essential.

## 5. Implementation Notes

*   **Frontend First:** The initial build will focus on creating the UI components with mock data. Backend integration will be a separate phase.
*   **Charts:** We will use a charting library (e.g., Recharts, Chart.js) to create interactive visualizations.
