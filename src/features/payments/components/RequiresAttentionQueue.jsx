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
        bg: 'bg-red-100',
        text: 'text-red-800'
      },
      medium: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800'
      },
      low: {
        bg: 'bg-blue-100',
        text: 'text-blue-800'
      }
    };

    const badge = badges[severity] || badges.low;

    return (
      <span className={`inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-bold uppercase ${badge.bg} ${badge.text}`}>
        {severity}
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
    <div className="card p-6">
      <h3 className="mb-4 text-2xl font-black tracking-tighter">
        Requires <span className="text-charney-red">Attention</span> ({attentionItems.length})
      </h3>

      <div className="overflow-x-auto" role="region" aria-label="Requires attention queue">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="p-4">Agent</th>
              <th className="p-4">Property</th>
              <th className="p-4 text-center">Payout Amount</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-center">Issue</th>
              <th className="p-4">Description</th>
            </tr>
          </thead>
          <tbody>
            {attentionItems.map((item) => {
              const attention = getAttentionReason(item);
              return (
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
                    {formatDate(item.created_at)}
                  </td>
                  <td className="p-4 text-center">
                    {getSeverityBadge(attention.severity)}
                  </td>
                  <td className="p-4 text-charney-gray">
                    <div className="font-medium text-charney-black dark:text-charney-white">
                      {attention.reason}
                    </div>
                    <div className="text-xs text-charney-gray mt-1">
                      {attention.description}
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
