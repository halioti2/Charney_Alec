export default function CommissionTRIDModal({ record, onClose }) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="modal-content w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-charney-light-gray px-6 py-4">
          <h3 className="text-xl font-black uppercase tracking-tight">Estimated Closing Disclosure</h3>
          <button type="button" className="text-2xl" onClick={onClose} aria-label="Close disclosure modal">
            &times;
          </button>
        </header>
        <div className="space-y-6 p-6 text-sm" id="trid-form-printable">
          <section>
            <h4 className="border-b border-charney-light-gray pb-2 text-lg font-black uppercase tracking-tight">Transaction Details</h4>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <p>
                <span className="text-xs font-bold uppercase text-charney-gray">Property</span>
                <br />
                {record.propertyAddress ?? 'N/A'}
              </p>
              <p>
                <span className="text-xs font-bold uppercase text-charney-gray">Sale Price</span>
                <br />
                {record.salePrice?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? 'N/A'}
              </p>
              <p>
                <span className="text-xs font-bold uppercase text-charney-gray">Buyer</span>
                <br />
                {record.buyerName ?? 'N/A'}
              </p>
              <p>
                <span className="text-xs font-bold uppercase text-charney-gray">Seller</span>
                <br />
                {record.sellerName ?? 'N/A'}
              </p>
            </div>
          </section>
        </div>
        <footer className="flex justify-end gap-3 border-t border-charney-light-gray px-6 py-4">
          <button type="button" className="btn btn-outline text-xs uppercase" onClick={onClose}>
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}
