import { formatCurrency, formatPercent } from '../lib/formatters.js';

function buildDisclosure(record) {
  const parsed = record.parsedData ?? {};
  const salePrice = record.salePrice ?? parsed.salePrice ?? 0;
  const loanAmount = parsed.loanAmount ?? (salePrice ? salePrice * 0.8 : 0);
  const listingSideCommission = parsed.listingSideCommission ?? salePrice * 0.025;
  const sellerConcession = parsed.sellerConcession ?? salePrice * 0.02;

  const origination = salePrice * 0.01;
  const points = origination;
  const closingFee = 1500;
  const titleInsurance = 4000;
  const totalClosingCosts = origination + closingFee + titleInsurance;

  const dueFromBorrower = salePrice * 0.2 + totalClosingCosts;
  const paidAlready = loanAmount;
  const cashToClose = dueFromBorrower - paidAlready;

  const dueToSeller = salePrice;
  const dueFromSeller = listingSideCommission + sellerConcession;
  const cashToSeller = salePrice - dueFromSeller;

  return {
    borrower: record.buyerName ?? parsed.buyerName ?? 'Buyer Name',
    seller: record.sellerName ?? parsed.sellerName ?? 'Seller Name',
    lender: 'Charney Mortgage LLC',
    propertyAddress: record.propertyAddress ?? parsed.propertyAddress ?? 'Property Address',
    transactionId: record.id,
    salePrice,
    loanAmount,
    interestRate: 6.25,
    monthlyPayment: loanAmount * 0.00616,
    closingCosts: {
      origination,
      points,
      closingFee,
      titleInsurance,
      total: totalClosingCosts,
    },
    borrowerSummary: {
      dueFromBorrower,
      salePrice,
      closingCosts: totalClosingCosts,
      paidAlready,
      cashToClose,
    },
    sellerSummary: {
      dueToSeller,
      salePrice,
      dueFromSeller,
      listingSideCommission,
      sellerConcession,
      cashToSeller,
    },
  };
}

