import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { ToastProvider } from '../../../context/ToastContext';
import PayoutQueue from '../components/PayoutQueue';
import * as usePaymentsAPI from '../hooks/usePaymentsAPI';

// Mock the payments API hook
const mockFetchPayoutQueue = vi.fn();
const mockSchedulePayout = vi.fn();
const mockClearError = vi.fn();

vi.mock('../hooks/usePaymentsAPI', () => ({
  usePayoutQueue: () => ({
    fetchPayoutQueue: mockFetchPayoutQueue,
    isLoading: false,
    error: null,
    clearError: mockClearError
  }),
  usePayoutScheduling: () => ({
    schedulePayout: mockSchedulePayout,
    isScheduling: false
  })
}));

// Mock data for testing
const mockPayoutItems = [
  {
    id: 'payout-001',
    transaction_id: 'txn-001',
    agent_id: 'agent-001',
    payout_amount: 58500,
    status: 'ready',
    auto_ach: true,
    created_at: '2024-10-10T10:00:00Z',
    agent: {
      id: 'agent-001',
      full_name: 'John Smith',
      email: 'john.smith@charney.com'
    },
    transaction: {
      id: 'txn-001',
      property_address: '123 Main St, Unit 4A'
    },
    bank_account: {
      id: 'bank-001',
      account_nickname: 'Chase Business',
      mask: '****1234'
    }
  },
  {
    id: 'payout-002',
    transaction_id: 'txn-002',
    agent_id: 'agent-002',
    payout_amount: 34500,
    status: 'ready',
    auto_ach: false,
    created_at: '2024-10-10T11:00:00Z',
    agent: {
      id: 'agent-002',
      full_name: 'Jane Doe',
      email: 'jane.doe@charney.com'
    },
    transaction: {
      id: 'txn-002',
      property_address: '420 Kent Ave, Apt 12B'
    },
    bank_account: {
      id: 'bank-002',
      account_nickname: 'Wells Fargo Checking',
      mask: '****5678'
    }
  }
];

const renderPayoutQueue = () => {
  return render(
    <ToastProvider>
      <PayoutQueue />
    </ToastProvider>
  );
};

describe('PayoutQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPayoutQueue.mockResolvedValue(mockPayoutItems);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading and Data Display', () => {
    it('shows loading state initially', async () => {
      // Mock loading state
      vi.mocked(usePaymentsAPI.usePayoutQueue).mockReturnValue({
        fetchPayoutQueue: mockFetchPayoutQueue,
        isLoading: true,
        error: null,
        clearError: mockClearError
      });

      renderPayoutQueue();

      expect(screen.getByText('Loading Payout Queue...')).toBeInTheDocument();
      expect(screen.getByText('Fetching ready transactions')).toBeInTheDocument();
    });

    it('displays payout items after loading', async () => {
      renderPayoutQueue();

      await waitFor(() => {
        expect(mockFetchPayoutQueue).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('123 Main St, Unit 4A')).toBeInTheDocument();
        expect(screen.getByText('420 Kent Ave, Apt 12B')).toBeInTheDocument();
      });
    });

    it('shows empty state when no items available', async () => {
      mockFetchPayoutQueue.mockResolvedValue([]);

      renderPayoutQueue();

      await waitFor(() => {
        expect(screen.getByText('No Payouts Ready')).toBeInTheDocument();
        expect(screen.getByText(/All approved commissions have been paid out/)).toBeInTheDocument();
      });
    });
  });

  describe('Selection Logic', () => {
    it('allows selecting individual items', async () => {
      renderPayoutQueue();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const firstItemCheckbox = checkboxes.find(cb =>
        cb.closest('tr')?.textContent?.includes('John Smith')
      );

      expect(firstItemCheckbox).toBeInTheDocument();
      expect(firstItemCheckbox).not.toBeChecked();

      fireEvent.click(firstItemCheckbox);
      expect(firstItemCheckbox).toBeChecked();
    });

    it('calculates running total correctly', async () => {
      renderPayoutQueue();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const firstItemCheckbox = checkboxes.find(cb =>
        cb.closest('tr')?.textContent?.includes('John Smith')
      );

      fireEvent.click(firstItemCheckbox);

      // Should show the amount for first item ($58,500)
      await waitFor(() => {
        expect(screen.getByText('$58,500')).toBeInTheDocument();
      });
    });

    it('shows schedule button only when items are selected', async () => {
      renderPayoutQueue();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Initially no schedule button
      expect(screen.queryByText(/Schedule Payout/)).not.toBeInTheDocument();

      const checkboxes = screen.getAllByRole('checkbox');
      const firstItemCheckbox = checkboxes.find(cb =>
        cb.closest('tr')?.textContent?.includes('John Smith')
      );

      fireEvent.click(firstItemCheckbox);

      // Now schedule button should appear
      await waitFor(() => {
        expect(screen.getByText(/Schedule Payout/)).toBeInTheDocument();
      });
    });

    it('handles select all functionality', async () => {
      renderPayoutQueue();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      expect(selectAllCheckbox).toBeInTheDocument();

      fireEvent.click(selectAllCheckbox);

      // All individual checkboxes should be checked
      const itemCheckboxes = screen.getAllByRole('checkbox').filter(cb =>
        cb !== selectAllCheckbox
      );

      itemCheckboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
      });

      // Total should show sum of both items ($93,000)
      await waitFor(() => {
        expect(screen.getByText('$93,000')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Integration', () => {
    it('opens schedule modal when schedule button is clicked', async () => {
      renderPayoutQueue();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const firstItemCheckbox = checkboxes.find(cb =>
        cb.closest('tr')?.textContent?.includes('John Smith')
      );

      fireEvent.click(firstItemCheckbox);

      const scheduleButton = await screen.findByText(/Schedule Payout/);
      fireEvent.click(scheduleButton);

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText(/Confirm Payout Schedule/)).toBeInTheDocument();
      });
    });

    it('calls schedulePayout API when modal is confirmed', async () => {
      mockSchedulePayout.mockResolvedValue({
        batchId: 'batch-123',
        scheduledCount: 1
      });

      renderPayoutQueue();

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      const firstItemCheckbox = checkboxes.find(cb =>
        cb.closest('tr')?.textContent?.includes('John Smith')
      );

      fireEvent.click(firstItemCheckbox);

      const scheduleButton = await screen.findByText(/Schedule Payout/);
      fireEvent.click(scheduleButton);

      // Confirm in modal
      const confirmButton = await screen.findByText(/Confirm Schedule/);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockSchedulePayout).toHaveBeenCalledWith({
          selectedItems: expect.arrayContaining([
            expect.objectContaining({ id: 'payout-001' })
          ]),
          achEnabled: expect.any(Boolean)
        });
      });
    });
  });
});