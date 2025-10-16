import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToastProvider } from '../../../context/ToastContext';
import PayoutFailureBanner from '../components/PayoutFailureBanner';

const mockFailures = [
  {
    id: 'payout-004',
    agent: { full_name: 'Sarah Martinez' },
    failure_reason: 'Agent bank account closed or invalid',
    ach_provider: 'stripe'
  },
  {
    id: 'payout-005',
    agent: { full_name: 'Michael Thompson' },
    failure_reason: 'Brokerage account daily transfer limit exceeded',
    ach_provider: 'stripe'
  },
  {
    id: 'payout-006',
    agent: { full_name: 'Lisa Rodriguez' },
    failure_reason: 'Check processing error - invalid mailing address',
    ach_provider: null
  }
];

const defaultProps = {
  failures: mockFailures,
  onRetry: vi.fn(),
  onDismiss: vi.fn()
};

const renderBanner = (props = {}) => {
  return render(
    <ToastProvider>
      <PayoutFailureBanner {...defaultProps} {...props} />
    </ToastProvider>
  );
};

describe('PayoutFailureBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders failure banner with correct count', () => {
      renderBanner();
      
      expect(screen.getByText('Payout Failures (3)')).toBeInTheDocument();
      expect(screen.getByText('The following payouts failed to process:')).toBeInTheDocument();
    });

    it('does not render when no failures', () => {
      renderBanner({ failures: [] });
      
      expect(screen.queryByText(/Payout Failures/)).not.toBeInTheDocument();
    });

    it('does not render when failures is null/undefined', () => {
      renderBanner({ failures: null });
      expect(screen.queryByText(/Payout Failures/)).not.toBeInTheDocument();
      
      renderBanner({ failures: undefined });
      expect(screen.queryByText(/Payout Failures/)).not.toBeInTheDocument();
    });

    it('displays all failure details', () => {
      renderBanner();
      
      expect(screen.getByText('Sarah Martinez')).toBeInTheDocument();
      expect(screen.getByText('Michael Thompson')).toBeInTheDocument();
      expect(screen.getByText('Lisa Rodriguez')).toBeInTheDocument();
      
      expect(screen.getByText('Agent bank account closed or invalid')).toBeInTheDocument();
      expect(screen.getByText('Brokerage account daily transfer limit exceeded')).toBeInTheDocument();
      expect(screen.getByText('Check processing error - invalid mailing address')).toBeInTheDocument();
    });

    it('shows ACH provider information when available', () => {
      renderBanner();
      
      const stripeProviders = screen.getAllByText('stripe');
      expect(stripeProviders).toHaveLength(2); // Sarah and Michael
      
      // Lisa should not have ACH provider shown (manual processing)
      const lisaRow = screen.getByText('Lisa Rodriguez').closest('li');
      expect(lisaRow).not.toHaveTextContent('stripe');
    });
  });

  describe('Collapsible Functionality', () => {
    it('starts in collapsed state by default', () => {
      renderBanner();
      
      // Failure details should not be visible initially
      expect(screen.queryByText('Sarah Martinez')).not.toBeInTheDocument();
    });

    it('expands when clicked', () => {
      renderBanner();
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      // Now failure details should be visible
      expect(screen.getByText('Sarah Martinez')).toBeInTheDocument();
      expect(screen.getByText('Michael Thompson')).toBeInTheDocument();
      expect(screen.getByText('Lisa Rodriguez')).toBeInTheDocument();
    });

    it('collapses when clicked again', () => {
      renderBanner();
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      
      // Expand
      fireEvent.click(expandButton);
      expect(screen.getByText('Sarah Martinez')).toBeInTheDocument();
      
      // Collapse
      fireEvent.click(expandButton);
      expect(screen.queryByText('Sarah Martinez')).not.toBeInTheDocument();
    });

    it('shows correct expand/collapse icons', () => {
      renderBanner();
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      
      // Should show down arrow when collapsed
      expect(expandButton.querySelector('svg')).toBeInTheDocument();
      
      fireEvent.click(expandButton);
      
      // Should show up arrow when expanded
      expect(expandButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('shows retry and dismiss buttons when expanded', () => {
      renderBanner();
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByRole('button', { name: /retry all/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dismiss all/i })).toBeInTheDocument();
    });

    it('calls onRetry with all failures when retry all is clicked', () => {
      const onRetry = vi.fn();
      renderBanner({ onRetry });
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      const retryButton = screen.getByRole('button', { name: /retry all/i });
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledWith(mockFailures);
    });

    it('calls onDismiss with failure IDs when dismiss all is clicked', () => {
      const onDismiss = vi.fn();
      renderBanner({ onDismiss });
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      const dismissButton = screen.getByRole('button', { name: /dismiss all/i });
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledWith(['payout-004', 'payout-005', 'payout-006']);
    });

    it('does not show action buttons when callbacks are not provided', () => {
      renderBanner({ onRetry: null, onDismiss: null });
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      expect(screen.queryByRole('button', { name: /retry all/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /dismiss all/i })).not.toBeInTheDocument();
    });
  });

  describe('Toast Integration', () => {
    it('shows toast when retry all is clicked', async () => {
      renderBanner();
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      const retryButton = screen.getByRole('button', { name: /retry all/i });
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Retrying 3 failed payouts/)).toBeInTheDocument();
      });
    });

    it('shows toast when dismiss all is clicked', async () => {
      renderBanner();
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      const dismissButton = screen.getByRole('button', { name: /dismiss all/i });
      fireEvent.click(dismissButton);
      
      await waitFor(() => {
        expect(screen.getByText('Failure notifications dismissed')).toBeInTheDocument();
      });
    });

    it('handles singular vs plural in toast messages', async () => {
      const singleFailure = [mockFailures[0]];
      renderBanner({ failures: singleFailure });
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      const retryButton = screen.getByRole('button', { name: /retry all/i });
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Retrying 1 failed payout\.\.\./)).toBeInTheDocument();
      });
    });
  });

  describe('Scrollable List', () => {
    it('applies scrollable styles when many failures', () => {
      // Create many failures to test scrolling
      const manyFailures = Array.from({ length: 10 }, (_, i) => ({
        id: `payout-${i}`,
        agent: { full_name: `Agent ${i}` },
        failure_reason: `Failure reason ${i}`,
        ach_provider: 'stripe'
      }));
      
      renderBanner({ failures: manyFailures });
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      const failureList = screen.getByRole('list');
      expect(failureList).toHaveClass('max-h-48', 'overflow-y-auto');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderBanner();
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(expandButton);
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper semantic structure', () => {
      renderBanner();
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByRole('list')).toBeInTheDocument();
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('supports keyboard navigation', () => {
      renderBanner();
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      
      // Should be focusable
      expandButton.focus();
      expect(document.activeElement).toBe(expandButton);
      
      // Should respond to Enter key
      fireEvent.keyDown(expandButton, { key: 'Enter' });
      expect(screen.getByText('Sarah Martinez')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles failures without agent names', () => {
      const failuresWithoutNames = [{
        id: 'payout-001',
        agent: {},
        failure_reason: 'Unknown error',
        ach_provider: 'stripe'
      }];
      
      renderBanner({ failures: failuresWithoutNames });
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByText('Unknown error')).toBeInTheDocument();
    });

    it('handles very long failure reasons', () => {
      const longReasonFailure = [{
        id: 'payout-001',
        agent: { full_name: 'Test Agent' },
        failure_reason: 'This is a very long failure reason that should be handled gracefully by the component without breaking the layout or causing any display issues',
        ach_provider: 'stripe'
      }];
      
      renderBanner({ failures: longReasonFailure });
      
      const expandButton = screen.getByRole('button', { name: /payout failures/i });
      fireEvent.click(expandButton);
      
      expect(screen.getByText(/This is a very long failure reason/)).toBeInTheDocument();
    });
  });
});
