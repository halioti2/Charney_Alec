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
          This tab will host the Payments dashboard (payout queue, history, ACH status). Build work inside
          `src/features/payments/`.
        </p>
      </header>
      <div className="rounded-xl border border-charney-light-gray bg-white p-6 shadow-sm dark:border-charney-gray/70 dark:bg-charney-charcoal/50">
        <p className="text-sm text-charney-gray">
          Placeholder: Replace with Track B components (PayoutQueue, SchedulePayoutModal, PaymentHistory).
        </p>
      </div>
    </section>
  );
}
