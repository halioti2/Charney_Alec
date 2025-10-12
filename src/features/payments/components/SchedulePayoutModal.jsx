import { useState } from 'react';
import { useToast } from '../../../context/ToastContext.jsx';

export default function SchedulePayoutModal({ 
  isOpen, 
  onClose, 
  selectedItems = [], 
  totalAmount = 0,
  onConfirm 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [achEnabled, setAchEnabled] = useState(false);
  const { pushToast } = useToast();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the onConfirm callback
      if (onConfirm) {
        await onConfirm({ achEnabled, selectedItems });
      }
      
      // Show success toast
      const method = achEnabled ? 'ACH transfer' : 'manual payout';
      pushToast({ 
        message: `${method} for ${selectedItems.length} transaction${selectedItems.length !== 1 ? 's' : ''} has been successfully scheduled.`,
        type: "success"
      });
      
      // Close modal
      onClose();
      
    } catch (error) {
      pushToast({ 
        message: "Failed to schedule payout. Please try again.",
        type: "error"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const achEligibleCount = selectedItems.filter(item => item.achEligible).length;
  const hasIneligibleItems = selectedItems.length > achEligibleCount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-charney-charcoal shadow-xl transition-all">
          {/* Header */}
          <div className="px-6 py-4 border-b border-charney-light-gray dark:border-charney-gray">
            <h3 className="text-lg font-semibold text-charney-black dark:text-charney-white">
              Schedule Payout
            </h3>
            <p className="text-sm text-charney-gray mt-1">
              Confirm payout details before processing
            </p>
          </div>
          
          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Summary */}
            <div className="bg-charney-cream/30 dark:bg-charney-slate/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-charney-gray">
                  Transactions Selected
                </span>
                <span className="text-sm font-semibold text-charney-black dark:text-charney-white">
                  {selectedItems.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-charney-gray">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-charney-red">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
            
            {/* ACH Option */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={achEnabled}
                    onChange={(e) => setAchEnabled(e.target.checked)}
                    disabled={achEligibleCount === 0}
                    className="rounded border-charney-gray focus:ring-charney-red disabled:opacity-50"
                  />
                  <div>
                    <span className="text-sm font-medium text-charney-black dark:text-charney-white">
                      Send immediately via ACH
                    </span>
                    <p className="text-xs text-charney-gray">
                      Automatic bank transfer (faster processing)
                    </p>
                  </div>
                </label>
              </div>
              
              {/* ACH Status */}
              <div className="text-xs space-y-1">
                {achEligibleCount > 0 && (
                  <p className="text-green-600 dark:text-green-400">
                    ✓ {achEligibleCount} transaction{achEligibleCount !== 1 ? 's' : ''} eligible for ACH
                  </p>
                )}
                {hasIneligibleItems && (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    ⚠ {selectedItems.length - achEligibleCount} transaction{selectedItems.length - achEligibleCount !== 1 ? 's' : ''} require manual processing
                  </p>
                )}
                {achEligibleCount === 0 && (
                  <p className="text-charney-gray">
                    No transactions are eligible for ACH transfer
                  </p>
                )}
              </div>
            </div>
            
            {/* Warning for mixed processing */}
            {achEnabled && hasIneligibleItems && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Mixed Processing Method
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                      ACH-eligible transactions will be processed automatically. Others will require manual processing.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-6 py-4 bg-charney-cream/20 dark:bg-charney-slate/20 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-charney-gray hover:text-charney-black dark:hover:text-charney-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium bg-charney-red text-charney-white rounded-lg hover:bg-charney-black transition-colors disabled:opacity-50 flex items-center"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Confirm & Schedule'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
