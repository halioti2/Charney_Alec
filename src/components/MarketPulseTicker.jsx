import { useMemo } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';

export default function MarketPulseTicker() {
  const { marketData } = useDashboardContext();

  const items = useMemo(
    () =>
      marketData.map((stock) => ({
        ...stock,
        arrow: stock.dir === 'down' ? '▼' : '▲',
        colorClass: stock.dir === 'down' ? 'ticker-down' : 'ticker-up',
      })),
    [marketData],
  );

  return (
    <div className="card p-4">
      <h3 className="mb-3 text-lg font-black tracking-tighter">
        Market <span className="text-charney-red">Pulse</span>
      </h3>
      <div id="stock-ticker-container" className="relative flex overflow-x-hidden">
        <div id="stock-ticker-track" className="flex flex-wrap gap-4" role="list">
          {items.map((stock) => (
            <div key={stock.symbol} className={`ticker-item ${stock.colorClass}`} role="listitem">
              <span>{stock.symbol}</span>
              <span className="ml-2">{stock.price.toFixed(2)}</span>
              <span className="ml-2">
                {stock.arrow} {Math.abs(stock.change).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
