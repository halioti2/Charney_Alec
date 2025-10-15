import React from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { formatCurrency } from '../lib/formatters.js';

const AgentDetailsView = ({ agentName, onClose = () => {} }) => {
  const { commissions } = useDashboardContext();
  const deals = commissions.filter((c) => (c.broker || c.agent) === agentName);

  if (!agentName) return null;

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black">{agentName} — Deals</h2>
        <button onClick={onClose} className="text-sm text-charney-gray">Close</button>
      </div>
      {deals.length === 0 ? (
        <div className="p-4 text-sm text-charney-gray">No detailed deal information found for this agent in the selected period.</div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="p-2">Deal ID</th>
              <th className="p-2">Property</th>
              <th className="p-2 text-right">Sale Price</th>
              <th className="p-2 text-right">GCI</th>
              <th className="p-2 text-right">Agent Payout</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => {
              const gci = (d.salePrice ?? 0) * ((d.grossCommissionRate ?? 0) / 100);
              const agentPayout = gci * 0.5; // UI-level rule for now
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs">{d.id}</td>
                  <td className="p-2">{d.property}</td>
                  <td className="p-2 text-right">{formatCurrency(d.salePrice)}</td>
                  <td className="p-2 text-right">{formatCurrency(gci)}</td>
                  <td className="p-2 text-right">{formatCurrency(agentPayout)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AgentDetailsView;
