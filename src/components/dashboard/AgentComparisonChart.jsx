import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useAgentPerformance from '../../hooks/useAgentPerformance';
import { formatCurrency, formatCurrencyAbbreviated, formatNumberAbbreviated } from '../../lib/formatters';

const AgentComparisonChart = ({ period }) => {
  const [metric, setMetric] = useState('gci'); // 'gci', 'dealVolume', 'transactions'
  const { agents } = useAgentPerformance(period);

  const chartData = useMemo(() => agents.map(agent => {
    const closedDeals = agent.deals.filter(d => d.status === 'Paid' || d.status === 'Approved');
    const dealsInProgress = agent.deals.filter(d => d.status !== 'Paid' && d.status !== 'Approved');

    return {
      name: agent.name,
      gci: agent.totalGci,
      dealVolume: agent.totalDealVolume,
      transactions: agent.deals.length,
      closedDeals: closedDeals.length,
      dealsInProgress: dealsInProgress.length,
    };
  }), [agents]);

  const metricConfig = {
    gci: { name: 'Gross Commission Income', formatter: (value) => formatCurrency(value) },
    dealVolume: { name: 'Total Deal Volume', formatter: (value) => formatCurrency(value) },
    transactions: { name: 'Total Transactions', formatter: (value) => value },
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Agent Comparison</h2>
        <div className="flex space-x-2">
          <button onClick={() => setMetric('gci')} className={`px-2 py-1 text-xs rounded ${metric === 'gci' ? 'bg-charney-red text-white' : 'bg-gray-200'}`}>GCI</button>
          <button onClick={() => setMetric('dealVolume')} className={`px-2 py-1 text-xs rounded ${metric === 'dealVolume' ? 'bg-charney-red text-white' : 'bg-gray-200'}`}>Volume</button>
          <button onClick={() => setMetric('transactions')} className={`px-2 py-1 text-xs rounded ${metric === 'transactions' ? 'bg-charney-red text-white' : 'bg-gray-200'}`}>Deals</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            tickFormatter={(value) => metric === 'transactions' ? formatNumberAbbreviated(value) : formatCurrencyAbbreviated(value)}
            width={80}
            allowDecimals={metric !== 'transactions'}
          />
          <Tooltip formatter={(value) => metricConfig[metric].formatter(value)} />
          <Legend />
          {metric === 'transactions' ? (
            <>
              <Bar dataKey="closedDeals" fill="#10b981" name="Closed Deals" />
              <Bar dataKey="dealsInProgress" fill="#f59e0b" name="In Progress" />
            </>
          ) : (
            <Bar dataKey={metric} fill="#82ca9d" name={metricConfig[metric].name} />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AgentComparisonChart;
