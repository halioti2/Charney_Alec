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
    minimumFractionDigits: 0,
  });

export default function AgentPerformanceTable() {
  const { commissions } = useDashboardContext();

  const { setActiveCommissionId } = useDashboardContext();

  const rows = useMemo(
    () =>
      [...commissions]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 8)
        .map((commission) => {
          const gci = commission.salePrice * (commission.grossCommissionRate / 100);
          const disclosureLabel = commission.disclosureViewed ? 'Viewed' : 'Needs Viewing';
          const statusClass = statusColors[commission.status] ?? 'bg-gray-100 text-gray-800';
          return {
            ...commission,
            gci,
            disclosureLabel,
            statusClass,
          };
        }),
    [commissions],
  );

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-2xl font-black tracking-tighter">
        Agent <span className="text-charney-red">Performance</span>
      </h3>
      <div className="overflow-x-auto" role="region" aria-label="Agent performance">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="p-4">Agent</th>
              <th className="p-4 text-center">GCI (YTD)</th>
              <th className="p-4 text-center">Avg. Deal Time</th>
              <th className="p-4 text-center">Score</th>
              <th className="p-4 text-center">Disclosure Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((commission) => (
              <tr
                key={commission.id}
                className="cursor-pointer hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10"
                onClick={() => setActiveCommissionId(commission.id)}
              >
                <td className="p-4 font-bold" data-agent-name={commission.broker}>
                  {commission.broker}
                </td>
                <td className="p-4 text-center">{formatCurrency(commission.gci / 1000)}k</td>
                <td className="p-4 text-center">{commission.dealTime}d</td>
                <td className="p-4 text-center font-bold text-green-600">{commission.score}</td>
                <td className="p-4 text-center">
                  <span
                    className={`inline-flex rounded-sm px-3 py-1 text-xs font-bold uppercase ${
                      commission.disclosureViewed ? 'bg-charney-light-gray text-charney-gray' : 'bg-charney-red text-white'
                    }`}
                  >
                    {commission.disclosureLabel}
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
