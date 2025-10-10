import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../DashboardPage.jsx';
import { DashboardProvider } from '../../context/DashboardContext.jsx';

vi.mock('chart.js/auto', () => ({
  default: vi.fn(() => ({ destroy: vi.fn() })),
}));

describe('DashboardPage smoke test', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({}));
  });

  it('renders broker view content by default', () => {
    render(
      <MemoryRouter>
        <DashboardProvider
          initialState={{
            theme: 'light',
            commissions: [
              {
                id: 'C1',
                broker: 'Agent Alpha',
                email: 'alpha@example.com',
                salePrice: 500000,
                grossCommissionRate: 2.5,
                referralFeePct: 0,
                dealTime: 6,
                accuracy: 95,
                score: 90,
                status: 'Approved',
                disclosureViewed: true,
              },
            ],
            marketData: [{ symbol: 'DJI', price: 35000, openPrice: 34800, change: 200, dir: 'up' }],
            agentPlans: {
              'Agent Alpha': {
                primarySplit: { agent: 70, brokerage: 30 },
                commissionCap: 20000,
                currentTowardsCap: 15000,
                deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
              },
            },
          }}
        >
          <DashboardPage />
        </DashboardProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Commissions Paid/i)).toBeInTheDocument();
    expect(screen.getByText(/Viewed/i)).toBeInTheDocument();
    expect(screen.getAllByText(/DJI/).length).toBeGreaterThan(0);
  });
});
