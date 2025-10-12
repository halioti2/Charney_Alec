import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import { formatCurrency } from '../lib/formatters.js';

export default function CoordinatorJourneyProgress() {
  const { agentPlans } = useDashboardContext();

  const { progressPct, remaining } = useMemo(() => {
    const plans = Object.values(agentPlans);
    if (!plans.length) return { progressPct: 0, remaining: 0 };

    const totals = plans.reduce(
      (acc, plan) => {
        acc.cap += plan.commissionCap;
        acc.current += plan.currentTowardsCap;
        return acc;
      },
      { cap: 0, current: 0 },
    );

    const pct = totals.cap ? Math.min(100, (totals.current / totals.cap) * 100) : 0;
    return {
      progressPct: pct,
      remaining: Math.max(totals.cap - totals.current, 0),
    };
  }, [agentPlans]);

  return (
    <div className="card p-6">
      <h3 className="mb-4 text-2xl font-black tracking-tighter">
        Your <span className="text-charney-red">Journey</span>
      </h3>
      <div>
        <h4 className="mb-2 text-sm font-bold uppercase">Progress to 70/30 Split</h4>
        <div className="mb-2 h-3 w-full rounded-full bg-charney-light-gray">
          <div className="h-3 rounded-full bg-charney-red" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="text-right text-sm font-bold" data-testid="journey-remaining">
          {formatCurrency(remaining, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}{' '}
          <span className="font-normal text-charney-gray">Remaining</span>
        </p>
      </div>
    </div>
  );
}
