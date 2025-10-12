import { useState, useMemo } from 'react';
import { useToast } from '../../../context/ToastContext.jsx';
import { paymentQueueMock } from '../../../mocks/paymentsMockData.ts';
import SchedulePayoutModal from './SchedulePayoutModal.jsx';

export default function PayoutQueue() {
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const { pushToast } = useToast();

  // Filter to only show items ready for payout with valid conditions
  const payoutItems = useMemo(() =>
    paymentQueueMock.filter(item =>
      item.status === 'ready' &&
      item.bank_account !== null &&
      item.payout_amount > 0  // Exclude zero or negative amounts
    ),
    []
  );

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
    // TODO: Implement actual payout scheduling logic
    console.log('Scheduling payout:', payoutData);

    // Clear selections after successful scheduling
    setSelectedItems(new Set());
    setShowModal(false);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-charney-black dark:text-charney-white">
            Payout Queue
          </h3>
          <p className="text-sm text-charney-gray">
            {payoutItems.length} transactions ready for payout
          </p>
        </div>
        
        {selectedItems.size > 0 && (
          <button
            onClick={handleSchedulePayout}
            className="bg-charney-red text-charney-white px-4 py-2 rounded-lg font-medium hover:bg-charney-black transition-colors"
          >
            Schedule Payout ({selectedItems.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-charney-light-gray bg-white shadow-sm dark:border-charney-gray/70 dark:bg-charney-charcoal/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-charney-cream dark:bg-charney-slate">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === payoutItems.length && payoutItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-charney-gray focus:ring-charney-red"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-charney-black dark:text-charney-white">
                  Agent Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-charney-black dark:text-charney-white">
                  Property Address
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-charney-black dark:text-charney-white">
                  Net Payout
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-charney-black dark:text-charney-white">
                  Created Date
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-charney-black dark:text-charney-white">
                  ACH Ready
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charney-light-gray dark:divide-charney-gray/30">
              {payoutItems.map((item) => (
                <tr 
                  key={item.id}
                  className={`hover:bg-charney-cream/50 dark:hover:bg-charney-slate/30 ${
                    selectedItems.has(item.id) ? 'bg-charney-cream/30 dark:bg-charney-slate/20' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded border-charney-gray focus:ring-charney-red"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-charney-black dark:text-charney-white">
                    {item.agent.full_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-charney-gray">
                    {item.transaction.property_address}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-charney-black dark:text-charney-white">
                    {formatCurrency(item.payout_amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-charney-gray">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.auto_ach ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        ACH Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Manual
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
