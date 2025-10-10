import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardProvider } from '../../context/DashboardContext.jsx';
import CommissionModal from '../CommissionModal.jsx';

const mockRecord = {
  id: 'C1',
  status: 'Needs Review',
  propertyAddress: '123 Main St',
  buyerName: 'Jane Doe',
  sellerName: 'John Smith',
  salePrice: 500000,
  grossCommissionPercent: 2.5,
  referralFeePct: 10,
  agentSplitPercent: 70,
  agent: { id: 'A1', name: 'Agent Alpha', email: 'alpha@example.com' },
  brokerage: { id: 'B1', franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
  referrals: [{ name: 'Referral Partner', percent: 10 }],
  evidence: [
    { id: 'E1', field: 'Email', value: 'Initial offer', actor: 'Agent Alpha', created_at: '2024-09-08T12:00:00Z' },
  ],
  auditTrail: [
    { id: 'EV1', event_type: 'status_change', actor_name: 'Coordinator', created_at: '2024-09-08T10:00:00Z', metadata: { from: 'New', to: 'Needs Review' } },
  ],
};

const renderModal = (props = {}) =>
  render(
    <DashboardProvider initialState={{}}>
      <CommissionModal
        isOpen
        onClose={vi.fn()}
        commissionRecord={mockRecord}
        onAction={vi.fn()}
        {...props}
      />
    </DashboardProvider>,
  );

describe('CommissionModal', () => {
  it('renders commission details and calculation form', () => {
    renderModal();
    expect(screen.getByText(/Commission Detail/i)).toBeInTheDocument();
    expect(screen.getByText(/123 Main St/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sale Price/i)).toHaveValue(mockRecord.salePrice);
    expect(screen.getByText(/Audit Trail/i)).toBeInTheDocument();
    expect(screen.getByText(/Coordinator/i)).toBeInTheDocument();
  });

  it('allows typing in calculation inputs without losing focus', () => {
    renderModal();
    const salePriceInput = screen.getByLabelText(/Sale Price/i);
    fireEvent.change(salePriceInput, { target: { value: '600000' } });
    expect(salePriceInput).toHaveValue(600000);
  });

  it('fires approve action handler', () => {
    const onAction = vi.fn();
    renderModal({ onAction });
    fireEvent.click(screen.getByText(/Approve Commission/i));
    expect(onAction).toHaveBeenCalledWith('approve', mockRecord.id);
  });

  it('shows TRID view when requested', () => {
    renderModal();
    fireEvent.click(screen.getByText(/Generate Disclosure/i));
    expect(screen.getByRole('heading', { name: /Disclosure Agreement/i })).toBeInTheDocument();
    expect(screen.getByText(/Cash to Close from Borrower/i)).toBeInTheDocument();
    expect(screen.getByText(/^Borrower Signature$/i)).toBeInTheDocument();
    const scrollContainer = screen.getByTestId('trid-scroll-container');
    expect(scrollContainer).toHaveStyle({ maxHeight: 'calc(100vh - 5rem)' });
  });

  it('can toggle open state without hook-order failures', () => {
    const { rerender } = render(
      <DashboardProvider initialState={{}}>
        <CommissionModal isOpen={false} onClose={vi.fn()} commissionRecord={mockRecord} onAction={vi.fn()} />
      </DashboardProvider>,
    );

    expect(() => {
      rerender(
        <DashboardProvider initialState={{}}>
          <CommissionModal isOpen commissionRecord={mockRecord} onClose={vi.fn()} onAction={vi.fn()} />
        </DashboardProvider>,
      );
      rerender(
        <DashboardProvider initialState={{}}>
          <CommissionModal isOpen={false} commissionRecord={mockRecord} onClose={vi.fn()} onAction={vi.fn()} />
        </DashboardProvider>,
      );
    }).not.toThrow();
  });
});
