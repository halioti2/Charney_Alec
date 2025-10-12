import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BrokerDetailPanel from '../BrokerDetailPanel.jsx';
import { DashboardProvider } from '../../context/DashboardContext.jsx';
import { ToastProvider } from '../../context/ToastContext.jsx';

const commission = {
  id: 'C1',
  broker: 'Agent Alpha',
  email: 'alpha@example.com',
  status: 'Needs Review',
  score: 88,
  property: '123 Main St',
  salePrice: 500000,
  grossCommissionRate: 2.5,
  referralFeePct: 10,
  auditTrail: [
    { id: 'e1', category: 'Approval', actor: 'Broker', action: 'Final approval by Broker.', time: '1 hour ago' },
  ],
};

const initialPlans = {
  'Agent Alpha': {
    primarySplit: { agent: 70, brokerage: 30 },
    commissionCap: 20000,
    currentTowardsCap: 12000,
    deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
  },
};

describe('BrokerDetailPanel', () => {
const renderPanel = (initialTab) =>
  render(
    <ToastProvider>
      <DashboardProvider initialState={{ commissions: [commission], agentPlans: initialPlans }}>
        <BrokerDetailPanel commission={commission} onClose={() => {}} initialTab={initialTab} />
      </DashboardProvider>
    </ToastProvider>,
  );

  it('renders agent summary and audit history by default', () => {
    renderPanel('history');
    expect(screen.getByText(/Agent Alpha/i)).toBeInTheDocument();
    expect(screen.getByText(/Final approval by Broker/i)).toBeInTheDocument();
  });

  it('shows plan inputs when switching to plan tab', () => {
    renderPanel('plan');
    expect(screen.getByLabelText(/Agent Split/i)).toHaveValue(70);
    expect(screen.getByLabelText(/Commission Cap/i)).toHaveValue(20000);
  });
});
