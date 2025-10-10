const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function defaultDisclosure(record) {
  return {
    borrower: record.buyerName ?? 'Buyer Name',
    seller: record.sellerName ?? 'Seller Name',
    lender: 'Charney Mortgage LLC',
    propertyAddress: record.propertyAddress ?? 'Property Address',
    loanAmount: record.parsedData?.loanAmount ?? (record.salePrice ? record.salePrice * 0.8 : 0),
    interestRate: 6.25,
    monthlyPayment: (record.salePrice ?? 0) * 0.004,
    closingCosts: {
      origination: 22431.18,
      points: 22431.18,
      closingFee: 5500,
      titleInsurance: 1500,
      other: 4000,
    },
  };
}

export default function CommissionTRIDModal({ record, onClose }) {
  const disclosure = defaultDisclosure(record);
  const totalClosing = disclosure.closingCosts.origination + disclosure.closingCosts.closingFee + disclosure.closingCosts.titleInsurance + disclosure.closingCosts.other;
  const issueDate = new Date().toLocaleDateString('en-US');

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="modal-content w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-charney-light-gray px-8 py-5">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">
              Disclosure <span className="text-charney-red">Agreement</span>
            </h3>
            <p className="text-sm text-charney-gray">This document outlines the terms and conditions of the commission agreement.</p>
          </div>
          <div className="text-right text-xs uppercase text-charney-gray">
            <p className="font-bold text-black">Date Issued: {issueDate}</p>
            <p>Property: {disclosure.propertyAddress}</p>
            <p>Transaction ID: {record.id}</p>
          </div>
          <button type="button" className="text-2xl" onClick={onClose} aria-label="Close disclosure modal">
            &times;
          </button>
        </header>
        <div className="space-y-8 p-8 text-sm" id="trid-form-printable">
          <section className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="border-b border-charney-light-gray pb-2 text-lg font-black uppercase tracking-tight">Transaction Information</h4>
              <p className="mt-3"><strong>Borrower:</strong> {disclosure.borrower}</p>
              <p><strong>Seller:</strong> {disclosure.seller}</p>
              <p><strong>Lender:</strong> {disclosure.lender}</p>
            </div>
            <div>
              <h4 className="border-b border-charney-light-gray pb-2 text-lg font-black uppercase tracking-tight">Loan Information</h4>
              <p className="mt-3"><strong>Loan Term:</strong> 30 years</p>
              <p><strong>Purpose:</strong> Purchase</p>
              <p><strong>Product:</strong> Fixed Rate</p>
              <p><strong>Loan ID #:</strong> 89237492</p>
            </div>
          </section>

          <section className="rounded-md border border-charney-light-gray p-5">
            <h4 className="border-b border-charney-light-gray pb-2 text-lg font-black uppercase tracking-tight">Loan Terms</h4>
            <div className="mt-3 grid grid-cols-3 gap-4 text-right">
              <div>
                <p className="text-xs uppercase text-charney-gray">Loan Amount</p>
                <p className="text-lg font-black text-charney-black">{currencyFormatter.format(disclosure.loanAmount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-charney-gray">Interest Rate</p>
                <p className="text-lg font-black text-charney-black">{disclosure.interestRate}%</p>
              </div>
              <div>
                <p className="text-xs uppercase text-charney-gray">Monthly P&amp;I</p>
                <p className="text-lg font-black text-charney-black">{currencyFormatter.format(disclosure.monthlyPayment)}</p>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-charney-light-gray p-5">
            <h4 className="border-b border-charney-light-gray pb-2 text-lg font-black uppercase tracking-tight">Closing Cost Details</h4>
            <table className="mt-3 w-full text-sm">
              <tbody>
                <tr className="border-b border-charney-light-gray">
                  <td className="py-2"><strong>A. Origination Charges</strong></td>
                  <td className="py-2 text-right">{currencyFormatter.format(disclosure.closingCosts.origination)}</td>
                </tr>
                <tr>
                  <td className="py-2 pl-6">01. 1% of Loan Amount (Points)</td>
                  <td className="py-2 text-right">{currencyFormatter.format(disclosure.closingCosts.points)}</td>
                </tr>
                <tr className="border-t border-charney-light-gray">
                  <td className="py-2"><strong>C. Title &amp; Escrow Charges</strong></td>
                  <td className="py-2 text-right">{currencyFormatter.format(disclosure.closingCosts.closingFee + disclosure.closingCosts.titleInsurance)}</td>
                </tr>
                <tr>
                  <td className="py-2 pl-6">01. Closing Fee</td>
                  <td className="py-2 text-right">{currencyFormatter.format(disclosure.closingCosts.closingFee)}</td>
                </tr>
                <tr>
                  <td className="py-2 pl-6">02. Title Insurance</td>
                  <td className="py-2 text-right">{currencyFormatter.format(disclosure.closingCosts.titleInsurance)}</td>
                </tr>
                <tr className="border-t border-charney-light-gray">
                  <td className="py-2 pl-6">03. Other Closing Costs</td>
                  <td className="py-2 text-right">{currencyFormatter.format(disclosure.closingCosts.other)}</td>
                </tr>
                <tr className="border-t-2 border-charney-black text-base font-black">
                  <td className="py-3">Total Closing Costs (J)</td>
                  <td className="py-3 text-right">{currencyFormatter.format(totalClosing)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
        <footer className="flex justify-end gap-3 border-t border-charney-light-gray px-8 py-5">
          <button type="button" className="btn btn-outline text-xs uppercase" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
