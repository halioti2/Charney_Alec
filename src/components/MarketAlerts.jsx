import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';

export default function MarketAlerts() {
  const { marketData } = useDashboardContext();

  const alerts = useMemo(() => {
    return marketData
      .filter((stock) => stock.alertThreshold != null)
      .map((stock) => {
        const dailyChangePct = ((stock.price - stock.openPrice) / stock.openPrice) * 100;
        return {
          ...stock,
          dailyChangePct,
          show: Math.abs(dailyChangePct) > stock.alertThreshold,
        };
      })
      .filter((stock) => stock.show);
  }, [marketData]);

  if (!alerts.length) {
    return null;
  }

  return (
    <div className="space-y-4" aria-live="polite">
      {alerts.map((alert) => {
        const isDown = alert.dailyChangePct < 0;
        return (
          <div
            key={alert.symbol}
            className="card market-alert border-l-4 border-yellow-400 bg-yellow-50 p-4"
            role="alert"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-black uppercase">High Market Volatility Detected</h4>
                <p className="mt-1 text-sm font-bold">
                  The {alert.symbol} is {isDown ? 'down' : 'up'} {Math.abs(alert.dailyChangePct).toFixed(1)}% today.
                </p>
                <p className="mt-2 text-xs text-charney-gray">
                  Sudden market shifts can impact buyer confidence and loan approvals. Consider checking in with clients
                  on active deals.
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
