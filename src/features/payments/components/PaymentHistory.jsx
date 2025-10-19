import { useState, useMemo } from 'react';
import { useToast } from '../../../context/ToastContext.jsx';
import { useDashboardContext } from '../../../context/DashboardContext.jsx';

export default function PaymentHistory() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [achFilter, setAchFilter] = useState('all');
  const [processingActions, setProcessingActions] = useState(new Set());

  const { paymentHistory, isRefreshingPayments, refetchPaymentData } = useDashboardContext();
  const { pushToast } = useToast();

  // Filter payment history data based on filters
  const filteredHistoryData = useMemo(() => {
    try {
      if (!Array.isArray(paymentHistory)) {
        console.warn('PaymentHistory: paymentHistory is not an array:', paymentHistory);
        return [];
      }

      let filtered = paymentHistory;

      if (statusFilter !== 'all') {
        filtered = filtered.filter(item => {
          if (!item) return false;
          
          try {
            if (statusFilter === 'paid') return item.status === 'paid';
            if (statusFilter === 'scheduled') return item.status === 'scheduled';
            if (statusFilter === 'ready') return item.status === 'ready';
            return true;
          } catch (error) {
            console.error('Error filtering item by status:', error, item);
            return false;
          }
        });
      }

      if (achFilter !== 'all') {
        filtered = filtered.filter(item => {
          if (!item) return false;
          
          try {
            if (achFilter === 'ach') return item.auto_ach === true;
            if (achFilter === 'manual') return item.auto_ach === false || item.auto_ach === null;
            return true;
          } catch (error) {
            console.error('Error filtering item by ACH:', error, item);
            return false;
          }
        });
      }

      console.log('PaymentHistory filter applied:', {
        statusFilter,
        achFilter,
        totalItems: paymentHistory.length,
        filteredItems: filtered.length
      });

      return filtered;
    } catch (error) {
      console.error('Error in PaymentHistory filtering:', error);
      return [];
    }
  }, [paymentHistory, statusFilter, achFilter]);

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

  const getAchBadge = (paymentMethod) => {
    if (paymentMethod === 'ach') {
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

  // Get auth token helper
  const getAuthToken = () => {
    return localStorage.getItem('supabase.auth.token') || 
           JSON.parse(localStorage.getItem('sb-' + process.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token'))?.access_token;
  };

  // Payment action handlers
  const handleMarkAsPaid = async (item) => {
    const payoutId = item._rawTransaction?.payout_id || item.id;
    setProcessingActions(prev => new Set([...prev, payoutId]));

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/.netlify/functions/update-payout-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          payout_id: payoutId,
          new_status: 'paid',
          paid_at: new Date().toISOString(),
          notes: 'Manually marked as paid via payment history'
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to mark as paid');
      }

      await refetchPaymentData();
      pushToast({
        message: `Payment for ${item.broker} marked as paid`,
        type: "success"
      });

    } catch (error) {
      console.error('Error marking payment as paid:', error);
      pushToast({
        message: `Error: ${error.message}`,
        type: "error"
      });
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(payoutId);
        return newSet;
      });
    }
  };

  const handleProcessACH = async (item) => {
    const payoutId = item._rawTransaction?.payout_id || item.id;
    setProcessingActions(prev => new Set([...prev, payoutId]));

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/.netlify/functions/process-ach-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          payout_id: payoutId,
          ach_provider: 'stripe', // Default provider
          test_mode: process.env.NODE_ENV !== 'production'
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process ACH payment');
      }

      await refetchPaymentData();
      pushToast({
        message: `ACH payment initiated for ${item.broker}`,
        type: "success"
      });

    } catch (error) {
      console.error('Error processing ACH payment:', error);
      pushToast({
        message: `ACH Error: ${error.message}`,
        type: "error"
      });
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(payoutId);
        return newSet;
      });
    }
  };

  const handleRetryPayment = async (item) => {
    const payoutId = item._rawTransaction?.payout_id || item.id;
    setProcessingActions(prev => new Set([...prev, payoutId]));

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      // First update status back to scheduled
      const response = await fetch('/.netlify/functions/update-payout-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          payout_id: payoutId,
          new_status: 'scheduled',
          notes: 'Retrying payment from payment history'
        }),
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to retry payment');
      }

      await refetchPaymentData();
      pushToast({
        message: `Payment for ${item.broker} rescheduled for retry`,
        type: "success"
      });

    } catch (error) {
      console.error('Error retrying payment:', error);
      pushToast({
        message: `Retry Error: ${error.message}`,
        type: "error"
      });
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(payoutId);
        return newSet;
      });
    }
  };

  // Determine which actions are available for each item
  const getAvailableActions = (item) => {
    const paymentStatus = item._rawTransaction?.payment_status;
    const isPaid = !!item._rawTransaction?.paid_at;
    const payoutId = item._rawTransaction?.payout_id || item.id;
    const isProcessing = processingActions.has(payoutId);

    if (isPaid) return []; // No actions for completed payments
    
    const actions = [];
    
    if (paymentStatus === 'scheduled' || paymentStatus === 'ready') {
      actions.push({ 
        label: 'Mark as Paid', 
        handler: () => handleMarkAsPaid(item),
        className: 'bg-green-600 hover:bg-green-700 text-white'
      });
      
      if (item.auto_ach) {
        actions.push({ 
          label: 'Process ACH', 
          handler: () => handleProcessACH(item),
          className: 'bg-blue-600 hover:bg-blue-700 text-white'
        });
      }
    }
    
    if (paymentStatus === 'failed') {
      actions.push({ 
        label: 'Retry', 
        handler: () => handleRetryPayment(item),
        className: 'bg-orange-600 hover:orange-700 text-white'
      });
    }

    return actions.map(action => ({
      ...action,
      disabled: isProcessing
    }));
  };

  // Loading state
  if (isRefreshingPayments) {
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

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-2xl font-black tracking-tighter">
            Payment <span className="text-charney-red">History</span>
          </h3>
          <p className="text-sm text-charney-gray">
            {filteredHistoryData.length} payment{filteredHistoryData.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Filters - Always show so user can change filter even when no results */}
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

      {/* Content: Show either data table or empty state */}
      {filteredHistoryData.length === 0 ? (
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
              No payments match your current filter criteria. Try selecting "All Status" to see all payments.
            </p>
          </div>
        </div>
      ) : (
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
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistoryData.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10"
                >
                  <td className="p-4 font-bold">
                    {item.broker}
                  </td>
                  <td className="p-4 text-charney-gray">
                    {item.propertyAddress}
                  </td>
                  <td className="p-4 text-center text-charney-gray">
                    {formatCurrency(item.payout_amount || 0)}
                  </td>
                  <td className="p-4 text-charney-gray">
                    {formatDate(item.paid_at || item.scheduled_at)}
                  </td>
                  <td className="p-4 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="p-4 text-center">
                    {getAchBadge(item.auto_ach ? 'ach' : 'manual')}
                  </td>
                  <td className="p-4 text-charney-gray font-mono">
                    {item.ach_reference || item.batch_id || item.id}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {getAvailableActions(item).map((action, index) => (
                        <button
                          key={index}
                          onClick={action.handler}
                          disabled={action.disabled}
                          className={`px-3 py-1 text-xs font-bold uppercase rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.className}`}
                        >
                          {action.disabled ? 'Processing...' : action.label}
                        </button>
                      ))}
                      {getAvailableActions(item).length === 0 && (
                        <span className="text-xs text-charney-gray italic">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Summary Stats - Only show when there are results */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-charney-cream/30 dark:bg-charney-slate/30 rounded-lg p-4">
              <p className="text-sm font-medium text-charney-gray">Total Paid</p>
              <p className="text-xl font-bold text-charney-black dark:text-charney-white">
                {formatCurrency(
                  filteredHistoryData
                    .filter(item => item.status === 'paid')
                    .reduce((sum, item) => sum + (item.payout_amount || 0), 0)
                )}
              </p>
            </div>
            <div className="bg-charney-cream/30 dark:bg-charney-slate/30 rounded-lg p-4">
              <p className="text-sm font-medium text-charney-gray">ACH Payments</p>
              <p className="text-xl font-bold text-charney-black dark:text-charney-white">
                {filteredHistoryData.filter(item => item.auto_ach === true).length}
              </p>
            </div>
            <div className="bg-charney-cream/30 dark:bg-charney-slate/30 rounded-lg p-4">
              <p className="text-sm font-medium text-charney-gray">Manual Payments</p>
              <p className="text-xl font-bold text-charney-black dark:text-charney-white">
                {filteredHistoryData.filter(item => item.auto_ach === false || item.auto_ach === null).length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
