import React, { useState, useEffect } from 'react';
import { usePaymentsAPI } from '../hooks/usePaymentsAPI';

export default function RequiresAttentionQueue() {
  const [attentionItems, setAttentionItems] = useState([]);
  const { fetchRequiresAttention, isLoading } = usePaymentsAPI();

  // Load attention queue data on component mount
  useEffect(() => {
    const loadAttentionQueue = async () => {
      const data = await fetchRequiresAttention();
      setAttentionItems(data);
    };

    loadAttentionQueue();
  }, [fetchRequiresAttention]);

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

  const getAttentionReason = (item) => {
    if (!item.bank_account) {
      return {
        reason: 'Missing Bank Info',
        description: 'Agent payout information not configured',
        severity: 'high'
      };
    }
    if (item.payout_amount <= 0) {
      return {
        reason: 'Invalid Amount',
        description: `Payout amount: ${formatCurrency(item.payout_amount)}`,
        severity: 'high'
      };
    }
    if (item.status === 'failed') {
      return {
        reason: 'Payout Failed',
        description: item.failure_reason || 'Processing failed',
        severity: 'medium'
      };
    }
    return {
      reason: 'Requires Review',
      description: 'Manual review needed',
      severity: 'low'
    };
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      high: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-400',
        icon: '🚨'
      },
      medium: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-400',
        icon: '⚠️'
      },
      low: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-400',
        icon: 'ℹ️'
      }
    };

    const badge = badges[severity] || badges.low;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <span className="mr-1">{badge.icon}</span>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
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
            Checking for Issues...
          </h3>
          <p className="mt-1 text-sm text-charney-gray">
            Scanning transactions that need attention
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (attentionItems.length === 0) {
    return (
      <div className="bg-white dark:bg-charney-charcoal rounded-xl border border-charney-light-gray dark:border-charney-gray/30 p-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-charney-black dark:text-charney-white">
            All Clear!
          </h3>
          <p className="mt-1 text-sm text-charney-gray">
            No transactions require attention at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-charney-charcoal rounded-xl border border-charney-light-gray dark:border-charney-gray/30">
      <div className="px-6 py-4 border-b border-charney-light-gray dark:border-charney-gray/30">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-charney-black dark:text-charney-white">
            Requires Attention ({attentionItems.length})
          </h3>
          <div className="text-sm text-charney-gray">
            Administrative review needed
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-charney-cream dark:bg-charney-slate">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-charney-black dark:text-charney-white">
                  Agent Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-charney-black dark:text-charney-white">
                  Property Address
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-charney-black dark:text-charney-white">
                  Payout Amount
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-charney-black dark:text-charney-white">
                  Created Date
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-charney-black dark:text-charney-white">
                  Issue
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-charney-black dark:text-charney-white">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charney-light-gray dark:divide-charney-gray/30">
              {attentionItems.map((item) => {
                const attention = getAttentionReason(item);
                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-charney-cream/50 dark:hover:bg-charney-slate/30"
                  >
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
                      {getSeverityBadge(attention.severity)}
                    </td>
                    <td className="px-4 py-3 text-sm text-charney-gray">
                      <div>
                        <div className="font-medium text-charney-black dark:text-charney-white">
                          {attention.reason}
                        </div>
                        <div className="text-xs text-charney-gray">
                          {attention.description}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
