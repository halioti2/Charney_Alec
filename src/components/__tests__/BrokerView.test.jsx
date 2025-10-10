import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import BrokerMetrics from '../BrokerMetrics.jsx';
import AgentPerformanceTable from '../AgentPerformanceTable.jsx';
import CommissionForecast from '../CommissionForecast.jsx';
import MarketPulseTicker from '../MarketPulseTicker.jsx';
import MarketAlerts from '../MarketAlerts.jsx';
import { DashboardProvider } from '../../context/DashboardContext.jsx';

const sampleCommissions = [
  {
    id: 'C1',
    broker: 'Agent Alpha',
    email: 'alpha@example.com',
    salePrice: 1_000_000,
    grossCommissionRate: 2.5,
    referralFeePct: 0,
    dealTime: 6,
    accuracy: 95,
    score: 92,
    status: 'Approved',
    disclosureViewed: true,
  },
  {
    id: 'C2',
    broker: 'Agent Beta',
    email: 'beta@example.com',
    salePrice: 500_000,
    grossCommissionRate: 3,
    referralFeePct: 10,
    dealTime: 8,
    accuracy: 90,
    score: 88,
    status: 'Needs Review',
    disclosureViewed: false,
  },
  {
    id: 'C3',
    broker: 'Agent Alpha',
    email: 'alpha@example.com',
    salePrice: 750_000,
    grossCommissionRate: 2,
    referralFeePct: 0,
    dealTime: 5,
    accuracy: 98,
    score: 94,
    status: 'Paid',
    disclosureViewed: true,
  },
];

const sampleAgentPlans = {
  'Agent Alpha': {
    primarySplit: { agent: 70, brokerage: 30 },
    commissionCap: 20000,
    currentTowardsCap: 15000,
    deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
  },
  'Agent Beta': {
    primarySplit: { agent: 65, brokerage: 35 },
    commissionCap: 18000,
    currentTowardsCap: 9000,
    deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
  },
};

const sampleMarketData = [
  { symbol: 'DJI', price: 35000, openPrice: 34800, change: 200, dir: 'up' },
  { symbol: 'S&P 500', price: 4400, openPrice: 4350, change: 50, dir: 'up', alertThreshold: 0.5 },
  { symbol: 'NASDAQ', price: 13800, openPrice: 14000, change: -200, dir: 'down', alertThreshold: 0.6 },
];

const renderWithProvider = (ui) =>
  render(
    <DashboardProvider
      initialState={{
        commissions: sampleCommissions,
        agentPlans: sampleAgentPlans,
        marketData: sampleMarketData,
        theme: 'light',
      }}
    >
      {ui}
    </DashboardProvider>,
  );

describe('Broker view components', () => {
  it('renders computed broker metrics', () => {
    renderWithProvider(<BrokerMetrics />);
    expect(screen.getByText('$55,000.00')).toBeInTheDocument(); // total GCI
    expect(screen.getByText('3')).toBeInTheDocument(); // leases signed
    expect(screen.getByText('2.5%')).toBeInTheDocument(); // average commission rate
    expect(screen.getByText('2')).toBeInTheDocument(); // active agents
  });

  it('renders agent performance table with disclosure states', () => {
    renderWithProvider(<AgentPerformanceTable />);
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4); // header + 3 rows
    const firstDataRow = rows[1];
    expect(within(firstDataRow).getByText('Agent Alpha')).toBeInTheDocument();
    expect(screen.getByText(/Needs Viewing/i)).toBeInTheDocument();
  });

  it('renders commission forecast summary', () => {
    renderWithProvider(<CommissionForecast />);
    expect(screen.getByText(/Projected Monthly Commission/i)).toBeInTheDocument();
    expect(screen.getByText('$4,583.33')).toBeInTheDocument();
  });

  it('renders ticker items for market pulse', () => {
    renderWithProvider(<MarketPulseTicker />);
    expect(screen.getByText(/DJI/)).toBeInTheDocument();
    expect(screen.getByText(/S&P 500/)).toBeInTheDocument();
    expect(screen.getByText(/NASDAQ/)).toBeInTheDocument();
  });

  it('shows market alerts when thresholds exceeded', () => {
    renderWithProvider(<MarketAlerts />);
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });
});
