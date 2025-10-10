import { useState, useEffect } from 'react';
import { calculateCommission } from '../lib/dashboardData.js';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function CommissionCalculationForm({ record, variant = 'plan' }) {
  const [salePrice, setSalePrice] = useState(record.salePrice ?? 0);
  const [commissionRate, setCommissionRate] = useState(record.grossCommissionPercent ?? 0);
  const [referralPct, setReferralPct] = useState(record.referralFeePct ?? 0);

  useEffect(() => {
    setSalePrice(record.salePrice ?? 0);
    setCommissionRate(record.grossCommissionPercent ?? 0);
    setReferralPct(record.referralFeePct ?? 0);
  }, [record]);

  const agentSplit = record.agentSplitPercent ?? 70;
  const commissionCap = record.agent?.annual_cap_amount ?? 20000;
  const deductions = record.brokerage
    ? {
        franchiseFeePct: record.brokerage.franchiseFeePct ?? 0,
        eoFee: record.brokerage.eoFee ?? 0,
        transactionFee: record.brokerage.transactionFee ?? 0,
      }
    : { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 };

  const plan = {
    primarySplit: { agent: agentSplit, brokerage: 100 - agentSplit },
    commissionCap,
    currentTowardsCap: record.agent?.currentTowardsCap ?? 0,
    deductions,
  };

  const commission = calculateCommission(
    {
      salePrice,
      grossCommissionRate: commissionRate,
      referralFeePct: referralPct,
    },
    plan,
  );

  const inputsMarkup = (
    <div className="space-y-4">
      <div>
        <label htmlFor="calc-sale-price" className="form-label">
          Sale Price
        </label>
        <input
          id="calc-sale-price"
          type="number"
          className="form-input"
          value={salePrice}
          onChange={(event) => setSalePrice(Number(event.target.value))}
        />
      </div>
      <div>
        <label htmlFor="calc-gross-rate" className="form-label">
          Gross Commission (%)
        </label>
        <input
          id="calc-gross-rate"
          type="number"
          className="form-input"
          value={commissionRate}
          onChange={(event) => setCommissionRate(Number(event.target.value))}
        />
      </div>
      <div>
        <label htmlFor="calc-referral-fee" className="form-label">
          Referral Fee (%)
        </label>
        <input
          id="calc-referral-fee"
          type="number"
          className="form-input"
          value={referralPct}
          onChange={(event) => setReferralPct(Number(event.target.value))}
        />
      </div>
    </div>
  );

  const breakdownMarkup = (
    <ul className="space-y-1 text-sm">
      <li className="flex justify-between">
        <span>Gross Commission Income (GCI)</span>
        <strong>{currencyFormatter.format(commission.gci)}</strong>
      </li>
      <li className="flex justify-between text-charney-gray">
        <span>Referral Fee</span>
        <span>-{currencyFormatter.format(commission.referralFee)}</span>
      </li>
      <li className="flex justify-between text-charney-gray">
        <span>Franchise Fee ({plan.deductions.franchiseFeePct}%)</span>
        <span>-{currencyFormatter.format(commission.franchiseFee)}</span>
      </li>
      <li className="flex justify-between border-t border-charney-light-gray pt-2 font-bold">
        <span>Adjusted GCI for Split</span>
        <span>{currencyFormatter.format(commission.adjustedGci)}</span>
      </li>
      <li className="flex justify-between pt-3 font-bold">
        <span>Agent Share ({commission.agentSplit}%)</span>
        <span>{currencyFormatter.format(commission.agentShare)}</span>
      </li>
      <li className="flex justify-between text-charney-gray">
        <span>E&amp;O Insurance Fee</span>
        <span>-{currencyFormatter.format(commission.eoFee)}</span>
      </li>
      <li className="flex justify-between text-charney-gray">
        <span>Transaction Fee</span>
        <span>-{currencyFormatter.format(commission.transactionFee)}</span>
      </li>
      <li className="flex justify-between border-t-2 border-charney-black pt-3 text-lg font-black text-green-600">
        <span>Agent Net Payout</span>
        <span>{currencyFormatter.format(commission.agentNet)}</span>
      </li>
    </ul>
  );

  if (variant === 'history') {
    return (
      <div className="space-y-4">
        <div className="card rounded-lg border border-charney-light-gray bg-white p-5 shadow-sm">
          <h6 className="text-xs font-bold uppercase tracking-wider text-charney-red">Deal Inputs</h6>
          <div className="mt-3 grid grid-cols-1 gap-4">{inputsMarkup}</div>
        </div>
        <div className="card rounded-lg border border-charney-light-gray bg-white p-5 shadow-sm">
          <h6 className="text-xs font-bold uppercase tracking-wider text-charney-red">Commission Breakdown</h6>
          <div className="mt-3">{breakdownMarkup}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {inputsMarkup}
      <div className="space-y-2">
        <h4 className="text-xl font-black tracking-tighter">Commission Breakdown</h4>
        {breakdownMarkup}
      </div>
    </div>
  );
}
