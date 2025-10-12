import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { formatCurrency } from '../lib/formatters.js';

export default function CoordinatorWeeklyVolume() {
  const { commissions } = useDashboardContext();

  const totalVolume = useMemo(
    () => commissions.reduce((acc, commission) => acc + commission.salePrice, 0),
    [commissions],
  );

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-2xl font-black tracking-tighter">
        Weekly <span className="text-charney-red">Volume</span>
      </h3>
      <p className="text-sm text-charney-gray">Total pipeline volume for active deals:</p>
      <p className="mt-2 text-3xl font-black">{formatCurrency(totalVolume, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
    </div>
  );
}
