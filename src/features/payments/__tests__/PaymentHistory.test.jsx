import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import PaymentHistory from '../components/PaymentHistory';
import * as usePaymentsAPI from '../hooks/usePaymentsAPI';

// Mock the payments API hook
const mockFetchPaymentHistory = vi.fn();

vi.mock('../hooks/usePaymentsAPI', () => ({
  usePaymentHistory: () => ({
    fetchPaymentHistory: mockFetchPaymentHistory,
    isLoading: false
  })
}));

// Mock data for testing
const mockHistoryItems = [
  {
    id: 'payout-001',
    transaction_id: 'txn-001',
    agent_id: 'agent-001',
    payout_amount: 58500,
    status: 'paid',
    auto_ach: true,
    ach_reference: 'ACH_REF_001',
    paid_at: '2024-10-08T14:30:00Z',
    created_at: '2024-10-08T10:00:00Z',
    agent: {
      id: 'agent-001',
      full_name: 'John Smith',
      email: 'john.smith@charney.com'
    },
    transaction: {
      id: 'txn-001',
      property_address: '123 Main St, Unit 4A'
    }
  },
  {
    id: 'payout-002',
    transaction_id: 'txn-002',
    agent_id: 'agent-002',
    payout_amount: 34500,
    status: 'scheduled',
    auto_ach: false,
    ach_reference: null,
    paid_at: null,
    scheduled_at: '2024-10-09T09:00:00Z',
    created_at: '2024-10-08T11:00:00Z',
    agent: {
      id: 'agent-002',
      full_name: 'Jane Doe',
      email: 'jane.doe@charney.com'
    },
    transaction: {
      id: 'txn-002',
      property_address: '420 Kent Ave, Apt 12B'
    }
  },
  {
    id: 'payout-003',
    transaction_id: 'txn-003',
    agent_id: 'agent-003',
    payout_amount: 72500,
    status: 'failed',
    auto_ach: true,
    ach_reference: null,
    paid_at: null,
    failure_reason: 'Agent bank account closed or invalid',
    created_at: '2024-10-07T15:00:00Z',
    agent: {
      id: 'agent-003',
      full_name: 'Bob Wilson',
      email: 'bob.wilson@charney.com'
    },
    transaction: {
      id: 'txn-003',
      property_address: '111 Varick St, Penthouse'
    }
  }
];

const renderPaymentHistory = () => {
  return render(<PaymentHistory />);
};

describe('PaymentHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPaymentHistory.mockResolvedValue(mockHistoryItems);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading and Data Display', () => {
    it('shows loading state initially', async () => {
      // Mock loading state
      vi.mocked(usePaymentsAPI.usePaymentHistory).mockReturnValue({
        fetchPaymentHistory: mockFetchPaymentHistory,
        isLoading: true
      });

      renderPaymentHistory();

      expect(screen.getByText('Loading Payment History...')).toBeInTheDocument();
      expect(screen.getByText('Fetching transaction records')).toBeInTheDocument();
    });

    it('displays payment history items after loading', async () => {
      renderPaymentHistory();

      await waitFor(() => {
        expect(mockFetchPaymentHistory).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
        expect(screen.getByText('123 Main St, Unit 4A')).toBeInTheDocument();
        expect(screen.getByText('420 Kent Ave, Apt 12B')).toBeInTheDocument();
        expect(screen.getByText('111 Varick St, Penthouse')).toBeInTheDocument();
      });
    });

    it('shows empty state when no history available', async () => {
      mockFetchPaymentHistory.mockResolvedValue([]);

      renderPaymentHistory();

      await waitFor(() => {
        expect(screen.getByText('No Payment History')).toBeInTheDocument();
        expect(screen.getByText(/No payments have been processed yet/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering Functionality', () => {
    it('filters by status correctly', async () => {
      renderPaymentHistory();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Find and click status filter dropdown
      const statusFilter = screen.getByDisplayValue('All Statuses');
      fireEvent.change(statusFilter, { target: { value: 'paid' } });

      // Should call API with status filter
      await waitFor(() => {
        expect(mockFetchPaymentHistory).toHaveBeenCalledWith({
          status: 'paid',
          achMethod: 'all',
          limit: 100
        });
      });
    });

    it('filters by ACH method correctly', async () => {
      renderPaymentHistory();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Find and click ACH filter dropdown
      const achFilter = screen.getByDisplayValue('All Methods');
      fireEvent.change(achFilter, { target: { value: 'ach' } });

      // Should call API with ACH filter
      await waitFor(() => {
        expect(mockFetchPaymentHistory).toHaveBeenCalledWith({
          status: 'all',
          achMethod: 'ach',
          limit: 100
        });
      });
    });

    it('combines multiple filters', async () => {
      renderPaymentHistory();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Apply both filters
      const statusFilter = screen.getByDisplayValue('All Statuses');
      const achFilter = screen.getByDisplayValue('All Methods');

      fireEvent.change(statusFilter, { target: { value: 'paid' } });
      fireEvent.change(achFilter, { target: { value: 'manual' } });

      // Should call API with both filters
      await waitFor(() => {
        expect(mockFetchPaymentHistory).toHaveBeenCalledWith({
          status: 'paid',
          achMethod: 'manual',
          limit: 100
        });
      });
    });
  });

  describe('Status Badges', () => {
    it('displays correct status badges', async () => {
      renderPaymentHistory();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Check for status badges
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('displays ACH badges correctly', async () => {
      renderPaymentHistory();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Check for ACH badges
      const achBadges = screen.getAllByText('ACH');
      const manualBadges = screen.getAllByText('Manual');

      expect(achBadges.length).toBeGreaterThan(0);
      expect(manualBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Summary Statistics', () => {
    it('calculates total paid amount correctly', async () => {
      renderPaymentHistory();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Should show total of paid items ($58,500 from John Smith)
      await waitFor(() => {
        expect(screen.getByText('$58,500')).toBeInTheDocument();
      });
    });

    it('counts ACH and manual payments correctly', async () => {
      renderPaymentHistory();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Should count ACH payments (John Smith and Bob Wilson = 2)
      // Should count Manual payments (Jane Doe = 1)
      const summarySection = screen.getByText('Summary').closest('div');

      await waitFor(() => {
        expect(within(summarySection).getByText('2')).toBeInTheDocument(); // ACH count
        expect(within(summarySection).getByText('1')).toBeInTheDocument(); // Manual count
      });
    });
  });

  describe('Date Formatting', () => {
    it('formats payment dates correctly', async () => {
      renderPaymentHistory();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Check for formatted dates (Oct 08, 2024 format)
      expect(screen.getByText(/Oct 08, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Oct 09, 2024/)).toBeInTheDocument();
    });
  });
});