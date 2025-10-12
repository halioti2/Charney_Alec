import { useEffect, useMemo, useState } from 'react';
import { useCommissionRecord } from '../hooks/useCommissionRecord.js';
import { formatCurrency, formatPercent } from '../lib/formatters.js';
import CommissionTRIDModal from './CommissionTRIDModal.jsx';
import CommissionCalculationForm from './CommissionCalculationForm.jsx';
import AuditTrailList from './AuditTrailList.jsx';

const outlineButtonClasses =
  'inline-flex items-center justify-center rounded-[8px] border-2 border-charney-black px-8 py-3 font-brand text-xs font-black uppercase tracking-[0.35em] text-charney-black transition hover:bg-charney-black hover:text-charney-white focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red dark:border-charney-cream dark:text-charney-cream dark:hover:bg-charney-cream dark:hover:text-charney-charcoal';

const primaryButtonClasses =
  'inline-flex items-center justify-center rounded-[8px] border-2 border-charney-red bg-charney-red px-8 py-3 font-brand text-xs font-black uppercase tracking-[0.35em] text-charney-white transition hover:bg-[#E54545] focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red dark:border-charney-red dark:text-charney-charcoal';

export default function CommissionModal({ isOpen, onClose, commissionRecord: seedRecord, onAction, focus = 'full' }) {
  const record = useCommissionRecord(seedRecord);
  const [showTRID, setShowTRID] = useState(false);

  useEffect(() => {
    const legacyModal = document.getElementById('commission-modal');
    const legacyPanel = document.getElementById('broker-panel');
    const legacyOverlay = document.getElementById('panel-overlay');
    legacyModal?.classList.add('hidden');
    legacyModal?.classList.remove('flex');
    legacyPanel?.classList.remove('is-open');
    legacyOverlay?.classList.add('hidden');
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showTRID) {
          setShowTRID(false);
        } else {
          onClose?.();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showTRID, onClose]);

  const emailMessages = useMemo(() => record.evidence ?? [], [record.evidence]);

  const salePriceDisplay = typeof record.salePrice === 'number' ? formatCurrency(record.salePrice) : '—';

  const commissionDisplay =
    typeof record.grossCommissionPercent === 'number' ? formatPercent(record.grossCommissionPercent) : '—';

  const referralDisplay =
    record.referralFeePct && record.referralFeePct > 0
      ? `${formatPercent(record.referralFeePct, { maximumFractionDigits: 0 })} Referral`
      : 'No Referral';

  const showEmailChain = focus !== 'audit';
  const showCalculation = focus !== 'audit';
  const showFooterActions = focus !== 'audit';

  if (!isOpen) return null;

  if (showTRID && record) {
    return (
      <CommissionTRIDModal
        record={record}
        onClose={() => {
          setShowTRID(false);
          onClose?.();
        }}
      />
    );
  }

  if (focus === 'audit') {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 lg:justify-end">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="commission-audit-title"
          className="flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-[#fff9f4] shadow-charney dark:bg-charney-slate dark:text-charney-cream"
        >
          <header className="flex items-start justify-between border-b border-[#f0e2d8] bg-[#f9eee4] px-8 py-6 dark:border-charney-gray/40 dark:bg-charney-charcoal">
            <div>
              <p className="font-brand text-[0.65rem] font-black uppercase tracking-[0.38em] text-charney-gray">Audit Trail</p>
              <h3 id="commission-audit-title" className="mt-1 font-brand text-3xl font-black uppercase tracking-[-0.02em] text-charney-black dark:text-charney-cream">
                {record.agent?.name ?? 'Unknown Agent'}
              </h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-charney-gray">{record.propertyAddress ?? 'Property Unknown'}</p>
            </div>
            <button
              type="button"
              className="rounded-full border-2 border-charney-black bg-[#fff9f4] p-2 text-3xl leading-none text-charney-black transition hover:bg-charney-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red dark:bg-charney-slate dark:text-charney-cream"
              onClick={onClose}
              aria-label="Close audit trail"
            >
              &times;
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <AuditTrailList events={record.auditTrail ?? []} defaultCollapsed={false} variant="panel" />
          </div>
          <footer className="flex justify-end border-t border-[#f0e2d8] bg-[#f9eee4] px-8 py-6 dark:border-charney-gray/40 dark:bg-charney-charcoal">
            <button type="button" className={outlineButtonClasses} onClick={onClose}>
              Close
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="commission-modal-title"
        className="flex h-full w-full max-h-[90vh] max-w-6xl flex-col overflow-hidden rounded-[32px] bg-[#fff9f4] shadow-charney dark:bg-charney-slate dark:text-charney-cream"
      >
        <header className="flex items-start justify-between border-b border-[#f0e2d8] bg-[#f9eee4] px-10 py-8 dark:border-charney-gray/40 dark:bg-charney-charcoal">
          <div className="space-y-2">
            <p className="font-brand text-[0.65rem] font-black uppercase tracking-[0.38em] text-charney-gray">Commission Detail</p>
            <h3 id="commission-modal-title" className="font-brand text-4xl font-black uppercase tracking-[-0.02em] text-charney-black dark:text-charney-cream">
              {record.agent?.name ?? 'Unknown Agent'}
            </h3>
            <p className="inline-flex rounded-full bg-charney-white px-3 py-1 font-brand text-[0.65rem] font-black uppercase tracking-[0.35em] text-charney-red dark:bg-charney-slate">
              {record.status ?? 'Needs Review'}
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border-2 border-charney-black bg-[#fff9f4] p-2 text-3xl leading-none text-charney-black transition hover:bg-charney-black hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red dark:bg-charney-slate dark:text-charney-cream"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-10 py-8">
          <div className={showCalculation ? 'grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)]' : 'grid gap-8'}>
            <div className="space-y-8">
              {showEmailChain && (
                <section className="rounded-[28px] border border-[#f0e2d8] bg-white p-6 shadow-[0_20px_45px_-28px_rgba(41,37,33,0.28)] dark:border-charney-gray/40 dark:bg-charney-slate/80">
                  <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f4e8dc] pb-5 dark:border-charney-gray/40">
                    <div>
                      <h4 className="font-brand text-sm font-black uppercase tracking-[0.38em] text-charney-gray">Original Email Chain</h4>
                      <p className="mt-2 font-brand text-[0.75rem] font-black uppercase tracking-[0.4em] text-charney-red">
                        {emailMessages.length ? `${emailMessages.length} Messages` : 'No Messages Yet'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[0.65rem] font-black uppercase tracking-[0.35em] text-charney-gray">
                      <span className="rounded-full bg-[#fef1e7] px-3 py-1 text-charney-black dark:bg-charney-gray/40">
                        {record.propertyAddress ?? 'Unknown Property'}
                      </span>
                      <span className="rounded-full bg-[#fef1e7] px-3 py-1 text-charney-black dark:bg-charney-gray/40">{salePriceDisplay}</span>
                      <span className="rounded-full bg-[#fef1e7] px-3 py-1 text-charney-black dark:bg-charney-gray/40">{commissionDisplay}</span>
                      <span className="rounded-full bg-[#fef1e7] px-3 py-1 text-charney-black dark:bg-charney-gray/40">{referralDisplay}</span>
                    </div>
                  </header>
                  <div className="mt-6 space-y-5">
                    {emailMessages.length ? (
                      emailMessages.map((item) => {
                        const timestamp = item.created_at ? new Date(item.created_at) : null;
                        const formattedTime = timestamp && !Number.isNaN(timestamp.valueOf())
                          ? timestamp.toLocaleString()
                          : null;

                        return (
                          <article
                            key={item.id}
                            className="rounded-[22px] border border-[#f3e5d9] bg-[#fffdf9] p-5 shadow-[0_15px_28px_-24px_rgba(41,37,33,0.38)] dark:border-charney-gray/40 dark:bg-charney-charcoal/40"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.38em] text-charney-black">
                              <span>{item.actor}</span>
                              {item.recipient ? <span className="text-charney-gray">→ {item.recipient}</span> : null}
                              {formattedTime ? (
                                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-charney-gray">{formattedTime}</span>
                              ) : null}
                            </div>
                            <div
                              className="prose prose-sm mt-3 max-w-none font-sans text-charney-black prose-a:text-charney-red prose-strong:text-charney-black dark:text-charney-cream"
                              dangerouslySetInnerHTML={{ __html: item.value ?? '' }}
                            />
                          </article>
                        );
                      })
                    ) : (
                      <p className="rounded-xl border border-dashed border-charney-light-gray p-6 text-center font-brand text-xs uppercase tracking-[0.3em] text-charney-gray">
                        No evidence attached yet
                      </p>
                    )}
                  </div>
                </section>
              )}

              <section className="rounded-[28px] border border-[#f0e2d8] bg-white p-6 shadow-[0_20px_45px_-28px_rgba(41,37,33,0.28)] dark:border-charney-gray/40 dark:bg-charney-slate/80">
                <h5 className="font-brand text-xs font-black uppercase tracking-[0.38em] text-charney-gray">Audit Trail</h5>
                <div className="mt-4">
                  <AuditTrailList events={record.auditTrail ?? []} defaultCollapsed={false} showToggle variant="modal" />
                </div>
              </section>
            </div>

            {showCalculation && (
              <div className="space-y-8">
                <CommissionCalculationForm record={record} variant="history" />
              </div>
            )}
          </div>
        </div>

        {showFooterActions && (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0e2d8] bg-[#f9eee4] px-10 py-6 dark:border-charney-gray/40 dark:bg-charney-charcoal">
            <button type="button" className={outlineButtonClasses} onClick={() => setShowTRID(true)}>
              Generate Disclosure
            </button>
            <div className="ml-auto flex gap-3">
              <button type="button" className={outlineButtonClasses} onClick={() => onAction?.('request-info', record.id)}>
                Request Info
              </button>
              <button type="button" className={outlineButtonClasses} onClick={() => onAction?.('flag', record.id)}>
                Flag Conflict
              </button>
              <button type="button" className={primaryButtonClasses} onClick={() => onAction?.('approve', record.id)}>
                Approve Commission
              </button>
            </div>
          </footer>
        )}
        {!showFooterActions && (
          <footer className="flex justify-end border-t border-[#f0e2d8] bg-[#f9eee4] px-10 py-6 dark:border-charney-gray/40 dark:bg-charney-charcoal">
            <button type="button" className={outlineButtonClasses} onClick={onClose}>
              Close
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
