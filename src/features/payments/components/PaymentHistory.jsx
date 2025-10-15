import { useState, useEffect } from 'react';
import { usePaymentHistory } from '../hooks/usePaymentsAPI';

export default function PaymentHistory() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [achFilter, setAchFilter] = useState('all');
  const [historyData, setHistoryData] = useState([]);

  const { fetchPaymentHistory, isLoading } = usePaymentHistory();

  // Load payment history data when filters change
  useEffect(() => {
    const loadPaymentHistory = async () => {
      const data = await fetchPaymentHistory({
        status: statusFilter,
        achMethod: achFilter,
        limit: 100
      });
      setHistoryData(data);
    };

    loadPaymentHistory();
  }, [fetchPaymentHistory, statusFilter, achFilter]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Pending';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      paid: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-400',
        label: 'Paid'
      },
      scheduled: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-400',
        label: 'Scheduled'
      },
      ready: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-400',
        label: 'Ready'
      }
    };

    const badge = badges[status] || badges.ready;
    return (
      <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-bold uppercase ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getAchBadge = (achReference) => {
    if (achReference) {
      return (
        <span className="inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-bold uppercase bg-purple-100 text-purple-800">
          ACH
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-bold uppercase bg-gray-100 text-gray-800">
        Manual
      </span>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-charney-charcoal rounded-xl border border-charney-light-gray dark:border-charney-gray/30 p-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-charney-red"></div>
          </div>
          <h3 className="mt-2 text-sm font-medium text-charney-black dark:text-charney-white">
            Loading Payment History...
          </h3>
          <p className="mt-1 text-sm text-charney-gray">
            Fetching transaction records
          </p>
        </div>
      </div>
    );
  }

  if (historyData.length === 0) {
    return (
      <div className="rounded-xl border border-charney-light-gray bg-white p-8 shadow-sm dark:border-charney-gray/70 dark:bg-charney-charcoal/50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-charney-cream flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-charney-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-charney-black dark:text-charney-white mb-2">
            No Payment History
          </h3>
          <p className="text-sm text-charney-gray">
            No payments match your current filter criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-2xl font-black tracking-tighter">
            Payment <span className="text-charney-red">History</span>
          </h3>
          <p className="text-sm text-charney-gray">
            {historyData.length} payment{historyData.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-charney-light-gray text-sm bg-white dark:bg-charney-charcoal dark:border-charney-gray focus:ring-2 focus:ring-charney-red focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="scheduled">Scheduled</option>
            <option value="ready">Ready</option>
          </select>

          <select
            value={achFilter}
            onChange={(e) => setAchFilter(e.target.value)}
            className="px-3 py-2 border border-charney-light-gray text-sm bg-white dark:bg-charney-charcoal dark:border-charney-gray focus:ring-2 focus:ring-charney-red focus:border-transparent"
          >
            <option value="all">All Methods</option>
            <option value="ach">ACH Only</option>
            <option value="manual">Manual Only</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto" role="region" aria-label="Payment history">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="p-4">Agent</th>
              <th className="p-4">Property</th>
              <th className="p-4 text-center">Amount</th>
              <th className="p-4">Payout Date</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Method</th>
              <th className="p-4">Reference</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10"
              >
                <td className="p-4 font-bold">
                  {item.agent.full_name}
                </td>
                <td className="p-4 text-charney-gray">
                  {item.transaction.property_address}
                </td>
                <td className="p-4 text-center text-charney-gray">
                  {formatCurrency(item.payout_amount)}
                </td>
                <td className="p-4 text-charney-gray">
                  {formatDate(item.paid_at || item.scheduled_at)}
                </td>
                <td className="p-4 text-center">
                  {getStatusBadge(item.status)}
                </td>
                <td className="p-4 text-center">
                  {getAchBadge(item.ach_reference)}
                </td>
                <td className="p-4 text-charney-gray font-mono">
                  {item.ach_reference || item.id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-charney-cream/30 dark:bg-charney-slate/30 rounded-lg p-4">
          <p className="text-sm font-medium text-charney-gray">Total Paid</p>
          <p className="text-xl font-bold text-charney-black dark:text-charney-white">
            {formatCurrency(
              historyData
                .filter(item => item.status === 'paid')
                .reduce((sum, item) => sum + item.payout_amount, 0)
            )}
          </p>
        </div>
        <div className="bg-charney-cream/30 dark:bg-charney-slate/30 rounded-lg p-4">
          <p className="text-sm font-medium text-charney-gray">ACH Payments</p>
          <p className="text-xl font-bold text-charney-black dark:text-charney-white">
            {historyData.filter(item => item.ach_reference).length}
          </p>
        </div>
        <div className="bg-charney-cream/30 dark:bg-charney-slate/30 rounded-lg p-4">
          <p className="text-sm font-medium text-charney-gray">Manual Payments</p>
          <p className="text-xl font-bold text-charney-black dark:text-charney-white">
            {historyData.filter(item => !item.ach_reference).length}
          </p>
        </div>
      </div>
    </div>
  );
}
