User Journey 3: COMMISSIONS


Persona: Andrew Epstein, CDO / Broker
Goal: I want to track each agent’s total deal volume and gross commission income over customizable periods to gain better performance insight and make informed management decisions.
"Happy Path" Steps:
The Broker logs into Clarity and sees the main "Broker View."
They navigate to the "Agent Performance" section of the dashboard.
They use a date-range picker or dropdown to select a custom time period (e.g., "Last 90 Days," "YTD").
The Agent Performance table automatically updates, showing the stats for only that selected period.
The Broker can sort the table by columns like "Total Deal Volume" or "GCI" to quickly identify top performers or agents who may need coaching.
Clicking on an agent's name could lead to a more detailed breakdown of their deals within that period.
Key Data Fields on the "Commissions Dashboard" Screen:
Agent Name
Total Deal Volume (for the selected period)
Gross Commission Income (GCI) (for the selected period)
Average Deal Time
A calculated performance "Score"
"Parking Lot" (Post-MVP Ideas):
The brokerage’s long-term goal is to integrate all technology systems into a single hub for a unified view of property analytics, client management, and commission tracking.


The information is posted below for a clear view :’)




Edge Cases and System Responses
Edge Case / Scenario
System Response / Expected Behavior
Business Implication / Action Required
No Data for Selected Period
The "Agent Performance" table displays a clear message: "No closed deals found for this time period." Totals (Deal Volume, GCI) show $0.
Indicates an agent or the entire brokerage had a slow period. Andrew needs to use the period filter to check a wider timeframe or investigate agent pipeline/activity.
Agent Name Click Yields No Deals
When the Broker clicks an Agent Name, the drill-down view displays a message: "No detailed deal information found for this agent in the selected period."
Confirms that the agent has no closed deals within that specific time frame, even if their GCI is >0 (e.g., from a prior period adjustment).
Data Latency / Data Stale
A banner or timestamp clearly displays: "Data last updated: [Date] at [Time] UTC. Real-time update in progress..."
Andrew knows the data isn't current. He may need to pause a decision or wait for the update to ensure accuracy before crucial coaching or financial decisions.
Commission Clawback/Adjustment
The GCI and "Score" calculation must account for negative adjustments (e.g., a deal fell through after commission was provisionally recorded). GCI value may be temporarily negative or lower than expected.
Requires the system to process both positive and negative financial transactions correctly. Andrew needs to review the underlying deal details to understand the adjustment.
Agent Left the Brokerage
The agent still appears in the historical data for the selected period but is flagged with an icon or note (e.g., "(Inactive)").
Ensures Andrew can still analyze the historical performance of the position they filled and their contribution to past revenue.
Very Large Data Range Selected
The system either loads the data with a progress indicator or displays a message: "Data is loading, this large query may take a moment." (Or, as an extreme measure: "Please select a smaller date range for initial loading.")
Prevents the UI from freezing. Manages user expectation regarding load times for "All Time" or multi-year reports.


Key Data Fields and Documents Required
These represent the upstream data needed to power the dashboard and the core documents that validate the figures.
Data Point Category
Key Data Field Needed (Upstream)
Source Document / System of Record
Agent / Identity
Unique Agent ID, Agent Status (Active/Inactive), Team/Manager Assignment.
HRIS (Human Resources Information System) or Agent Roster Management System.
Transaction Details
Deal ID, Transaction Close Date, Contract/Sale Price, Property Type.
CRM (Client Relationship Management) or Transaction Management System (TMS).
Financial Calculations
Total Commission Earned (Brokerage side), Commission Split Percentage (Agent/Brokerage), Gross Commission Income (GCI) for the Brokerage.
Accounting System (e.g., QuickBooks, ERP) or dedicated Commission Management Software.
Performance Metrics
Deal Start Date (e.g., Listing/Tenant Agreement Date).
Transaction Management System (TMS) to calculate Average Deal Time.
The "Score"
The defined algorithm/formula used to calculate the performance metric.
Internal business logic/rules engine (must be documented and auditable).


UI/UX & Component Scope: The Commissions Dashboard
Component / Section
Details / Functionality
UI/UX Considerations
Main Header
"Agent Performance" Title.
Clear, high-level navigation. Should include the Broker's name/persona (Andrew Epstein) for personalization.
Date Range Selector
Dropdown/Picker: Must allow selection of common presets (e.g., "This Month," "Last 90 Days," "YTD") and a custom date-range picker (Start Date, End Date).
Prominently placed, intuitive to use, and clearly indicates the currently selected period (e.g., "Showing performance from 01/01/2025 – 09/30/2025").
Agent Performance Table
Primary data display, listing all agents.
Sortable Columns: All key data fields (Volume, GCI, Score) must be sortable ascending/descending. Clickable: Agent Name column must be a hyperlink to the drill-down view.
Table Data Display
Displays the Key Data Fields for the selected period.
Formatting: GCI and Deal Volume must be formatted as currency (e.g., $1,234,567). Average Deal Time as days (e.g., 92 days). "Score" as a number or percentage.
Summary Card (Optional MVP)
Displays the Brokerage Total GCI and Brokerage Total Deal Volume for the selected period.
Placed above the table for immediate, top-level context (e.g., "Brokerage Total GCI: $X,XXX,XXX").
"Drill-Down" View (Agent Name Click)
A secondary page/modal showing a list of specific deals closed by the agent within the selected period.
Details should include: Deal ID, Client Name, Sale Price, Brokerage Commission, and Agent's Split. Must include a clear "Back to Agent Performance" button.

