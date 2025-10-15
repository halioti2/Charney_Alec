import React from 'react';

const presets = [
  'This Month',
  'Last 90 Days',
  'YTD',
  'Custom...'
];

const DateRangeSelector = ({ value = 'Last 90 Days', onChange = () => {} }) => (
  <div className="flex items-center space-x-2 mb-4">
    <label htmlFor="date-range" className="font-bold text-sm">Period:</label>
    <select
      id="date-range"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-2 py-1 bg-white text-black focus:ring-2 focus:ring-charney-blue focus:outline-none"
    >
      {presets.map((preset) => (
        <option key={preset} value={preset}>{preset}</option>
      ))}
    </select>
    <span className="text-charney-gray text-xs">Showing performance for: {value}</span>
  </div>
);

export default DateRangeSelector;