export default function CommissionTRIDModal({ record, onClose }) {
  const disclosure = buildDisclosure(record);
  const issueDate = new Date().toLocaleDateString('en-US');

  return (
    <div className="fixed inset-0 z-[60] flex justify-center bg-black/70 px-4 py-10 print:static print:block print:bg-white print:px-0 print:py-0">
      <div
        data-testid="trid-scroll-container"
        className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-charney-white shadow-charney dark:bg-charney-slate dark:text-charney-cream print:max-w-none print:rounded-none print:bg-white print:shadow-none"
        style={{ maxHeight: 'calc(100vh - 5rem)' }}
      >
        <header className="flex flex-col gap-6 border-b border-charney-light-gray bg-charney-cream px-8 py-6 dark:border-charney-gray/40 dark:bg-charney-charcoal print:border-0 print:bg-white print:px-0">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div>
              <p className="font-brand text-xs font-bold uppercase tracking-[0.35em] text-charney-gray">Commission Disclosure</p>
              <h3 className="font-brand text-3xl font-black uppercase tracking-tighter text-charney-black dark:text-charney-cream">
                Disclosure <span className="text-charney-red">Agreement</span>
              </h3>
              <p className="mt-2 max-w-xl text-sm text-charney-gray">
                This document outlines the terms and cost structure for the pending commission transaction.
              </p>
            </div>
            <div className="text-xs uppercase text-charney-gray sm:text-right">
              <p className="font-black text-charney-black dark:text-charney-cream">Date Issued: {issueDate}</p>
              <p className="mt-1 font-semibold text-charney-black dark:text-charney-cream">{disclosure.propertyAddress}</p>
              <p className="mt-1">Transaction ID: {disclosure.transactionId}</p>
            </div>
          </div>
          <div className="flex justify-end print:hidden">
            <button
              type="button"
              className="rounded-full bg-charney-white p-2 text-2xl leading-none text-charney-black transition hover:bg-charney-light-gray focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red dark:bg-charney-slate dark:text-charney-cream dark:hover:bg-charney-gray/30"
              onClick={onClose}
              aria-label="Close disclosure modal"
            >
              &times;
            </button>
          </div>
        </header>

        <div
          id="trid-form-printable"
          className="flex-1 overflow-y-auto space-y-10 px-8 py-10 text-sm text-charney-black dark:text-charney-cream print:overflow-visible print:px-0 print:py-0"
        >
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-charney-light-gray bg-charney-white p-6 shadow-charney dark:border-charney-gray/40 dark:bg-charney-slate/80">
              <h4 className="font-brand text-sm font-black uppercase tracking-[0.32em] text-charney-gray">Transaction Information</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><strong>Borrower:</strong> {disclosure.borrower}</li>
                <li><strong>Seller:</strong> {disclosure.seller}</li>
                <li><strong>Lender:</strong> {disclosure.lender}</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-charney-light-gray bg-charney-white p-6 shadow-charney dark:border-charney-gray/40 dark:bg-charney-slate/80">
              <h4 className="font-brand text-sm font-black uppercase tracking-[0.32em] text-charney-gray">Loan Information</h4>
              <ul className="mt-4 space-y-2 text-sm">
                <li><strong>Loan Term:</strong> 30 Years</li>
                <li><strong>Purpose:</strong> Purchase</li>
                <li><strong>Product:</strong> Fixed Rate</li>
                <li><strong>Loan ID #:</strong> 89237492</li>
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-charney-light-gray bg-charney-white p-6 shadow-charney dark:border-charney-gray/40 dark:bg-charney-slate/80">
            <h4 className="font-brand text-sm font-black uppercase tracking-[0.32em] text-charney-gray">Loan Terms</h4>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-charney-cream p-4 text-center dark:bg-charney-gray/30">
                <p className="font-brand text-[0.65rem] uppercase tracking-[0.32em] text-charney-gray">Loan Amount</p>
                <p className="mt-2 text-xl font-black text-charney-black dark:text-charney-cream">{formatCurrency(disclosure.loanAmount)}</p>
              </div>
              <div className="rounded-xl bg-charney-cream p-4 text-center dark:bg-charney-gray/30">
                <p className="font-brand text-[0.65rem] uppercase tracking-[0.32em] text-charney-gray">Interest Rate</p>
                <p className="mt-2 text-xl font-black text-charney-black dark:text-charney-cream">{formatPercent(disclosure.interestRate)}</p>
              </div>
              <div className="rounded-xl bg-charney-cream p-4 text-center dark:bg-charney-gray/30">
                <p className="font-brand text-[0.65rem] uppercase tracking-[0.32em] text-charney-gray">Monthly P&amp;I</p>
                <p className="mt-2 text-xl font-black text-charney-black dark:text-charney-cream">{formatCurrency(disclosure.monthlyPayment)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-charney-light-gray bg-charney-white p-6 shadow-charney dark:border-charney-gray/40 dark:bg-charney-slate/80">
            <h4 className="font-brand text-sm font-black uppercase tracking-[0.32em] text-charney-gray">Closing Cost Details</h4>
            <table className="mt-4 w-full border-separate border-spacing-y-2 text-sm">
              <tbody>
                <tr className="rounded-lg bg-charney-cream/60 dark:bg-charney-gray/30">
                  <td className="rounded-l-lg px-4 py-3 font-semibold text-charney-black dark:text-charney-cream">A. Origination Charges</td>
                  <td className="rounded-r-lg px-4 py-3 text-right font-semibold text-charney-black dark:text-charney-cream">
                    {formatCurrency(disclosure.closingCosts.origination)}
                  </td>
                </tr>
                <tr className="rounded-lg bg-charney-cream/40 text-charney-gray dark:bg-charney-gray/20">
                  <td className="rounded-l-lg px-8 py-3">01. 1% of Loan Amount (Points)</td>
                  <td className="rounded-r-lg px-4 py-3 text-right">{formatCurrency(disclosure.closingCosts.points)}</td>
                </tr>
                <tr className="rounded-lg bg-charney-cream/60 dark:bg-charney-gray/30">
                  <td className="rounded-l-lg px-4 py-3 font-semibold text-charney-black dark:text-charney-cream">C. Title &amp; Escrow Charges</td>
                  <td className="rounded-r-lg px-4 py-3 text-right font-semibold text-charney-black dark:text-charney-cream">
                    {formatCurrency(disclosure.closingCosts.closingFee + disclosure.closingCosts.titleInsurance)}
                  </td>
                </tr>
                <tr className="rounded-lg bg-charney-cream/40 text-charney-gray dark:bg-charney-gray/20">
                  <td className="rounded-l-lg px-8 py-3">01. Closing Fee</td>
                  <td className="rounded-r-lg px-4 py-3 text-right">{formatCurrency(disclosure.closingCosts.closingFee)}</td>
                </tr>
                <tr className="rounded-lg bg-charney-cream/40 text-charney-gray dark:bg-charney-gray/20">
                  <td className="rounded-l-lg px-8 py-3">02. Title Insurance</td>
                  <td className="rounded-r-lg px-4 py-3 text-right">{formatCurrency(disclosure.closingCosts.titleInsurance)}</td>
                </tr>
                <tr className="rounded-lg border-t-2 border-charney-black bg-charney-white font-black text-charney-black dark:border-charney-gray dark:bg-charney-slate/80 dark:text-charney-cream">
                  <td className="rounded-l-lg px-4 py-4">Total Closing Costs (J)</td>
                  <td className="rounded-r-lg px-4 py-4 text-right">{formatCurrency(disclosure.closingCosts.total)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-charney-light-gray bg-charney-white p-6 shadow-charney dark:border-charney-gray/40 dark:bg-charney-slate/80">
            <h4 className="font-brand text-sm font-black uppercase tracking-[0.32em] text-charney-gray">Summaries of Transactions</h4>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left font-brand text-[0.7rem] uppercase tracking-[0.32em] text-charney-gray">Borrower&apos;s Transaction</th>
                    <th className="px-4 py-2 text-right" />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2">K. Due from Borrower at Closing</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(disclosure.borrowerSummary.dueFromBorrower)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 pl-6">01. Sale Price of Property</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(disclosure.borrowerSummary.salePrice)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 pl-6">02. Closing Costs Paid at Closing (J)</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(disclosure.borrowerSummary.closingCosts)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">L. Paid Already by or on Behalf of Borrower</td>
                    <td className="px-4 py-2 text-right">({formatCurrency(disclosure.borrowerSummary.paidAlready)})</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 pl-6">01. Loan Amount</td>
                    <td className="px-4 py-2 text-right">({formatCurrency(disclosure.borrowerSummary.paidAlready)})</td>
                  </tr>
                  <tr className="rounded-lg bg-charney-cream/60 font-black dark:bg-charney-gray/20">
                    <td className="rounded-l-lg px-4 py-3">Cash to Close from Borrower</td>
                    <td className="rounded-r-lg px-4 py-3 text-right">{formatCurrency(disclosure.borrowerSummary.cashToClose)}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left font-brand text-[0.7rem] uppercase tracking-[0.32em] text-charney-gray">Seller&apos;s Transaction</th>
                    <th className="px-4 py-2 text-right" />
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2">M. Due to Seller at Closing</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(disclosure.sellerSummary.dueToSeller)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 pl-6">01. Sale Price of Property</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(disclosure.sellerSummary.salePrice)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">N. Due from Seller at Closing</td>
                    <td className="px-4 py-2 text-right">({formatCurrency(disclosure.sellerSummary.dueFromSeller)})</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 pl-6">01. Listing Side Commission</td>
                    <td className="px-4 py-2 text-right">({formatCurrency(disclosure.sellerSummary.listingSideCommission)})</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 pl-6">02. Seller Concession</td>
                    <td className="px-4 py-2 text-right">({formatCurrency(disclosure.sellerSummary.sellerConcession)})</td>
                  </tr>
                  <tr className="rounded-lg bg-charney-cream/60 font-black dark:bg-charney-gray/20">
                    <td className="rounded-l-lg px-4 py-3">Cash to Seller</td>
                    <td className="rounded-r-lg px-4 py-3 text-right">{formatCurrency(disclosure.sellerSummary.cashToSeller)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mt-8 flex flex-col gap-6 border-t border-charney-black pt-8 text-center text-sm font-semibold uppercase tracking-[0.3em] text-charney-gray dark:border-charney-gray">
              <p className="mx-auto w-full border-t border-charney-black pt-4 text-charney-black dark:border-charney-gray dark:text-charney-cream md:w-1/3">
                Borrower Signature
              </p>
              <p className="mx-auto w-full border-t border-charney-black pt-4 text-charney-black dark:border-charney-gray dark:text-charney-cream md:w-1/3">
                Co-Borrower Signature
              </p>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3 border-t border-charney-light-gray bg-charney-cream px-8 py-6 dark:border-charney-gray/40 dark:bg-charney-charcoal print:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border-[3px] border-charney-black px-6 py-3 font-brand text-[0.625rem] font-black uppercase tracking-[0.32em] text-charney-black transition hover:bg-charney-black hover:text-charney-white focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border-[3px] border-charney-red bg-charney-red px-6 py-3 font-brand text-[0.625rem] font-black uppercase tracking-[0.32em] text-charney-white transition hover:bg-[#E54545] focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red"
            onClick={() => window.print()}
          >
            Print Agreement
          </button>
        </div>
      </div>
    </div>
  );
}
