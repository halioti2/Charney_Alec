import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { formatCurrency } from '../lib/formatters.js';

export default function CommissionForecast() {
  const { commissions } = useDashboardContext();

  const { totalGci, monthlyProjection, quarterlyProjection } = useMemo(() => {
    const total = commissions.reduce(
      (acc, commission) => acc + commission.salePrice * (commission.grossCommissionRate / 100),
      0,
    );
    return {
      totalGci: total,
      monthlyProjection: total / 12,
      quarterlyProjection: total / 4,
    };
  }, [commissions]);

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-2xl font-black tracking-tighter">
        Commission <span className="text-charney-red">Forecast</span>
      </h3>
      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="font-bold uppercase text-charney-gray">Total Pipeline Commission</dt>
          <dd className="font-black">{formatCurrency(totalGci)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="font-bold uppercase text-charney-gray">Projected Monthly Commission</dt>
          <dd className="font-black text-charney-red">{formatCurrency(monthlyProjection)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="font-bold uppercase text-charney-gray">Projected Quarterly Commission</dt>
          <dd className="font-black">{formatCurrency(quarterlyProjection)}</dd>
        </div>
      </dl>
    </div>
  );
}
