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
  const { transactions, showPdfAudit, isRefreshing, isAuthenticated, isInitialized } = useDashboardContext();
  const [isExpanded, setIsExpanded] = useState(false);

  // Enhanced debug logging
  console.log('CoordinatorQueueTable Debug:', {
    transactionCount: transactions?.length || 0,
    isRefreshing,
    isAuthenticated,
    isInitialized,
    hasTransactions: Array.isArray(transactions) && transactions.length > 0
  });

  const rows = useMemo(
    () =>
      transactions.map((transaction) => ({
        ...transaction,
        // Use the pre-calculated agent payout amount that matches RPC calculation
        displayAmount: transaction.agentPayout || 0,
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

  // Show loading/auth states after hooks
  if (!isAuthenticated) {
    return (
      <div className="card p-6">
        <div className="text-center text-gray-500">
          <p>🔐 Waiting for authentication...</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="card p-6">
        <div className="text-center text-gray-500">
          <p>⏳ Loading transaction data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tighter">
          Commission <span className="text-charney-red">Queue</span>
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({transactions.length} transactions)
          </span>
        </h3>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-charney-red px-3 py-1 text-sm text-white hover:bg-charney-red/90"
        >
          Refresh Page
        </button>
      </div>
      <div className="overflow-x-auto" role="region" aria-label="Commission queue">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="p-4">Agent</th>
              <th className="p-4">Property</th>
              <th className="p-4">Agent Payout</th>
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
                <td className="p-4">{formatCurrency(transaction.displayAmount)}</td>
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