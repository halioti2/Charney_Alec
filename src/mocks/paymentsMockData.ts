// Supabase Schema-Aligned Types
export type CommissionPayout = {
  id: string;
  transaction_id: string;
  agent_id: string;
  batch_id: string | null;
  payout_amount: number;
  status: 'ready' | 'scheduled' | 'paid' | 'failed';
  auto_ach: boolean;
  ach_provider: string | null;
  ach_reference: string | null;
  scheduled_at: string | null;
  paid_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

export type PayoutBatch = {
  id: string;
  accountant_id: string | null;
  created_at: string;
  total_amount: number;
  auto_ach_enabled: boolean;
  status: 'pending' | 'processing' | 'completed';
};

export type Agent = {
  id: string;
  full_name: string;
  email: string;
  default_bank_account_id: string | null;
};

export type Transaction = {
  id: string;
  property_address: string;
  pending_payout_amount: number | null;
  latest_payout_id: string | null;
};

export type PayoutBankAccount = {
  id: string;
  agent_id: string;
  account_nickname: string;
  mask: string;
  is_default: boolean;
};

// Extended types for UI components
export type PaymentQueueItem = CommissionPayout & {
  agent: Agent;
  transaction: Transaction;
  bank_account: PayoutBankAccount | null;
};

export type PaymentHistoryItem = PaymentQueueItem;

// Mock Agents
export const agentsMock: Agent[] = [
  {
    id: 'agent-001',
    full_name: 'Jessica Wong',
    email: 'jessica.wong@charney.com',
    default_bank_account_id: 'bank-001',
  },
  {
    id: 'agent-002',
    full_name: 'Michael B.',
    email: 'michael.b@charney.com',
    default_bank_account_id: null,
  },
  {
    id: 'agent-003',
    full_name: 'Emily White',
    email: 'emily.white@charney.com',
    default_bank_account_id: 'bank-003',
  },
  // Edge case agents
  {
    id: 'agent-006',
    full_name: 'David Chen',
    email: 'david.chen@charney.com',
    default_bank_account_id: null, // Missing bank info
  },
  {
    id: 'agent-007',
    full_name: 'Sarah Martinez',
    email: 'sarah.martinez@charney.com',
    default_bank_account_id: 'bank-007',
  },
];

// Mock Transactions
export const transactionsMock: Transaction[] = [
  {
    id: 'txn-001',
    property_address: '123 Main St, Unit 4A',
    pending_payout_amount: 58500,
    latest_payout_id: null,
  },
  {
    id: 'txn-002',
    property_address: '420 Kent Ave, Apt 12B',
    pending_payout_amount: 34500,
    latest_payout_id: null,
  },
  {
    id: 'txn-003',
    property_address: '111 Varick St, Penthouse',
    pending_payout_amount: 72500,
    latest_payout_id: null,
  },
  // Edge case transactions
  {
    id: 'txn-006',
    property_address: '789 Broadway, Suite 15',
    pending_payout_amount: 0, // Zero amount
    latest_payout_id: null,
  },
  {
    id: 'txn-007',
    property_address: '456 Park Ave, Floor 20',
    pending_payout_amount: 25000,
    latest_payout_id: 'payout-004',
  },
];

// Mock Bank Accounts
export const bankAccountsMock: PayoutBankAccount[] = [
  {
    id: 'bank-001',
    agent_id: 'agent-001',
    account_nickname: 'Chase Business Checking',
    mask: '****1234',
    is_default: true,
  },
  {
    id: 'bank-003',
    agent_id: 'agent-003',
    account_nickname: 'Wells Fargo Savings',
    mask: '****5678',
    is_default: true,
  },
  // Edge case bank account
  {
    id: 'bank-007',
    agent_id: 'agent-007',
    account_nickname: 'Citibank Checking',
    mask: '****9999',
    is_default: true,
  },
];

// Mock Commission Payouts (Ready for Payout)
export const commissionPayoutsMock: CommissionPayout[] = [
  {
    id: 'payout-001',
    transaction_id: 'txn-001',
    agent_id: 'agent-001',
    batch_id: null,
    payout_amount: 58500,
    status: 'ready',
    auto_ach: true,
    ach_provider: 'stripe',
    ach_reference: null,
    scheduled_at: null,
    paid_at: null,
    failure_reason: null,
    created_at: '2024-10-08T14:30:00Z',
  },
  {
    id: 'payout-002',
    transaction_id: 'txn-002',
    agent_id: 'agent-002',
    batch_id: null,
    payout_amount: 34500,
    status: 'ready',
    auto_ach: false,
    ach_provider: null,
    ach_reference: null,
    scheduled_at: null,
    paid_at: null,
    failure_reason: null,
    created_at: '2024-10-09T09:15:00Z',
  },
  // Edge case: Zero payout amount (should be filtered out)
  {
    id: 'payout-003',
    transaction_id: 'txn-006',
    agent_id: 'agent-006',
    batch_id: null,
    payout_amount: 0,
    status: 'ready',
    auto_ach: false,
    ach_provider: null,
    ach_reference: null,
    scheduled_at: null,
    paid_at: null,
    failure_reason: null,
    created_at: '2024-10-10T11:30:00Z',
  },
  // Edge case: Failed payout
  {
    id: 'payout-004',
    transaction_id: 'txn-007',
    agent_id: 'agent-007',
    batch_id: 'batch-003',
    payout_amount: 25000,
    status: 'failed',
    auto_ach: true,
    ach_provider: 'stripe',
    ach_reference: null,
    scheduled_at: '2024-10-10T14:00:00Z',
    paid_at: null,
    failure_reason: 'Insufficient funds in agent account',
    created_at: '2024-10-10T12:00:00Z',
  },
];

// Combined data for UI components
export const paymentQueueMock: PaymentQueueItem[] = commissionPayoutsMock
  .filter(payout => payout.status === 'ready')
  .map(payout => {
    const agent = agentsMock.find(a => a.id === payout.agent_id)!;
    const transaction = transactionsMock.find(t => t.id === payout.transaction_id)!;
    const bank_account = bankAccountsMock.find(b => b.id === agent.default_bank_account_id) || null;

    return {
      ...payout,
      agent,
      transaction,
      bank_account,
    };
  });

// Mock Historical Agents
const historicalAgentsMock: Agent[] = [
  {
    id: 'agent-004',
    full_name: 'James Riley',
    email: 'james.riley@charney.com',
    default_bank_account_id: 'bank-004',
  },
  {
    id: 'agent-005',
    full_name: 'Sarah Klein',
    email: 'sarah.klein@charney.com',
    default_bank_account_id: 'bank-005',
  },
];

// Mock Historical Transactions
const historicalTransactionsMock: Transaction[] = [
  {
    id: 'txn-004',
    property_address: '53 Broadway, Unit 8C',
    pending_payout_amount: null,
    latest_payout_id: 'payout-004',
  },
  {
    id: 'txn-005',
    property_address: 'The Dime, Suite 21',
    pending_payout_amount: null,
    latest_payout_id: 'payout-005',
  },
];

// Mock Historical Bank Accounts
const historicalBankAccountsMock: PayoutBankAccount[] = [
  {
    id: 'bank-004',
    agent_id: 'agent-004',
    account_nickname: 'Bank of America Checking',
    mask: '****9012',
    is_default: true,
  },
  {
    id: 'bank-005',
    agent_id: 'agent-005',
    account_nickname: 'TD Bank Business',
    mask: '****3456',
    is_default: true,
  },
];

// Mock Historical Commission Payouts
const historicalCommissionPayoutsMock: CommissionPayout[] = [
  {
    id: 'payout-004',
    transaction_id: 'txn-004',
    agent_id: 'agent-004',
    batch_id: 'batch-001',
    payout_amount: 41250,
    status: 'paid',
    auto_ach: true,
    ach_provider: 'stripe',
    ach_reference: 'ACH-REF-291023',
    scheduled_at: '2024-09-26T10:00:00Z',
    paid_at: '2024-09-28T16:10:00Z',
    failure_reason: null,
    created_at: '2024-09-25T12:00:00Z',
  },
  {
    id: 'payout-005',
    transaction_id: 'txn-005',
    agent_id: 'agent-005',
    batch_id: 'batch-002',
    payout_amount: 50250,
    status: 'paid',
    auto_ach: false,
    ach_provider: null,
    ach_reference: null,
    scheduled_at: '2024-09-21T14:00:00Z',
    paid_at: '2024-09-23T14:30:00Z',
    failure_reason: null,
    created_at: '2024-09-20T10:05:00Z',
  },
];

// Combined historical data for UI components
export const paymentHistoryMock: PaymentHistoryItem[] = historicalCommissionPayoutsMock.map(payout => {
  const agent = historicalAgentsMock.find(a => a.id === payout.agent_id)!;
  const transaction = historicalTransactionsMock.find(t => t.id === payout.transaction_id)!;
  const bank_account = historicalBankAccountsMock.find(b => b.id === agent.default_bank_account_id) || null;

  return {
    ...payout,
    agent,
    transaction,
    bank_account,
  };
});
