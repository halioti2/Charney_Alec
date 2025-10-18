import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useAgentPerformance from '../../hooks/useAgentPerformance';
import { formatCurrency, formatCurrencyAbbreviated } from '../../lib/formatters';

const RevenueChart = ({ period }) => {
  const { agents } = useAgentPerformance(period);

  const chartData = agents.map(agent => ({
    name: agent.name,
    gci: agent.totalGci,
  }));

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-6">
      <h2 className="text-xl font-bold mb-4">GCI by Agent</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => formatCurrencyAbbreviated(value)} dx={-10} />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="gci" fill="#8884d8" name="Gross Commission Income" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
