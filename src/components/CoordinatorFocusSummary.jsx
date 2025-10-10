import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';

export default function CoordinatorFocusSummary() {
  const { commissions } = useDashboardContext();

  const metrics = useMemo(() => {
    const newSinceLogin = commissions.filter((commission) => commission.status === 'Needs Review').length;
    const awaitingInformation = commissions.filter((commission) => commission.status === 'Awaiting Info').length;
    const requiresAttention = commissions.filter((commission) => commission.conflict).length;

    return [
      { id: 'new', label: 'New Since Last Login', value: newSinceLogin, highlight: true },
      { id: 'awaiting', label: 'Awaiting Information', value: awaitingInformation },
      { id: 'attention', label: 'Requires Attention (48hr+)', value: requiresAttention },
    ];
  }, [commissions]);

  return (
    <div className="card p-6" data-testid="focus-summary">
      <h3 className="mb-4 text-2xl font-black tracking-tighter">
        Today&apos;s <span className="text-charney-red">Focus</span>
      </h3>
      <div className="space-y-4">
        {metrics.map(({ id, label, value, highlight }) => (
          <div key={id} data-testid={`focus-${id}`} className="flex items-center justify-between">
            <p>{label}</p>
            <p className={`text-2xl font-black ${highlight ? 'text-charney-red' : ''}`}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
