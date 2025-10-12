export type PaymentQueueItem = {
  id: string;
  propertyAddress: string;
  agentName: string;
  netPayout: number;
  brokerApprovalDate: string;
  status: 'ready' | 'scheduled' | 'paid' | 'requires-info';
  hasBankInfo: boolean;
  achEligible: boolean;
};

export type PaymentHistoryItem = PaymentQueueItem & {
  payoutDate: string | null;
  achReference?: string | null;
};

export const paymentQueueMock: PaymentQueueItem[] = [
  {
    id: 'PAYOUT-001',
    propertyAddress: '123 Main St, Unit 4A',
    agentName: 'Jessica Wong',
    netPayout: 58500,
    brokerApprovalDate: '2024-10-08T14:30:00Z',
    status: 'ready',
    hasBankInfo: true,
    achEligible: true,
  },
  {
    id: 'PAYOUT-002',
    propertyAddress: '420 Kent Ave, Apt 12B',
    agentName: 'Michael B.',
    netPayout: 34500,
    brokerApprovalDate: '2024-10-09T09:15:00Z',
    status: 'ready',
    hasBankInfo: false,
    achEligible: false,
  },
  {
    id: 'PAYOUT-003',
    propertyAddress: '111 Varick St, Penthouse',
    agentName: 'Emily White',
    netPayout: 72500,
    brokerApprovalDate: '2024-10-07T17:45:00Z',
    status: 'requires-info',
    hasBankInfo: true,
    achEligible: false,
  },
];

export const paymentHistoryMock: PaymentHistoryItem[] = [
  {
    id: 'PAYOUT-0004',
    propertyAddress: '53 Broadway, Unit 8C',
    agentName: 'James Riley',
    netPayout: 41250,
    brokerApprovalDate: '2024-09-25T12:00:00Z',
    status: 'paid',
    hasBankInfo: true,
    achEligible: true,
    payoutDate: '2024-09-28T16:10:00Z',
    achReference: 'ACH-REF-291023',
  },
  {
    id: 'PAYOUT-0005',
    propertyAddress: 'The Dime, Suite 21',
    agentName: 'Sarah Klein',
    netPayout: 50250,
    brokerApprovalDate: '2024-09-20T10:05:00Z',
    status: 'paid',
    hasBankInfo: true,
    achEligible: false,
    payoutDate: '2024-09-23T14:30:00Z',
    achReference: null,
  },
];
