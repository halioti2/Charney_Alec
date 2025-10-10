import { useState } from 'react';
import { useCommissionRecord } from '../hooks/useCommissionRecord.js';
import CommissionTRIDModal from './CommissionTRIDModal.jsx';
import CommissionCalculationForm from './CommissionCalculationForm.jsx';

export default function CommissionModal({ isOpen, onClose, commissionRecord: seedRecord, onAction }) {
  const record = useCommissionRecord(seedRecord);
  const [showTRID, setShowTRID] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="modal-content flex h-full w-full max-h-[90vh] max-w-5xl flex-col rounded-lg bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-charney-light-gray px-6 py-4">
            <h3 className="text-xl font-black uppercase">Commission Detail</h3>
            <button type="button" className="text-2xl" onClick={onClose} aria-label="Close modal">
              &times;
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <h4 className="text-2xl font-black uppercase">{record.agent?.name ?? 'Unknown Agent'}</h4>
                <p className="text-charney-gray">{record.agent?.email}</p>
                <p className="text-sm text-charney-gray">{record.propertyAddress}</p>
              </div>
              <section className="grid gap-6 lg:grid-cols-[1.25fr,1fr]">
                <div className="space-y-3 rounded-md border border-charney-light-gray p-4 text-sm">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-charney-gray">Original Email Chain</h5>
                  {record.evidence.length ? (
                    record.evidence.map((item) => {
                      const body = item.value ?? item.field_value_text ?? item.source_snippet ?? '';
                      return (
                        <article key={item.id}>
                          <p className="font-bold text-xs text-charney-red">
                            {item.actor} — {new Date(item.created_at).toLocaleString()}
                          </p>
                          <p className="mt-1" dangerouslySetInnerHTML={{ __html: body }} />
                        </article>
                      );
                    })
                  ) : (
                    <p className="text-charney-gray">No evidence attached yet.</p>
                  )}
                </div>
                <CommissionCalculationForm record={record} variant="history" />
              </section>
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-charney-light-gray px-6 py-4">
            <button type="button" className="btn btn-outline text-xs uppercase" onClick={() => setShowTRID(true)}>
              Generate Disclosure
            </button>
            <div className="ml-auto flex gap-3">
              <button type="button" className="btn btn-outline text-xs uppercase" onClick={() => onAction?.('request-info', record.id)}>
                Request Info
              </button>
              <button type="button" className="btn btn-outline text-xs uppercase" onClick={() => onAction?.('flag', record.id)}>
                Flag Conflict
              </button>
              <button type="button" className="btn btn-primary text-xs uppercase" onClick={() => onAction?.('approve', record.id)}>
                Approve Commission
              </button>
            </div>
          </footer>
        </div>
      </div>

      {showTRID && <CommissionTRIDModal record={record} onClose={() => setShowTRID(false)} />}
    </>
  );
}
