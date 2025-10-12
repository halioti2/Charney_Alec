export type AgentMetric = {
  agentId: string;
  agentName: string;
  isActive: boolean;
  totalDealVolume: number;
  totalGci: number;
  dealsClosed: number;
  averageDaysToClose: number;
  performanceScore: number;
  stalledDeals: number;
  lastUpdated: string;
};

export type AgentDetailDeal = {
  dealId: string;
  propertyAddress: string;
  closedAt: string;
  gci: number;
  status: 'closed' | 'stalled' | 'adjusted';
  adjustmentNote?: string;
};

export type AgentDetailResponse = {
  agentId: string;
  agentName: string;
  isActive: boolean;
  totals: {
    totalDealVolume: number;
    totalGci: number;
    dealsClosed: number;
    averageDaysToClose: number;
    performanceScore: number;
  };
  deals: AgentDetailDeal[];
};

export const agentMetricsMock: AgentMetric[] = [
  {
    agentId: 'agent-01',
    agentName: 'Jessica Wong',
    isActive: true,
    totalDealVolume: 12_500_000,
    totalGci: 425_000,
    dealsClosed: 8,
    averageDaysToClose: 42,
    performanceScore: 94,
    stalledDeals: 1,
    lastUpdated: '2024-10-09T08:00:00Z',
  },
  {
    agentId: 'agent-02',
    agentName: 'Michael B.',
    isActive: true,
    totalDealVolume: 7_250_000,
    totalGci: 255_000,
    dealsClosed: 5,
    averageDaysToClose: 55,
    performanceScore: 82,
    stalledDeals: 2,
    lastUpdated: '2024-10-09T08:00:00Z',
  },
  {
    agentId: 'agent-03',
    agentName: 'Emily White',
    isActive: false,
    totalDealVolume: 5_100_000,
    totalGci: 178_500,
    dealsClosed: 4,
    averageDaysToClose: 60,
    performanceScore: 75,
    stalledDeals: 0,
    lastUpdated: '2024-10-09T08:00:00Z',
  },
];

export const agentDetailMock: AgentDetailResponse = {
  agentId: 'agent-01',
  agentName: 'Jessica Wong',
  isActive: true,
  totals: {
    totalDealVolume: 12_500_000,
    totalGci: 425_000,
    dealsClosed: 8,
    averageDaysToClose: 42,
    performanceScore: 94,
  },
  deals: [
    {
      dealId: 'deal-1001',
      propertyAddress: '123 Main St, Unit 4A',
      closedAt: '2024-08-12T14:20:00Z',
      gci: 62_500,
      status: 'closed',
    },
    {
      dealId: 'deal-1002',
      propertyAddress: '420 Kent Ave, Apt 12B',
      closedAt: '2024-08-30T10:05:00Z',
      gci: 78_750,
      status: 'adjusted',
      adjustmentNote: 'Referral clawback -$5,000 applied 2024-09-15',
    },
    {
      dealId: 'deal-1003',
      propertyAddress: '111 Varick St, Penthouse',
      closedAt: '2024-09-20T09:40:00Z',
      gci: 98_000,
      status: 'stalled',
      adjustmentNote: 'Awaiting final paperwork – stuck at inspection stage',
    },
  ],
};
