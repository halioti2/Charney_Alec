import {
  PayoutQueue,
  PaymentHistory,
  PayoutFailureBanner,
  RequiresAttentionQueue
} from '../features/payments/components';
import { useDashboardContext } from '../context/DashboardContext.jsx';

export default function PaymentsView({ hidden }) {
  const { refetchPaymentData, isRefreshingPayments } = useDashboardContext();
  // Mock failure data for demonstration - Realistic brokerage scenarios
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

  const handleRetryFailures = (failures) => {
    console.log('Retrying failures:', failures);
    // TODO: Implement retry logic
  };

  const handleDismissFailures = (failureIds) => {
    console.log('Dismissing failures:', failureIds);
    // TODO: Implement dismiss logic
  };

  return (
    <section
      id="payments-view"
      className={hidden ? 'hidden' : 'space-y-6'}
      aria-labelledby="payments-view-title"
    >
      <header>
        <div className="flex items-center justify-between">
          <div>
            <h2 id="payments-view-title" className="text-2xl font-black uppercase tracking-tight">
              Payments
            </h2>
            <p className="text-sm text-charney-gray">
              Manage agent payouts and payment history
            </p>
          </div>
          <button
            onClick={() => refetchPaymentData()}
            disabled={isRefreshingPayments}
            className="bg-charney-red text-white px-4 py-2 text-sm font-bold uppercase hover:bg-charney-black transition-colors disabled:opacity-50"
          >
            {isRefreshingPayments ? 'Refreshing...' : 'Refresh Payments'}
          </button>
        </div>
      </header>

      {/* Failure Banner */}
      <PayoutFailureBanner
        failures={mockFailures}
        onRetry={handleRetryFailures}
        onDismiss={handleDismissFailures}
      />

      {/* Requires Attention Queue */}
      <RequiresAttentionQueue />

      {/* Main Payout Queue */}
      <PayoutQueue />

      {/* Payment History */}
      <PaymentHistory />
    </section>
  );
}
