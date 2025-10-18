import React, { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { formatCurrency } from '../lib/formatters.js';
import useAgentPerformance from '../hooks/useAgentPerformance.js';

const AgentDetailsView = ({ agentName, onClose = () => {}, period = 'Last 90 Days' }) => {
  const { agentPlans } = useDashboardContext();
  const { agents } = useAgentPerformance(period);

  const agentData = useMemo(() => {
    return agents.find((a) => a.name === agentName);
  }, [agents, agentName]);

  if (!agentName || !agentData) return null;

  const statusColors = {
    'Needs Review': 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-blue-100 text-blue-800',
    Paid: 'bg-green-100 text-green-800',
    'Awaiting Info': 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="bg-white dark:bg-charney-gray rounded-lg p-6 shadow-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black">{agentName}</h2>
          <p className="text-sm text-charney-gray">Deal Details for {period}</p>
        </div>
        <button onClick={onClose} className="text-sm text-charney-gray hover:text-charney-red">✕ Close</button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-charney-cream">
        <div>
          <p className="text-xs text-charney-gray uppercase">Total GCI</p>
          <p className="text-lg font-bold">{agentData.formattedTotalGci}</p>
        </div>
        <div>
          <p className="text-xs text-charney-gray uppercase">Agent Payout</p>
          <p className="text-lg font-bold">{agentData.formattedAgentPayout}</p>
        </div>
        <div>
          <p className="text-xs text-charney-gray uppercase">Deals Closed</p>
          <p className="text-lg font-bold">{agentData.deals.filter(d => d.status === 'Paid' || d.status === 'Approved').length}</p>
        </div>
        <div>
          <p className="text-xs text-charney-gray uppercase">In Progress</p>
          <p className="text-lg font-bold">{agentData.dealsInProgress}</p>
        </div>
      </div>

      {agentData.deals.length === 0 ? (
        <div className="p-4 text-sm text-charney-gray">No deals found for this agent in the selected period.</div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase bg-charney-cream/50 dark:bg-charney-cream/10">
            <tr>
              <th className="p-3">Deal ID</th>
              <th className="p-3">Property</th>
              <th className="p-3 text-right">Sale Price</th>
              <th className="p-3 text-right">GCI</th>
              <th className="p-3 text-right">Agent Payout</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {agentData.deals.map((d) => {
              const gci = (d.salePrice ?? 0) * ((d.grossCommissionRate ?? 0) / 100);
              const plan = agentPlans[agentName];
              const splitDefault = plan ? (plan.primarySplit.agent / 100) : 0.5;
              const agentSplit = (d.finalAgentSplitPercent != null ? d.finalAgentSplitPercent / 100 : null) || splitDefault;
              const agentPayout = gci * agentSplit;

              return (
                <tr key={d.id} className="border-t border-charney-cream/50 hover:bg-charney-cream/30 dark:hover:bg-charney-cream/10">
                  <td className="p-3 font-mono text-xs">{d.id}</td>
                  <td className="p-3">{d.property || d.propertyAddress || 'N/A'}</td>
                  <td className="p-3 text-right">{formatCurrency(d.salePrice)}</td>
                  <td className="p-3 text-right">{formatCurrency(gci)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(agentPayout)}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[d.status] || 'bg-gray-100 text-gray-800'}`}>
                      {d.status}
                    </span>
                  </td>
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
