import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { formatCurrency, formatPercent, formatNumber } from '../lib/formatters.js';

export default function BrokerMetrics() {
  const { commissions } = useDashboardContext();

  const metrics = useMemo(() => {
    if (!commissions.length) {
      return [
      { label: 'Commissions Paid (YTD)', value: formatCurrency(0) },
      { label: 'Leases Signed (YTD)', value: '0' },
      { label: 'Avg Commission %', value: formatPercent(0, { maximumFractionDigits: 1 }) },
      { label: 'Active Agents', value: '0' },
      ];
    }

    const totalGci = commissions.reduce(
      (acc, commission) => acc + commission.salePrice * (commission.grossCommissionRate / 100),
      0,
    );
    const leasesSigned = commissions.length;
    const avgCommission = commissions.reduce((acc, commission) => acc + commission.grossCommissionRate, 0) / leasesSigned;
    const activeAgents = new Set(commissions.map((commission) => commission.broker)).size;

    return [
      { label: 'Commissions Paid (YTD)', value: formatCurrency(totalGci) },
      { label: 'Leases Signed (YTD)', value: formatNumber(leasesSigned) },
      { label: 'Avg Commission %', value: formatPercent(avgCommission, { maximumFractionDigits: 1 }) },
      { label: 'Active Agents', value: formatNumber(activeAgents) },
    ];
  }, [commissions]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value }) => (
        <div key={label} className="card key-metric-card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-charney-gray">{label}</h3>
          <p className="mt-2 text-4xl font-black">{value}</p>
        </div>
      ))}
    </div>
  );
}
