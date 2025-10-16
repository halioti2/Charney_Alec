import React from 'react';
import { useToast } from '../../../context/ToastContext';

export default function PayoutFailureBanner({ failures = [], onDismiss, onRetry }) {
  const { pushToast } = useToast();

  if (!failures || failures.length === 0) {
    return null;
  }

  const handleRetryAll = () => {
    if (onRetry) {
      onRetry(failures);
      pushToast({
        message: `Retrying ${failures.length} failed payout${failures.length !== 1 ? 's' : ''}...`,
        type: "info"
      });
    }
  };

  const handleDismissAll = () => {
    if (onDismiss) {
      onDismiss(failures.map(f => f.id));
      pushToast({
        message: "Failure notifications dismissed",
        type: "success"
      });
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Payout Failures ({failures.length})
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p className="mb-2">The following payouts failed to process:</p>
                <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                  {failures.map((failure) => (
                    <li key={failure.id} className="text-xs">
                      <span className="font-medium">{failure.agent?.full_name}</span>
                      {' - '}
                      <span className="font-mono text-red-600 dark:text-red-400">
                        {failure.failure_reason || 'Unknown error'}
                      </span>
                      {failure.ach_provider && (
                        <span className="text-red-500 dark:text-red-400">
                          {' '}({failure.ach_provider})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="ml-4 flex flex-shrink-0 space-x-2">
            <button
              type="button"
              onClick={handleRetryAll}
              className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200 dark:bg-red-800/30 dark:text-red-200 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Retry All
            </button>
            <button
              type="button"
              onClick={handleDismissAll}
              className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200 dark:bg-red-800/30 dark:text-red-200 dark:hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Dismiss All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