I posted the MVC structure so it’ll be easier on you Ethan :)

Commissions Dashboard (User Journey 3) - MVC Structure
1. Model: Key Data Fields and Documents Required
The Model defines the data structure and business logic. In a modern architecture, this is the API response structure and the logic on the server/client for calculating metrics.
Data Structure / Entity
Key Data Fields (API Response Structure)
Source System / Document (Backing Model)
Agent Performance (GET /agents/performance?period=...)
agentId, agentName, totalDealVolume (Currency), grossCommissionIncome (Currency), averageDealTime (Days), calculatedScore (Numeric/Percentage), isActive (Boolean)
Aggregated data from TMS, Accounting, and internal business logic.
Brokerage Summary (GET /brokerage/summary?period=...)
totalBrokerageGCI (Currency), totalBrokerageVolume (Currency), dataUpdatedTimestamp
Aggregated data for the top-level view.
Detailed Agent Deal (GET /agents/{id}/deals?period=...)
dealId, clientName, salePrice (Currency), brokerageCommission (Currency), agentSplitPercentage (Percentage), dealCloseDate, dealStatus
Transaction Management System (TMS) data.
Time Period Filters
filterPresets (e.g., ["Last 90 Days", "YTD", "Last Year"]), defaultPeriod
Configuration settings (internal model config).

Export to Sheets
2. Controller: Application Logic and Data Management
The Controller is responsible for handling user input, managing state, and instructing the Model (API calls) and the View (component state updates). In React, this role is often shared by State Management (Context/Redux) and Custom Hooks.
Controller Function / Component Logic
Action Trigger / User Input
Model Interaction
Data Fetch Hook (useAgentPerformance)
Initial component load, Date Range Selector change.
Calls GET /agents/performance and GET /brokerage/summary with the selected period.
Sorting Handler
Clicking a table header (e.g., "GCI").
Receives data from the Model and locally sorts the array of agents before updating the table's state.
Agent Detail Navigation Handler
Clicking the Agent Name in the table.
Navigates the user to a new route (/commissions/agent/{id}) and triggers a GET /agents/{id}/deals call for the detail view.
Error/Edge Case Handler
API returns a 404/500, or the data array is empty.
Sets an error state (errorState: true) or a "No Data" state, prompting the View to display the appropriate message.

Export to Sheets
3. View: UI/UX & Component Scope (React Components)
The View is the user interface, built using functional React components. Each component receives data via props or hooks and renders the specific UI elements.
A. Main Broker View (<CommissionsDashboard />)
This is the main component rendering the entire page. It manages the current date range state.
Component Name
Role / Purpose
Data Needed (via Props/Hooks)
<BrokerageSummaryCard />
Displays the top-level performance metrics for the selected period.
totalBrokerageGCI, totalBrokerageVolume, dataUpdatedTimestamp
<DateRangeSelector />
Allows the user to select the time period.
filterPresets, currentPeriod (Prop drilling/Context to update the parent state).
<AgentPerformanceTable />
Renders the primary table of agents and their metrics.
agentPerformanceData (Array of Agent Performance objects), sortColumn, sortDirection
<NoDataState />
Displays when no results are found.
None, controlled by a conditional rendering flag (e.g., if (data.length === 0)).

Export to Sheets
B. Agent Performance Table Components
These components handle the rendering and interaction within the table.
Component Name
Role / Purpose
Data Needed (via Props/Hooks)
<AgentPerformanceRow />
Renders a single row of agent data.
agentId, agentName, totalDealVolume, grossCommissionIncome, averageDealTime, calculatedScore, onAgentClick
<SortableTableHeader />
Handles the column headers and sorting icons.
columnKey, currentSortKey, currentSortDirection, onSortChange (to update the Controller/State).

Export to Sheets
C. Agent Detail View (<AgentDetailsView />)
This is the secondary view accessed by clicking an agent's name.
Component Name
Role / Purpose
Data Needed (via Props/Hooks)
<AgentHeader />
Displays the agent's name and high-level stats for the period.
agentName, grossCommissionIncome, totalDealVolume
<DealsTable />
Lists all individual deals contributing to the agent's stats.
detailedAgentDeals (Array of Detailed Agent Deal objects).
<BackButton />
Returns the user to the main CommissionsDashboard view.
onClick handler for navigation.