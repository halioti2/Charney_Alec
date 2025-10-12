import { useState, useEffect, useMemo } from 'react';
import { calculateCommission } from '../lib/dashboardData.js';
import { formatCurrency } from '../lib/formatters.js';

export default function CommissionCalculationForm({ record, variant = 'plan' }) {
  const inputClasses =
    'w-full rounded-lg border border-charney-light-gray bg-[#FDF7F2] px-3 py-2 text-sm font-semibold text-charney-black shadow-inner focus:border-charney-red focus:outline-none dark:border-charney-gray dark:bg-charney-slate/70 dark:text-charney-cream';

  const sectionTitleClasses =
    'font-brand text-xs font-bold uppercase tracking-[0.2em] text-charney-gray';

  const [salePrice, setSalePrice] = useState(record.salePrice ?? 0);
  const [commissionRate, setCommissionRate] = useState(record.grossCommissionPercent ?? 0);
  const [referralPct, setReferralPct] = useState(record.referralFeePct ?? 0);

  useEffect(() => {
    setSalePrice(record.salePrice ?? 0);
    setCommissionRate(record.grossCommissionPercent ?? 0);
    setReferralPct(record.referralFeePct ?? 0);
  }, [record]);

  const plan = useMemo(() => {
    const agentSplit = record.agentSplitPercent ?? 70;
    const commissionCap = record.agent?.annual_cap_amount ?? 20000;
    const deductions = record.brokerage
      ? {
          franchiseFeePct: record.brokerage.franchiseFeePct ?? 0,
          eoFee: record.brokerage.eoFee ?? 0,
          transactionFee: record.brokerage.transactionFee ?? 0,
        }
      : { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 };

    return {
      primarySplit: { agent: agentSplit, brokerage: 100 - agentSplit },
      commissionCap,
      currentTowardsCap: record.agent?.currentTowardsCap ?? 0,
      deductions,
    };
  }, [record]);

  const commission = useMemo(
    () =>
      calculateCommission(
        {
          salePrice,
          grossCommissionRate: commissionRate,
          referralFeePct: referralPct,
        },
        plan,
      ),
    [salePrice, commissionRate, referralPct, plan],
  );

  const inputsMarkup = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="calc-sale-price" className={`${sectionTitleClasses} text-charney-red`}>
          Sale Price
        </label>
        <input
          id="calc-sale-price"
          type="number"
          className={inputClasses}
          value={salePrice}
          onChange={(event) => setSalePrice(Number(event.target.value))}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="calc-gross-rate" className={`${sectionTitleClasses} text-charney-red`}>
          Gross Commission (%)
        </label>
        <input
          id="calc-gross-rate"
          type="number"
          className={inputClasses}
          value={commissionRate}
          onChange={(event) => setCommissionRate(Number(event.target.value))}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="calc-referral-fee" className={`${sectionTitleClasses} text-charney-red`}>
          Referral Fee (%)
        </label>
        <input
          id="calc-referral-fee"
          type="number"
          className={inputClasses}
          value={referralPct}
          onChange={(event) => setReferralPct(Number(event.target.value))}
        />
      </div>
    </div>
  );

  const breakdownMarkup = (
    <ul className="space-y-1 text-sm text-charney-black dark:text-charney-cream">
      <li className="flex justify-between font-medium">
        <span>Gross Commission Income (GCI)</span>
        <strong>{formatCurrency(commission.gci)}</strong>
      </li>
      <li className="flex justify-between text-charney-gray">
        <span>Referral Fee</span>
        <span>-{formatCurrency(commission.referralFee)}</span>
      </li>
      <li className="flex justify-between text-charney-gray">
        <span>Franchise Fee ({plan.deductions.franchiseFeePct}%)</span>
        <span>-{formatCurrency(commission.franchiseFee)}</span>
      </li>
      <li className="flex justify-between border-t border-charney-light-gray pt-2 font-bold dark:border-charney-gray">
        <span>Adjusted GCI for Split</span>
        <span>{formatCurrency(commission.adjustedGci)}</span>
      </li>
      <li className="flex justify-between pt-3 font-bold">
        <span>Agent Share ({commission.agentSplit}%)</span>
        <span>{formatCurrency(commission.agentShare)}</span>
      </li>
      <li className="flex justify-between text-charney-gray">
        <span>E&amp;O Insurance Fee</span>
        <span>-{formatCurrency(commission.eoFee)}</span>
      </li>
      <li className="flex justify-between text-charney-gray">
        <span>Transaction Fee</span>
        <span>-{formatCurrency(commission.transactionFee)}</span>
      </li>
      <li className="flex justify-between border-t-2 border-charney-black pt-3 text-lg font-black text-green-600">
        <span>Agent Net Payout</span>
        <span>{formatCurrency(commission.agentNet)}</span>
      </li>
    </ul>
  );

  if (variant === 'history') {
    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-charney-light-gray bg-charney-white p-6 shadow-charney dark:border-charney-gray/40 dark:bg-charney-slate/80">
          <h6 className="font-brand text-xs font-bold uppercase tracking-[0.25em] text-charney-red">Deal Inputs</h6>
          <div className="mt-4 grid grid-cols-1 gap-4">{inputsMarkup}</div>
        </section>
        <section className="rounded-2xl border border-charney-light-gray bg-charney-white p-6 shadow-charney dark:border-charney-gray/40 dark:bg-charney-slate/80">
          <h6 className="font-brand text-xs font-bold uppercase tracking-[0.25em] text-charney-red">Commission Breakdown</h6>
          <div className="mt-4">{breakdownMarkup}</div>
        </section>
        <section className="rounded-2xl border border-charney-light-gray bg-charney-white p-6 shadow-charney dark:border-charney-gray/40 dark:bg-charney-slate/80">
          <h6 className="font-brand text-xs font-bold uppercase tracking-[0.25em] text-charney-gray">Plan Defaults</h6>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm text-charney-black dark:text-charney-cream">
            <div>
              <dt className="font-semibold uppercase tracking-wide text-charney-gray">Agent Split</dt>
              <dd className="mt-1 text-base font-black text-charney-black dark:text-charney-cream">
                {plan.primarySplit.agent}%
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-charney-gray">Brokerage Split</dt>
              <dd className="mt-1 text-base font-black text-charney-black dark:text-charney-cream">
                {plan.primarySplit.brokerage}%
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-charney-gray">Cap Remaining</dt>
              <dd className="mt-1 text-base font-black text-charney-black dark:text-charney-cream">
                {formatCurrency(Math.max(plan.commissionCap - plan.currentTowardsCap, 0))}
              </dd>
            </div>
            <div>
              <dt className="font-semibold uppercase tracking-wide text-charney-gray">Standard Fees</dt>
              <dd className="mt-1 space-y-1 text-sm text-charney-gray">
                <p>Franchise {plan.deductions.franchiseFeePct}%</p>
                <p>E&amp;O {formatCurrency(plan.deductions.eoFee)}</p>
                <p>Transaction {formatCurrency(plan.deductions.transactionFee)}</p>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {inputsMarkup}
      <div className="space-y-3">
        <h4 className="font-brand text-xl font-black uppercase tracking-tighter text-charney-black dark:text-charney-cream">
          Commission Breakdown
        </h4>
        {breakdownMarkup}
      </div>
    </div>
  );
}
