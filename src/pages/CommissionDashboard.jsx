import { useState } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';
import AgentPerformanceTable from '../components/AgentPerformanceTable';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import KeyMetricsGrid from '../components/dashboard/KeyMetricsGrid.jsx';
import RevenueChart from '../components/dashboard/RevenueChart.jsx';
import AgentComparisonChart from '../components/dashboard/AgentComparisonChart.jsx';
import CommissionSplitFlow from '../components/dashboard/CommissionSplitFlow.jsx';
// Removed DealPipelineFunnel import
// import DealPipelineFunnel from '../components/dashboard/DealPipelineFunnel.jsx';

const CommissionDashboard = () => {
    const { activeView } = useDashboardContext();
    const [period, setPeriod] = useState('Last 90 Days');

    if (activeView !== 'commission') return null;

    return (
        <div className="min-h-screen bg-charney-cream">
            <main className="max-w-7xl mx-auto py-8 px-4">
                <DashboardHeader period={period} onPeriodChange={setPeriod} />
                <KeyMetricsGrid period={period} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RevenueChart period={period} />
                    <AgentComparisonChart period={period} />
                </div>
                <CommissionSplitFlow period={period} />
                {/* Removed DealPipelineFunnel */}
                <AgentPerformanceTable period={period} />
            </main>
        </div>
    );
};

export default CommissionDashboard;
