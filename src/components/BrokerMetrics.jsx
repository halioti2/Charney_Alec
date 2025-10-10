import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';

const formatCurrency = (value) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

const formatPercent = (value) => `${value.toFixed(1)}%`;

export default function BrokerMetrics() {
  const { commissions } = useDashboardContext();

  const metrics = useMemo(() => {
    if (!commissions.length) {
      return [
        { label: 'Commissions Paid (YTD)', value: '$0.00' },
        { label: 'Leases Signed (YTD)', value: '0' },
        { label: 'Avg Commission %', value: '0.0%' },
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
      { label: 'Leases Signed (YTD)', value: leasesSigned.toString() },
      { label: 'Avg Commission %', value: formatPercent(avgCommission) },
      { label: 'Active Agents', value: activeAgents.toString() },
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
