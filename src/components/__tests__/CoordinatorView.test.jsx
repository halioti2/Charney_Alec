import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import CoordinatorView from '../CoordinatorView.jsx';
import { DashboardProvider } from '../../context/DashboardContext.jsx';

const sampleCommissions = [
  {
    id: 'Q1',
    broker: 'Agent Alpha',
    property: '123 Main St',
    salePrice: 500000,
    grossCommissionRate: 2.5,
    referralFeePct: 0,
    status: 'Needs Review',
    conflict: true,
  },
  {
    id: 'Q2',
    broker: 'Agent Beta',
    property: 'The Dime',
    salePrice: 750000,
    grossCommissionRate: 3,
    referralFeePct: 10,
    status: 'Awaiting Info',
    conflict: false,
  },
  {
    id: 'Q3',
    broker: 'Agent Gamma',
    property: '53 Broadway',
    salePrice: 600000,
    grossCommissionRate: 2,
    referralFeePct: 0,
    status: 'Approved',
    conflict: false,
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
  'Agent Gamma': {
    primarySplit: { agent: 75, brokerage: 25 },
    commissionCap: 22000,
    currentTowardsCap: 8000,
    deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
  },
};

const renderCoordinator = () =>
  render(
    <DashboardProvider
      initialState={{
        commissions: sampleCommissions,
        agentPlans: sampleAgentPlans,
        theme: 'light',
      }}
    >
      <CoordinatorView hidden={false} />
    </DashboardProvider>,
  );

describe('CoordinatorView', () => {
  it('summarises focus metrics from commission data', () => {
    renderCoordinator();
    const focus = screen.getByTestId('focus-summary');
    expect(within(focus).getByTestId('focus-new').textContent).toContain('1');
    expect(within(focus).getByTestId('focus-awaiting').textContent).toContain('1');
    expect(within(focus).getByTestId('focus-attention').textContent).toContain('1');
  });

  it('renders commission queue table rows', () => {
    renderCoordinator();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(4);
    const secondRow = rows[2];
    expect(within(secondRow).getByText('Agent Beta')).toBeInTheDocument();
    expect(within(secondRow).getByText('The Dime')).toBeInTheDocument();
    expect(within(secondRow).getByText(/Awaiting Info/i)).toBeInTheDocument();
  });

  it('displays journey progress based on agent plans', () => {
    renderCoordinator();
    expect(screen.getByTestId('journey-remaining').textContent).toMatch(/\$?/);
  });
});
