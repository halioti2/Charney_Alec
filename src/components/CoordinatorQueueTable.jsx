import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';

const statusColors = {
  'Needs Review': 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-blue-100 text-blue-800',
  Paid: 'bg-green-100 text-green-800',
  'Awaiting Info': 'bg-orange-100 text-orange-800',
};

const formatCurrency = (value) =>
  value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

export default function CoordinatorQueueTable() {
  const { commissions } = useDashboardContext();

  const { setActiveCommissionId } = useDashboardContext();

  const rows = useMemo(
    () =>
      commissions.map((commission) => ({
        ...commission,
        totalCommission: commission.salePrice * (commission.grossCommissionRate / 100),
        statusClass: statusColors[commission.status] ?? 'bg-gray-100 text-gray-800',
      })),
    [commissions],
  );

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-2xl font-black tracking-tighter">
        Commission <span className="text-charney-red">Queue</span>
      </h3>
      <div className="overflow-x-auto" role="region" aria-label="Commission queue">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="p-4">Agent</th>
              <th className="p-4">Property</th>
              <th className="p-4">Total Commission</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((commission) => (
              <tr
                key={commission.id}
                className="cursor-pointer hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10"
                onClick={() => setActiveCommissionId(commission.id)}
              >
                <td className="p-4 font-bold">{commission.broker}</td>
                <td className="p-4 text-charney-gray">{commission.property}</td>
                <td className="p-4 text-charney-gray">{formatCurrency(commission.totalCommission)}</td>
                <td className="p-4">
                  <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-bold uppercase ${commission.statusClass}`}>
                    {commission.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
