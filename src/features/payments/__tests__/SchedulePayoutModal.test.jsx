import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '../../../context/ToastContext';
import SchedulePayoutModal from '../components/SchedulePayoutModal';

const mockSelectedItems = [
  {
    id: 'payout-001',
    payout_amount: 58500,
    auto_ach: true,
    agent: { full_name: 'John Smith' },
    transaction: { property_address: '123 Main St' }
  },
  {
    id: 'payout-002',
    payout_amount: 34500,
    auto_ach: false,
    agent: { full_name: 'Jane Doe' },
    transaction: { property_address: '420 Kent Ave' }
  }
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  selectedItems: mockSelectedItems,
  isProcessing: false
};

const renderModal = (props = {}) => {
  return render(
    <ToastProvider>
      <SchedulePayoutModal {...defaultProps} {...props} />
    </ToastProvider>
  );
};

describe('SchedulePayoutModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Display', () => {
    it('renders when open', () => {
      renderModal();
      
      expect(screen.getByText('Confirm Payout Schedule')).toBeInTheDocument();
      expect(screen.getByText('Review the selected transactions before scheduling payouts.')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderModal({ isOpen: false });
      
      expect(screen.queryByText('Confirm Payout Schedule')).not.toBeInTheDocument();
    });

    it('displays selected items correctly', () => {
      renderModal();
      
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('420 Kent Ave')).toBeInTheDocument();
      expect(screen.getByText('$58,500')).toBeInTheDocument();
      expect(screen.getByText('$34,500')).toBeInTheDocument();
    });

    it('shows total amount correctly', () => {
      renderModal();
      
      // Total should be $93,000 ($58,500 + $34,500)
      expect(screen.getByText('$93,000')).toBeInTheDocument();
    });
  });

  describe('ACH Toggle Functionality', () => {
    it('shows ACH toggle when eligible items exist', () => {
      renderModal();

      const achToggle = screen.getByRole('checkbox');
      expect(achToggle).toBeInTheDocument();
      expect(achToggle).not.toBeChecked(); // Should default to disabled
    });

    it('displays ACH eligibility information', () => {
      renderModal();
      
      // Should show that 1 out of 2 items are ACH eligible
      expect(screen.getByText(/1 of 2 transactions are ACH eligible/)).toBeInTheDocument();
    });

    it('shows warning for mixed processing when ACH is enabled', () => {
      renderModal();
      
      expect(screen.getByText(/Mixed Processing Warning/)).toBeInTheDocument();
      expect(screen.getByText(/Some transactions will be processed manually/)).toBeInTheDocument();
    });

    it('toggles ACH setting correctly', () => {
      renderModal();

      const achToggle = screen.getByRole('checkbox');
      expect(achToggle).not.toBeChecked();

      fireEvent.click(achToggle);
      expect(achToggle).toBeChecked();

      fireEvent.click(achToggle);
      expect(achToggle).not.toBeChecked();
    });

    it('disables ACH toggle when no items are eligible', () => {
      const nonAchItems = mockSelectedItems.map(item => ({
        ...item,
        auto_ach: false
      }));

      renderModal({ selectedItems: nonAchItems });

      const achToggle = screen.getByRole('checkbox');
      expect(achToggle).toBeDisabled();
    });
  });

  describe('Processing States', () => {
    it('shows processing state when isProcessing is true', () => {
      renderModal({ isProcessing: true });
      
      const confirmButton = screen.getByRole('button', { name: /processing/i });
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).toBeDisabled();
      
      // Should show spinner
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('shows normal state when not processing', () => {
      renderModal({ isProcessing: false });
      
      const confirmButton = screen.getByRole('button', { name: /confirm schedule/i });
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      renderModal({ onClose });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      // Click on the backdrop (the first div with bg-black)
      const backdrop = document.querySelector('.bg-black.bg-opacity-50');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalled();
    });

    it('does not close when modal content is clicked', () => {
      const onClose = vi.fn();
      renderModal({ onClose });

      // Click on the modal content area
      const modalContent = screen.getByText('Schedule Payout').closest('div');
      fireEvent.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onConfirm with correct data when confirmed', async () => {
      const onConfirm = vi.fn();
      renderModal({ onConfirm });

      // Toggle ACH on
      const achToggle = screen.getByRole('checkbox');
      fireEvent.click(achToggle);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith({
          achEnabled: true,
          selectedItems: mockSelectedItems
        });
      });
    });

    it('prevents confirmation when processing', () => {
      const onConfirm = vi.fn();
      renderModal({ onConfirm, isProcessing: true });
      
      const confirmButton = screen.getByRole('button', { name: /processing/i });
      fireEvent.click(confirmButton);
      
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper modal structure', () => {
      renderModal();

      // Check for modal title
      expect(screen.getByText('Schedule Payout')).toBeInTheDocument();
      expect(screen.getByText('Confirm payout details before processing')).toBeInTheDocument();
    });

    it('has focusable elements', () => {
      renderModal();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      const confirmButton = screen.getByRole('button', { name: /confirm/i });

      expect(cancelButton).toBeInTheDocument();
      expect(confirmButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      renderModal();

      const achToggle = screen.getByRole('checkbox');

      // Should be able to focus the checkbox
      achToggle.focus();
      expect(document.activeElement).toBe(achToggle);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty selected items', () => {
      renderModal({ selectedItems: [] });
      
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.queryByText(/transactions are ACH eligible/)).not.toBeInTheDocument();
    });

    it('handles all ACH eligible items', () => {
      const allAchItems = mockSelectedItems.map(item => ({
        ...item,
        auto_ach: true
      }));

      renderModal({ selectedItems: allAchItems, totalAmount: 93000 });

      // Should show that all transactions are ACH eligible
      expect(screen.getByText(/2.*eligible for ACH/)).toBeInTheDocument();
    });

    it('formats large amounts correctly', () => {
      const largeAmountItems = [{
        id: 'payout-001',
        payout_amount: 1234567.89,
        auto_ach: true,
        agent: { full_name: 'John Smith' },
        transaction: { property_address: '123 Main St' }
      }];

      renderModal({ selectedItems: largeAmountItems, totalAmount: 1234568 });

      expect(screen.getByText('$1,234,568')).toBeInTheDocument();
    });
  });
});
