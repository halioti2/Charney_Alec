# Implementation Plan: Commission Visualization Dashboard

This document outlines the technical plan for building the new Commission Visualization Dashboard, based on the user journey defined in `docs/commission-dashboard-user-journey.md`.

## 1. Project Setup

*   **Charting Library:** We will install and configure `recharts` for creating the data visualizations. It's a composable charting library built on React components.
    *   **Command:** `npm install recharts`

## 2. Mock Data Structure

We will create a mock data file (`src/mocks/dashboardMockData.js`) to simulate the API response. This will allow us to build and test the UI components independently of the backend.

```javascript
// src/mocks/dashboardMockData.js

export const agents = [
  {
    id: 1,
    name: 'John Doe',
    deals: [
      { id: 101, stage: 'Closed', closeDate: '2025-09-15', value: 500000, gci: 15000 },
      { id: 102, stage: 'Contract', value: 750000, gci: 22500 },
      { id: 103, stage: 'Active', value: 600000, gci: 18000 },
    ],
  },
  // ... more agents
];

export const brokerageData = {
  // Aggregated data for the whole brokerage
};
```

## 3. Component Breakdown

We will build a new set of components for this dashboard.

*   **`pages/CommissionDashboardV2.jsx`**: The main page component that will fetch and manage the state for the dashboard.
*   **`components/dashboard/DashboardHeader.jsx`**: A new header component that includes the page title and the `DateRangeSelector`.
*   **`components/dashboard/KeyMetricsGrid.jsx`**: A grid displaying key performance indicators (KPIs) like "Total GCI," "Total Deal Volume," and "Average Time-to-Close" in visually distinct cards.
*   **`components/dashboard/RevenueChart.jsx`**: A line or bar chart visualizing GCI and Agent Payout trends over time.
*   **`components/dashboard/AgentComparisonChart.jsx`**: A bar chart comparing agents based on key metrics (GCI, Deal Volume, or Transaction Count).
*   **`components/dashboard/DealPipelineFunnel.jsx`**: A funnel chart showing the distribution of deals across different stages of the pipeline.
*   **`components/dashboard/AgentPerformanceTable.jsx`**: We will adapt the existing table to fit the new design and data structure.

## 4. Phased Development Plan

### Phase 1: Setup and Scaffolding (Current Focus)

1.  **Install Dependencies:** Add `recharts` to the project.
2.  **Create Mock Data:** Implement the mock data file.
3.  **Component Shells:** Create empty files for all the new components listed above.
4.  **New Dashboard Page:** Create `CommissionDashboardV2.jsx` and render the component shells.

### Phase 2: Static Component Build

1.  **Build Key Metrics Grid:** Develop the `KeyMetricsGrid` component and populate it with static data from the mock file.
2.  **Build Charts:** Implement the `RevenueChart`, `AgentComparisonChart`, and `DealPipelineFunnel` components, rendering them with mock data.
3.  **Update Table:** Modify the `AgentPerformanceTable` to consume the new mock data structure.

### Phase 3: Interactivity

1.  **Date Range Filtering:** Connect the `DateRangeSelector` to filter the mock data and update all components on the dashboard.
2.  **Agent Drill-Down:** Implement the logic to select an agent from the table or chart, which will then update the dashboard to show only that agent's data.

### Phase 4: Styling and Refinement

1.  **CSS Styling:** Apply styles to all new components to ensure a polished and professional look.
2.  **Responsiveness:** Ensure the dashboard is usable on different screen sizes.
3.  **Code Cleanup:** Refactor and clean up the code before moving on to backend integration.
