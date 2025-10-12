import { PayoutQueue, PaymentHistory } from '../features/payments/components';

export default function PaymentsView({ hidden }) {
  return (
    <section
      id="payments-view"
      className={hidden ? 'hidden' : 'space-y-6'}
      aria-labelledby="payments-view-title"
    >
      <header>
        <h2 id="payments-view-title" className="text-2xl font-black uppercase tracking-tight">
          Payments
        </h2>
        <p className="text-sm text-charney-gray">
          Manage agent payouts and payment history
        </p>
      </header>

      {/* Payout Queue Component */}
      <PayoutQueue />

      {/* Payment History Component */}
      <PaymentHistory />

      {/* TODO: Add other payment components */}
      {/* <SchedulePayoutModal /> */}
    </section>
  );
}
