import React from 'react';

const DealSheetViewer = () => {
  return (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
      <div className="space-y-4">
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm">Deal Sheet Document Preview</p>
          <p className="mt-1 text-xs text-gray-400">
            Upload or select a document to view here
          </p>
        </div>
      </div>
    </div>
  );
};

export default DealSheetViewer;

