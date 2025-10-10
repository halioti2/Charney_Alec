import BrokerMetrics from './BrokerMetrics.jsx';
import AgentPerformanceTable from './AgentPerformanceTable.jsx';
import CommissionForecast from './CommissionForecast.jsx';
import MarketPulseTicker from './MarketPulseTicker.jsx';
import MarketAlerts from './MarketAlerts.jsx';

export default function BrokerView({ hidden }) {
  return (
    <div id="broker-view" className={hidden ? 'hidden' : ''}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <BrokerMetrics />
          <AgentPerformanceTable />
        </div>
        <div className="space-y-8 lg:col-span-1">
          <CommissionForecast />
          <MarketPulseTicker />
          <MarketAlerts />
        </div>
      </div>
    </div>
  );
}
