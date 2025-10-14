import React from 'react';

const ConfidenceBadge = ({ confidence = 92 }) => {
  const getConfidenceColor = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (score) => {
    if (score >= 90) return 'High Confidence';
    if (score >= 75) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`h-3 w-3 rounded-full ${getConfidenceColor(confidence)}`}></div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            AI Extraction Confidence
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {getConfidenceText(confidence)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {confidence}%
        </div>
      </div>
    </div>
  );
};

export default ConfidenceBadge;

