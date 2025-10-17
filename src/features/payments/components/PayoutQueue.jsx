import { useState, useMemo } from 'react';
import { useToast } from '../../../context/ToastContext.jsx';
import { useDashboardContext } from '../../../context/DashboardContext.jsx';
import SchedulePayoutModal from './SchedulePayoutModal.jsx';

export default function PayoutQueue() {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showModal, setShowModal] = useState(false);

  const { pushToast } = useToast();
  const { 
    paymentData, 
    isRefreshingPayments, 
    refetchPaymentData 
  } = useDashboardContext();

  // Debug: Log payment data whenever it changes
  console.log('PayoutQueue received paymentData:', paymentData);
  console.log('PayoutQueue paymentData length:', paymentData?.length || 0);

  // Handle refresh manually when needed
  const handleRefresh = async () => {
    try {
      await refetchPaymentData();
      pushToast({
        message: "Payout queue refreshed successfully",
        type: "success"
      });
    } catch (error) {
      pushToast({
        message: `Error refreshing payout queue: ${error.message}`,
        type: "error"
      });
    }
  };

  // Calculate running total
  const totalPayout = useMemo(() =>
    paymentData
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + (item.payout_amount || 0), 0),
    [selectedItems, paymentData]
  );

  // Get selected items data
  const selectedItemsData = useMemo(() =>
    paymentData.filter(item => selectedItems.has(item.id)),
    [selectedItems, paymentData]
  );

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paymentData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(paymentData.map(item => item.id)));
    }
  };

  const handleSchedulePayout = () => {
    // Enhanced zero-selection guard
    if (selectedItems.size === 0) {
      pushToast({
        message: "Please select at least one transaction to schedule a payout.",
        type: "warning"
      });
      return;
    }

    // Additional validation: check for valid amounts
    const selectedItemsData = paymentData.filter(item => selectedItems.has(item.id));
    const invalidItems = selectedItemsData.filter(item => (item.payout_amount || 0) <= 0);

    if (invalidItems.length > 0) {
      pushToast({
        message: `Cannot schedule payout: ${invalidItems.length} transaction${invalidItems.length !== 1 ? 's have' : ' has'} invalid amount${invalidItems.length !== 1 ? 's' : ''}.`,
        type: "error"
      });
      return;
    }

    setShowModal(true);
  };

  const handleConfirmPayout = async (payoutData) => {
    const selectedItemsData = paymentData.filter(item => selectedItems.has(item.id));

    try {
      // Get the auth token from local storage or context (following same pattern as coordinator)
      const token = localStorage.getItem('supabase.auth.token') || 
                   JSON.parse(localStorage.getItem('sb-' + process.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token'))?.access_token;

      if (!token) {
        throw new Error('Authentication required');
      }

      // Process each selected payout individually for better error handling
      const results = [];
      for (const item of selectedItemsData) {
        try {
          const response = await fetch('/.netlify/functions/schedule-payout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              payout_id: item.id,
              ach_enabled: payoutData.achEnabled,
              scheduled_date: new Date().toISOString(), // Schedule for immediate processing
              notes: `Batch scheduled via payout queue on ${new Date().toLocaleDateString()}`
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || `Failed to schedule payout ${item.id}`);
          }

          results.push({ success: true, payout_id: item.id, result });
        } catch (error) {
          console.error(`Error scheduling payout ${item.id}:`, error);
          results.push({ success: false, payout_id: item.id, error: error.message });
        }
      }

      // Count successful and failed operations
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      // Refresh payment data regardless of success/failure
      await refetchPaymentData();
      setSelectedItems(new Set());
      setShowModal(false);

      // Show appropriate toast message
      if (successCount > 0 && failureCount === 0) {
        pushToast({
          message: `Successfully scheduled ${successCount} payout${successCount !== 1 ? 's' : ''}`,
          type: "success"
        });
      } else if (successCount > 0 && failureCount > 0) {
        pushToast({
          message: `Scheduled ${successCount} payout${successCount !== 1 ? 's' : ''}, ${failureCount} failed`,
          type: "warning"
        });
      } else {
        pushToast({
          message: `Failed to schedule ${failureCount} payout${failureCount !== 1 ? 's' : ''}`,
          type: "error"
        });
      }

    } catch (error) {
      console.error('Error processing payout:', error);
      pushToast({
        message: `Error scheduling payout: ${error.message}`,
        type: "error"
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
            Loading Payout Queue...
          </h3>
          <p className="mt-1 text-sm text-charney-gray">
            Fetching ready transactions
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (paymentData.length === 0) {
    return (
      <div className="rounded-xl border border-charney-light-gray bg-white p-8 shadow-sm dark:border-charney-gray/70 dark:bg-charney-charcoal/50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-charney-cream flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-charney-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-charney-black dark:text-charney-white mb-2">
            No Payouts Ready
          </h3>
          <p className="text-sm text-charney-gray">
            All approved commissions have been paid out or are missing required information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-2xl font-black tracking-tighter">
        Payout <span className="text-charney-red">Queue</span>
      </h3>

      {/* Action Bar */}
      {selectedItems.size > 0 && (
        <div className="mb-4 flex items-center justify-between bg-charney-cream/30 dark:bg-charney-slate/30 rounded-sm p-3">
          <span className="text-sm font-medium text-charney-black dark:text-charney-white">
            {selectedItems.size} transaction{selectedItems.size !== 1 ? 's' : ''} selected • Total: {formatCurrency(totalPayout)}
          </span>
          <button
            onClick={handleSchedulePayout}
            className="bg-charney-red text-white px-4 py-2 text-sm font-bold uppercase hover:bg-charney-black transition-colors"
          >
            Schedule Payout
          </button>
        </div>
      )}

      <div className="overflow-x-auto" role="region" aria-label="Payout queue">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="p-4">
                <input
                  type="checkbox"
                  checked={selectedItems.size === paymentData.length && paymentData.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-charney-gray focus:ring-charney-red"
                />
              </th>
              <th className="p-4">Agent</th>
              <th className="p-4">Property</th>
              <th className="p-4 text-center">Net Payout</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-center">ACH Status</th>
            </tr>
          </thead>
          <tbody>
            {paymentData.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10"
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded border-charney-gray focus:ring-charney-red"
                  />
                </td>
                <td className="p-4 font-bold">
                  {item.broker}
                </td>
                <td className="p-4 text-charney-gray">
                  {item.propertyAddress}
                </td>
                <td className="p-4 text-center text-charney-gray">
                  {formatCurrency(item.salePrice * (item.grossCommissionRate / 100))}
                </td>
                <td className="p-4 text-charney-gray">
                  {formatDate(item.createdAt)}
                </td>
                <td className="p-4 text-center">
                  {/* Default to manual for now, could be enhanced based on agent settings */}
                  <span className="inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-bold uppercase bg-yellow-100 text-yellow-800">
                    Manual
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Running Total Panel */}
      {selectedItems.size > 0 && (
        <div className="rounded-lg bg-charney-red/10 border border-charney-red/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charney-black dark:text-charney-white">
                Selected for Payout
              </p>
              <p className="text-xs text-charney-gray">
                {selectedItems.size} transaction{selectedItems.size !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-charney-red">
                {formatCurrency(totalPayout)}
              </p>
              <p className="text-xs text-charney-gray">
                Total Amount
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Payout Modal */}
      <SchedulePayoutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedItems={selectedItemsData}
        totalAmount={totalPayout}
        onConfirm={handleConfirmPayout}
      />
    </div>
  );
}
