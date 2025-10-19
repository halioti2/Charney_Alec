import { useMemo } from 'react';
import { agents as mockAgents } from '../mocks/dashboardMockData';

// Helper function to filter deals by date range
const filterDealsByPeriod = (deals, period) => {
  // In a real application, this would parse 'period' and filter by date.
  // For mock data, we'll assume 'Last 90 Days' is the default and return all for now.
  // A more robust implementation would involve date parsing and comparison.
  if (period === 'Last 90 Days') {
    // For mock data, we'll just return all closed deals as a placeholder
    return deals.filter(d => d.stage === 'Closed');
  }
  // Add other period handling here if needed
  return deals.filter(d => d.stage === 'Closed');
};

export const useCommissionData = ({ period }) => {
  const processedData = useMemo(() => {
    const filteredAgents = mockAgents.map(agent => ({
      ...agent,
      deals: filterDealsByPeriod(agent.deals, period),
    }));

    const totalGci = filteredAgents.flatMap(a => a.deals)
      .reduce((sum, d) => sum + d.gci, 0);

    const totalDealVolume = filteredAgents.flatMap(a => a.deals)
      .reduce((sum, d) => sum + d.value, 0);
      
    const dealsInProgress = filteredAgents.flatMap(a => a.deals)
        .filter(d => d.stage === 'Active' || d.stage === 'Contract').length;

    return {
      totalGci,
      totalDealVolume,
      dealsInProgress,
      agents: filteredAgents, // Pass through the filtered agent data
    };
  }, [period]); // Dependency array will be used for filtering later

  return processedData;
};
