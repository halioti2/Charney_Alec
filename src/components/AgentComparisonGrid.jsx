import React from 'react';

// Placeholder sparkline SVG
const Sparkline = () => (
  <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
    <polyline
      points="0,20 10,10 20,14 30,6 40,12 50,4 60,16 70,8 80,20"
      stroke="#3B82F6"
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

const AgentCard = ({ name, gci, volume }) => (
  <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center w-56 m-2 border border-charney-light-gray">
    <div className="font-bold text-lg mb-1">{name}</div>
    <div className="text-charney-gray text-xs mb-2">GCI: <span className="font-bold text-black">${gci}</span></div>
    <div className="text-charney-gray text-xs mb-2">Volume: <span className="font-bold text-black">${volume}</span></div>
    <div className="w-full flex justify-center mb-2"><Sparkline /></div>
    <label className="flex items-center space-x-2 mt-2">
      <input type="checkbox" className="accent-charney-blue" />
      <span className="text-xs">Add to Comparison</span>
    </label>
  </div>
);

const agents = [
  { name: 'John Doe', gci: '120,000', volume: '2,000,000' },
  { name: 'Jane Smith', gci: '98,500', volume: '1,750,000' },
  { name: 'Alex Lee', gci: '110,200', volume: '1,900,000' },
  { name: 'Maria Garcia', gci: '105,000', volume: '1,800,000' },
];

const AgentComparisonGrid = () => (
  <div className="flex flex-wrap justify-start gap-4 mt-6">
    {agents.map((agent) => (
      <AgentCard key={agent.name} {...agent} />
    ))}
  </div>
);

export default AgentComparisonGrid;
