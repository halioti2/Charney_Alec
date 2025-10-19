import React from 'react';
import useAgentPerformance from '../hooks/useAgentPerformance.js';

const BrokerageSummaryCard = ({ overrideTotals } ) => {
  const { totals } = useAgentPerformance();
  const data = overrideTotals || totals || { formattedTotalGci: '$0', formattedTotalDealVolume: '$0' };

  return (
    <div className="bg-charney-cream rounded-lg p-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between shadow">
      <div>
        <div className="text-lg font-bold">Brokerage Total GCI</div>
        <div className="text-2xl font-black text-charney-green">{data.formattedTotalGci}</div>
      </div>
      <div>
        <div className="text-lg font-bold">Brokerage Total Deal Volume</div>
        <div className="text-2xl font-black text-charney-blue">{data.formattedTotalDealVolume}</div>
      </div>
      <div className="text-sm text-charney-gray mt-2 md:mt-0 md:ml-8">Data last updated: 10/13/2025 09:00 UTC</div>
    </div>
  );
};

export default BrokerageSummaryCard;
