import { useMemo, useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { formatCurrency } from '../lib/formatters.js';

const statusColors = {
  'Needs Review': 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-blue-100 text-blue-800',
  Paid: 'bg-green-100 text-green-800',
  'Awaiting Info': 'bg-orange-100 text-orange-800',
};

const CoordinatorQueueTable = () => {
  const { transactions, showPdfAudit, isRefreshing } = useDashboardContext();
  const [isExpanded, setIsExpanded] = useState(false);

  const rows = useMemo(
    () =>
      transactions.map((transaction) => ({
        ...transaction,
        totalCommission: transaction.salePrice * (transaction.grossCommissionRate / 100),
        statusClass: statusColors[transaction.status] ?? 'bg-gray-100 text-gray-800',
      })),
    [transactions],
  );

  const displayedRows = isExpanded ? rows : rows.slice(0, 10);

  const handleProcessClick = (e, transaction) => {
    e.preventDefault();
    e.stopPropagation();
    // Pass the transaction ID for verification modal
    showPdfAudit(transaction.id);
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
            {displayedRows.map((transaction) => (
              <tr
                key={transaction.id}
                className="hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10"
              >
                <td className="p-4">{transaction.broker}</td>
                <td className="p-4">{transaction.propertyAddress}</td>
                <td className="p-4">{formatCurrency(transaction.totalCommission)}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2 py-1 text-xs ${transaction.statusClass}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    type="button"
                    onClick={(e) => handleProcessClick(e, transaction)}
                    className="rounded bg-charney-red px-4 py-2 text-sm font-medium text-white hover:bg-charney-red/90 transition-colors"
                  >
                    Process
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 10 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {isExpanded ? 'Show Less' : `Show More (${rows.length - 10} more)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorQueueTable;