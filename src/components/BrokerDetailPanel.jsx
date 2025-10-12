import { useEffect, useMemo, useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatCurrency } from '../lib/formatters.js';
import AuditTrailList from './AuditTrailList.jsx';

const DEFAULT_PLAN = {
  primarySplit: { agent: 70, brokerage: 30 },
  commissionCap: 20000,
  currentTowardsCap: 0,
  deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
};

function normalizeNumeric(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback;
  const numeric = typeof value === 'string' && value.trim() === '' ? fallback : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function planToFormState(plan) {
  const agentSplit = normalizeNumeric(plan?.primarySplit?.agent);
  const brokerageSplit =
    plan?.primarySplit?.brokerage != null
      ? normalizeNumeric(plan.primarySplit.brokerage)
      : Math.max(0, 100 - agentSplit);

  return {
    primarySplit: {
      agent: String(agentSplit),
      brokerage: String(brokerageSplit),
    },
    commissionCap: String(normalizeNumeric(plan?.commissionCap)),
    currentTowardsCap: String(normalizeNumeric(plan?.currentTowardsCap)),
    deductions: {
      franchiseFeePct: String(normalizeNumeric(plan?.deductions?.franchiseFeePct)),
      eoFee: String(normalizeNumeric(plan?.deductions?.eoFee)),
      transactionFee: String(normalizeNumeric(plan?.deductions?.transactionFee)),
    },
  };
}

function formStateToPlan(form) {
  const agentSplit = normalizeNumeric(form?.primarySplit?.agent);
  const deductions = form?.deductions ?? {};
  return {
    primarySplit: {
      agent: agentSplit,
      brokerage: Math.max(0, 100 - agentSplit),
    },
    commissionCap: normalizeNumeric(form?.commissionCap),
    currentTowardsCap: normalizeNumeric(form?.currentTowardsCap),
    deductions: {
      franchiseFeePct: normalizeNumeric(deductions.franchiseFeePct),
      eoFee: normalizeNumeric(deductions.eoFee),
      transactionFee: normalizeNumeric(deductions.transactionFee),
    },
  };
}

export default function BrokerDetailPanel({ commission, onClose, initialTab = 'history' }) {
  const { agentPlans, setAgentPlans, calculateCommission } = useDashboardContext();
  const { pushToast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [form, setForm] = useState(() => planToFormState(DEFAULT_PLAN));

  const contextPlan = useMemo(() => {
    if (!commission) return DEFAULT_PLAN;
    return agentPlans[commission.broker] ?? DEFAULT_PLAN;
  }, [agentPlans, commission]);

  useEffect(() => {
    if (!commission) return;
    setActiveTab(initialTab);
    setForm(planToFormState(contextPlan));
  }, [commission, contextPlan, initialTab]);

  const normalizedPlan = useMemo(() => formStateToPlan(form), [form]);

  useEffect(() => {
    if (!commission) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commission, onClose]);

  if (!commission) return null;

  const commissionCalc = calculateCommission(
    {
      salePrice: commission.salePrice ?? 0,
      grossCommissionRate: commission.grossCommissionRate ?? 0,
      referralFeePct: commission.referralFeePct ?? 0,
    },
    normalizedPlan,
  );

  const handleSplitChange = (value) => {
    setForm((prev) => {
      if (value === '') {
        return {
          ...prev,
          primarySplit: { agent: '', brokerage: '' },
        };
      }

      const agentSplit = Number(value);
      if (!Number.isFinite(agentSplit)) {
        return prev;
      }

      return {
        ...prev,
        primarySplit: {
          agent: value,
          brokerage: String(Math.max(0, 100 - agentSplit)),
        },
      };
    });
  };

  const handleSavePlan = () => {
    if (!commission) return;
    setAgentPlans((prev) => ({
      ...prev,
      [commission.broker]: normalizedPlan,
    }));
    pushToast({ message: `${commission.broker}'s plan saved.` });
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="broker-panel-title"
        className="relative z-10 ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-charney-slate"
      >
        <header className="flex items-center justify-between border-b border-charney-light-gray px-6 py-5 dark:border-charney-gray/70">
          <div>
            <p className="font-brand text-[0.65rem] font-black uppercase tracking-[0.35em] text-charney-gray">Agent Detail</p>
            <h2 id="broker-panel-title" className="font-brand text-2xl font-black uppercase tracking-tight text-charney-black dark:text-charney-cream">
              {commission.broker}
            </h2>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-charney-gray">{commission.email}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-charney-light-gray px-3 py-1 text-lg font-black leading-none text-charney-gray hover:bg-charney-light-gray/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-charney-red dark:border-charney-gray dark:text-charney-cream"
            onClick={onClose}
            aria-label="Close broker detail panel"
          >
            ×
          </button>
        </header>
        <nav className="flex border-b border-charney-light-gray px-6 dark:border-charney-gray/70">
          <button
            type="button"
            className={`py-3 text-sm font-black uppercase tracking-[0.28em] ${
              activeTab === 'history' ? 'border-b-4 border-charney-red text-charney-red' : 'border-b-4 border-transparent text-charney-gray'
            }`}
            data-testid="panel-tab-history"
            onClick={() => setActiveTab('history')}
          >
            Transaction History
          </button>
          <button
            type="button"
            className={`ml-6 py-3 text-sm font-black uppercase tracking-[0.28em] ${
              activeTab === 'plan' ? 'border-b-4 border-charney-red text-charney-red' : 'border-b-4 border-transparent text-charney-gray'
            }`}
            data-testid="panel-tab-plan"
            onClick={() => setActiveTab('plan')}
          >
            Commission Plan
          </button>
        </nav>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'history' ? (
            <div className="space-y-5">
              <div className="rounded-[18px] border border-charney-light-gray bg-white p-5 shadow-sm dark:border-charney-gray/70 dark:bg-charney-charcoal/50">
                <h3 className="font-brand text-[0.75rem] font-black uppercase tracking-[0.4em] text-charney-gray">Snapshot</h3>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <p>
                    <strong>Status:</strong> {commission.status}
                  </p>
                  <p>
                    <strong>Score:</strong> {commission.score}
                  </p>
                  <p>
                    <strong>Property:</strong> {commission.property}
                  </p>
                  <p>
                    <strong>Sale Price:</strong> {formatCurrency(commission.salePrice)}
                  </p>
                </div>
              </div>
              <AuditTrailList events={commission.auditTrail ?? []} variant="panel" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-[18px] border border-charney-light-gray bg-white p-5 shadow-sm dark:border-charney-gray/70 dark:bg-charney-charcoal/50">
                <h3 className="font-brand text-[0.75rem] font-black uppercase tracking-[0.4em] text-charney-gray">Split &amp; Cap</h3>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.28em] text-charney-gray">
                    Agent Split (%)
                    <input
                      type="number"
                      className="rounded-md border border-charney-light-gray px-3 py-2 text-sm"
                      value={form.primarySplit.agent ?? ''}
                      onChange={(event) => handleSplitChange(event.target.value)}
                      onBlur={() =>
                        setForm((prev) => {
                          const agentValue = prev.primarySplit.agent === '' ? '0' : prev.primarySplit.agent;
                          const agentNumeric = Number(agentValue);
                          const brokerageValue = Number.isFinite(agentNumeric)
                            ? String(Math.max(0, 100 - agentNumeric))
                            : '0';
                          return {
                            ...prev,
                            primarySplit: {
                              agent: agentValue,
                              brokerage: brokerageValue,
                            },
                          };
                        })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.28em] text-charney-gray">
                    Brokerage Split (%)
                    <input
                      type="number"
                      className="rounded-md border border-charney-light-gray px-3 py-2 text-sm"
                      value={form.primarySplit.brokerage ?? ''}
                      readOnly
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.28em] text-charney-gray">
                    Commission Cap ($)
                    <input
                      type="number"
                      className="rounded-md border border-charney-light-gray px-3 py-2 text-sm"
                      value={form.commissionCap ?? ''}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          commissionCap: event.target.value,
                        }))
                      }
                      onBlur={() =>
                        setForm((prev) => ({
                          ...prev,
                          commissionCap: prev.commissionCap === '' ? '0' : prev.commissionCap,
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.28em] text-charney-gray">
                    Current Toward Cap ($)
                    <input
                      type="number"
                      className="rounded-md border border-charney-light-gray px-3 py-2 text-sm"
                      value={form.currentTowardsCap ?? ''}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          currentTowardsCap: event.target.value,
                        }))
                      }
                      onBlur={() =>
                        setForm((prev) => ({
                          ...prev,
                          currentTowardsCap: prev.currentTowardsCap === '' ? '0' : prev.currentTowardsCap,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="rounded-[18px] border border-charney-light-gray bg-white p-5 shadow-sm dark:border-charney-gray/70 dark:bg-charney-charcoal/50">
                <h3 className="font-brand text-[0.75rem] font-black uppercase tracking-[0.4em] text-charney-gray">Deductions</h3>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.28em] text-charney-gray">
                    Franchise Fee (%)
                    <input
                      type="number"
                      className="rounded-md border border-charney-light-gray px-3 py-2 text-sm"
                      value={form.deductions.franchiseFeePct ?? ''}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          deductions: {
                            ...prev.deductions,
                            franchiseFeePct: event.target.value,
                          },
                        }))
                      }
                      onBlur={() =>
                        setForm((prev) => ({
                          ...prev,
                          deductions: {
                            ...prev.deductions,
                            franchiseFeePct:
                              prev.deductions.franchiseFeePct === '' ? '0' : prev.deductions.franchiseFeePct,
                          },
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.28em] text-charney-gray">
                    E&amp;O Fee ($)
                    <input
                      type="number"
                      className="rounded-md border border-charney-light-gray px-3 py-2 text-sm"
                      value={form.deductions.eoFee ?? ''}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          deductions: {
                            ...prev.deductions,
                            eoFee: event.target.value,
                          },
                        }))
                      }
                      onBlur={() =>
                        setForm((prev) => ({
                          ...prev,
                          deductions: {
                            ...prev.deductions,
                            eoFee: prev.deductions.eoFee === '' ? '0' : prev.deductions.eoFee,
                          },
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-xs font-bold uppercase tracking-[0.28em] text-charney-gray">
                    Transaction Fee ($)
                    <input
                      type="number"
                      className="rounded-md border border-charney-light-gray px-3 py-2 text-sm"
                      value={form.deductions.transactionFee ?? ''}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          deductions: {
                            ...prev.deductions,
                            transactionFee: event.target.value,
                          },
                        }))
                      }
                      onBlur={() =>
                        setForm((prev) => ({
                          ...prev,
                          deductions: {
                            ...prev.deductions,
                            transactionFee:
                              prev.deductions.transactionFee === '' ? '0' : prev.deductions.transactionFee,
                          },
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="rounded-[18px] border border-charney-light-gray bg-white p-5 shadow-sm dark:border-charney-gray/70 dark:bg-charney-charcoal/50">
                <h3 className="font-brand text-[0.75rem] font-black uppercase tracking-[0.4em] text-charney-gray">Commission Snapshot</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex justify-between">
                    <span>Gross Commission Income</span>
                    <span>{formatCurrency(commissionCalc.gci)}</span>
                  </li>
                  <li className="flex justify-between text-charney-gray">
                    <span>Referral Fee</span>
                    <span>-{formatCurrency(commissionCalc.referralFee)}</span>
                  </li>
                  <li className="flex justify-between text-charney-gray">
                    <span>Franchise Fee</span>
                    <span>-{formatCurrency(commissionCalc.franchiseFee)}</span>
                  </li>
                  <li className="flex justify-between font-semibold">
                    <span>Agent Share</span>
                    <span>{formatCurrency(commissionCalc.agentShare)}</span>
                  </li>
                  <li className="flex justify-between font-black text-green-600">
                    <span>Agent Net Payout</span>
                    <span>{formatCurrency(commissionCalc.agentNet)}</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-end">
                <button type="button" className="btn btn-primary" onClick={handleSavePlan}>
                  Save Plan
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
