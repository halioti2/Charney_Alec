import { useState, useMemo, useEffect } from 'react';
import { useToast } from '../../../context/ToastContext.jsx';
import { usePayoutQueue, usePayoutScheduling } from '../hooks/usePaymentsAPI';
import SchedulePayoutModal from './SchedulePayoutModal.jsx';

export default function PayoutQueue() {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [payoutItems, setPayoutItems] = useState([]);

  const { pushToast } = useToast();
  const { fetchPayoutQueue, isLoading, error, clearError } = usePayoutQueue();
  const { schedulePayout, isScheduling } = usePayoutScheduling();

  // Load payout queue data on component mount
  useEffect(() => {
    const loadPayoutQueue = async () => {
      const data = await fetchPayoutQueue();
      setPayoutItems(data);
    };

    loadPayoutQueue();
  }, [fetchPayoutQueue]);

  // Handle API errors
  useEffect(() => {
    if (error) {
      pushToast({
        message: `Error loading payout queue: ${error}`,
        type: "error"
      });
      clearError();
    }
  }, [error, pushToast, clearError]);

  // Calculate running total
  const totalPayout = useMemo(() =>
    payoutItems
      .filter(item => selectedItems.has(item.id))
      .reduce((sum, item) => sum + item.payout_amount, 0),
    [selectedItems, payoutItems]
  );

  // Get selected items data
  const selectedItemsData = useMemo(() =>
    payoutItems.filter(item => selectedItems.has(item.id)),
    [selectedItems, payoutItems]
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
    if (selectedItems.size === payoutItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(payoutItems.map(item => item.id)));
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
    const selectedItemsData = payoutItems.filter(item => selectedItems.has(item.id));
    const invalidItems = selectedItemsData.filter(item => item.payout_amount <= 0);

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
    const selectedItemsData = payoutItems.filter(item => selectedItems.has(item.id));

    const result = await schedulePayout({
      selectedItems: selectedItemsData,
      achEnabled: payoutData.achEnabled,
      batchNote: payoutData.batchNote
    });

    if (result) {
      // Success - refresh the queue and clear selections
      const updatedData = await fetchPayoutQueue();
      setPayoutItems(updatedData);
      setSelectedItems(new Set());
      setShowModal(false);

      pushToast({
        message: `Successfully scheduled ${result.scheduledCount} payout${result.scheduledCount !== 1 ? 's' : ''} (Batch: ${result.batchId})`,
        type: "success"
      });
    }
    // Error handling is done by the hook and displayed via useEffect
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
  if (isLoading) {
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
  if (payoutItems.length === 0) {
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
                  checked={selectedItems.size === payoutItems.length && payoutItems.length > 0}
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
            {payoutItems.map((item) => (
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
                  {item.agent.full_name}
                </td>
                <td className="p-4 text-charney-gray">
                  {item.transaction.property_address}
                </td>
                <td className="p-4 text-center text-charney-gray">
                  {formatCurrency(item.payout_amount)}
                </td>
                <td className="p-4 text-charney-gray">
                  {formatDate(item.created_at)}
                </td>
                <td className="p-4 text-center">
                  {item.auto_ach ? (
                    <span className="inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-bold uppercase bg-green-100 text-green-800">
                      ACH
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-bold uppercase bg-yellow-100 text-yellow-800">
                      Manual
                    </span>
                  )}
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
