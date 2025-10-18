import { useMemo, useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import useAgentPerformance from '../hooks/useAgentPerformance.js';
import { formatCurrency } from '../lib/formatters.js';
import AgentDetailsView from './AgentDetailsView.jsx';

const statusColors = {
  'Needs Review': 'bg-yellow-100 text-yellow-800',
  Approved: 'bg-blue-100 text-blue-800',
  Paid: 'bg-green-100 text-green-800',
  'Awaiting Info': 'bg-orange-100 text-orange-800',
};

export default function AgentPerformanceTable({ period = 'Last 90 Days' }) {
  const { setActiveCommissionId, setModalFocus, setPanelAgent } = useDashboardContext();
  const { agents, totals } = useAgentPerformance(period);
  const [sortKey, setSortKey] = useState('agent');
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    const copy = [...agents];
    copy.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (av === bv) return 0;
      return sortDir === 'asc' ? (av < bv ? -1 : 1) : av > bv ? -1 : 1;
    });
    return copy;
  }, [agents, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const [selectedAgent, setSelectedAgent] = useState(null);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-black tracking-tighter">Agent <span className="text-charney-red">Performance</span></h3>
        <div className="text-sm text-charney-gray">Brokerage Total GCI: {totals.formattedTotalGci}</div>
      </div>
      <div className="overflow-x-auto" role="region" aria-label="Agent performance">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase">
            <tr>
              <th className="p-4">Agent</th>
              <th className="p-4 text-center cursor-pointer" onClick={() => toggleSort('totalDealVolume')}>Total Deal Volume</th>
              <th className="p-4 text-center cursor-pointer" onClick={() => toggleSort('totalGci')}>Total GCI</th>
              <th className="p-4 text-center cursor-pointer" onClick={() => toggleSort('agentPayout')}>Agent Payout</th>
              <th className="p-4 text-center">Avg. Deal Time</th>
              <th className="p-4 text-center">Deals In Progress</th>
              <th className="p-4 text-center">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((agent) => (
              <tr
                  key={agent.name}
                  className="cursor-pointer hover:bg-charney-cream/50 dark:hover:bg-charney-cream/10"
                >
                  <td
                    className="p-4 font-bold"
                    onClick={() => setSelectedAgent(agent.name)}
                  >
                    {agent.name}
                  </td>
                <td className="p-4 text-center">{agent.formattedTotalDealVolume}</td>
                <td className="p-4 text-center">{agent.formattedTotalGci}</td>
                <td className="p-4 text-center">{agent.formattedAgentPayout}</td>
                <td className="p-4 text-center">{agent.avgDealTime}d</td>
                <td className="p-4 text-center">{agent.dealsInProgress}</td>
                <td className="p-4 text-center font-bold text-green-600">{agent.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        {selectedAgent ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedAgent(null)} />
            <div className="relative w-full max-w-4xl p-4">
              <AgentDetailsView agentName={selectedAgent} onClose={() => setSelectedAgent(null)} period={period} />
            </div>
          </div>
        ) : null}
    </div>
  );
}
