import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { formatCurrency } from '../lib/formatters.js';

const statusColors = {
  'Needs Review': 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-blue-100 text-blue-800',
  Paid: 'bg-green-100 text-green-800',
  'Awaiting Info': 'bg-orange-100 text-orange-800',
};

const CoordinatorQueueTable = () => {
  const { commissions, showPdfAudit } = useDashboardContext();

  const rows = useMemo(
    () =>
      commissions.map((commission) => ({
        ...commission,
        totalCommission: commission.salePrice * (commission.grossCommissionRate / 100),
        statusClass: statusColors[commission.status] ?? 'bg-gray-100 text-gray-800',
      })),
    [commissions],
  );

  const handleProcessClick = (e, commissionId) => {
    e.preventDefault();
    e.stopPropagation();
    showPdfAudit(commissionId);
  };

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
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((commission) => (
              <tr
                key={commission.id}
                className="hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10"
              >
                <td className="p-4">{commission.broker}</td>
                <td className="p-4">{commission.propertyAddress}</td>
                <td className="p-4">{formatCurrency(commission.totalCommission)}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2 py-1 text-xs ${commission.statusClass}`}>
                    {commission.status}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    type="button"
                    onClick={(e) => handleProcessClick(e, commission.id)}
                    className="rounded bg-charney-red px-4 py-2 text-sm font-medium text-white hover:bg-charney-red/90 transition-colors"
                  >
                    Process
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoordinatorQueueTable;