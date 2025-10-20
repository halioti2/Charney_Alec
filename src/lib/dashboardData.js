const DEFAULT_AVATAR_URL = 'https://i.pravatar.cc/72?img=60';

export function createAgentPlans() {
  return {
    'Jessica Wong': {
      primarySplit: { agent: 70, brokerage: 30 },
      commissionCap: 20000,
      currentTowardsCap: 15500,
      deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
    },
    'Sarah Klein': {
      primarySplit: { agent: 80, brokerage: 20 },
      commissionCap: 25000,
      currentTowardsCap: 18000,
      deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
    },
    'Michael B.': {
      primarySplit: { agent: 60, brokerage: 40 },
      commissionCap: 18000,
      currentTowardsCap: 5000,
      deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
    },
    'David Chen': {
      primarySplit: { agent: 90, brokerage: 10 },
      commissionCap: 30000,
      currentTowardsCap: 29000,
      deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
    },
    'Emily White': {
      primarySplit: { agent: 75, brokerage: 25 },
      commissionCap: 22000,
      currentTowardsCap: 10000,
      deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
    },
    'James Riley': {
      primarySplit: { agent: 70, brokerage: 30 },
      commissionCap: 20000,
      currentTowardsCap: 19500,
      deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
    },
    'Maria Garcia': {
      primarySplit: { agent: 65, brokerage: 35 },
      commissionCap: 19000,
      currentTowardsCap: 12000,
      deductions: { franchiseFeePct: 6, eoFee: 150, transactionFee: 450 },
    },
  };
}

export function createMockCommissions(count = 50) {
  const brokers = ['Jessica Wong', 'Sarah Klein', 'Michael B.', 'David Chen', 'Emily White', 'James Riley', 'Maria Garcia'];
  const properties = ['123 Main St', 'The Dime', '53 Broadway', '420 Kent Ave', '111 Varick'];
  const buyers = ['Jane Doe', 'John Smith', 'Peter Jones', 'Mary Williams', 'Susan Brown'];
  const sellers = ['Emily Davis', 'Michael Miller', 'David Wilson', 'Sarah Moore', 'James Taylor'];
  const attachmentSets = [
    ['Purchase_Offer.pdf', 'Property_Photos.zip', 'Floor_Plan.pdf'],
    ['Signed_Comm_Agreement.docx', 'Wire_Instructions.pdf', 'Client_ID.jpeg'],
    ['Inspection_Report.pdf', 'ID_Scan.jpeg', 'Loan_Approval.pdf', 'Bank_Statement.pdf', 'Title_Report.pdf'],
  ];
  const bankInfo = ['Bank of America, Acct: ...1122', 'CitiBank, Acct: ...3344', 'Wells Fargo, Acct: ...5566'];
  const today = new Date();

  return Array.from({ length: count }, (_, index) => {
    const salePrice = 1000000 + Math.random() * 2000000;
    const dealTime = 5 + Math.floor(Math.random() * 10);
    const accuracy = 90 + Math.floor(Math.random() * 10);
    const conflict = index < 3;
    const finalSalePrice = conflict ? salePrice * 1.05 : salePrice;
    const grossCommissionRate = 2.5;
    const referralFeePct = index % 5 === 0 ? 25 : 0;
    const broker = brokers[index % brokers.length];
    const attachments = attachmentSets[index % attachmentSets.length];

    // Generate dates: 70% in last 90 days, 20% in last 365 days, 10% older
    // This ensures all agents appear in default period while testing other periods
    let daysAgo;
    const rand = Math.random();
    if (rand < 0.7) {
      daysAgo = Math.floor(Math.random() * 90); // Last 90 days
    } else if (rand < 0.9) {
      daysAgo = 90 + Math.floor(Math.random() * 275); // 90-365 days ago
    } else {
      daysAgo = 365 + Math.floor(Math.random() * 30); // 1+ years ago
    }
    const createdDate = new Date(today);
    createdDate.setDate(createdDate.getDate() - daysAgo);
    const created_at = createdDate.toISOString();

    return {
      id: `C10${index + 1}`,
      broker,
      agent: broker,
      email: `${broker.toLowerCase().replace(/\s/g, '.')}@example.com`,
      property: `${properties[index % properties.length]}, Unit ${10 + index}A`,
      salePrice: finalSalePrice,
      grossCommissionRate,
      referralFeePct,
      dealTime,
      accuracy,
      score: Math.round((finalSalePrice / 3000000) * 40 + (1 - dealTime / 15) * 30 + (accuracy / 100) * 30),
      conflict,
      status: conflict ? 'Needs Review' : ['Needs Review', 'Approved', 'Paid', 'Awaiting Info'][index % 4],
      disclosureViewed: index > 2,
      created_at,
      parsedData: {
        propertyAddress: `${properties[index % properties.length]}, Brooklyn, NY`,
        buyerName: buyers[index % buyers.length],
        sellerName: sellers[index % sellers.length],
        salePrice: finalSalePrice,
        loanAmount: finalSalePrice * 0.8,
        listingSideCommission: finalSalePrice * 0.025,
        sellerConcession: finalSalePrice * 0.02,
        receivingBrokerage: `${broker}'s Brokerage`,
        receivingBankInfo: bankInfo[index % bankInfo.length],
      },
      source: {
        attachments,
        content: [
          {
            from: broker,
            to: 'Alex',
            body: `Hey Alex, starting a new deal for ${properties[index % properties.length]}. Attached is the initial <a href="#" class="hover:underline text-charney-red">${attachments[0]}</a>. The offer is for <span class='${conflict ? 'bg-yellow-500/30' : ''}'>${salePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>.`,
          },
          { from: 'Alex', to: broker, body: 'Got it. Looks a bit low. Can they come up?' },
          {
            from: broker,
            to: 'Alex',
            body: `Okay, they've agreed to <span class='bg-red-500/20'>${finalSalePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>. Final offer. Also, here is the <a href="#" class="hover:underline text-charney-red">${attachments[1]}</a>.`,
          },
          { from: 'Alex', to: broker, body: 'Perfect, that works. Who is the seller?' },
          {
            from: broker,
            to: 'Alex',
            body: `Seller is <span class='bg-red-500/20'>${sellers[index % sellers.length]}</span>. And buyer is <span class='bg-red-500/20'>${buyers[index % buyers.length]}</span>.`,
          },
          { from: 'Alex', to: broker, body: 'Great. Last thing - can you confirm the concession?' },
          {
            from: broker,
            to: 'Alex',
            body: `Yes, confirmed. <span class='bg-red-500/20'>2% concession</span>. Also sending over the <a href="#" class="hover:underline text-charney-red">${attachments[2]}</a>.`,
          },
        ],
      },
      auditTrail: [
        { category: 'Ingestion', actor: 'Clarity AI', action: 'Commission created from email.', time: '3 days ago' },
        { category: 'Verification', actor: 'Coordinator', action: "Corrected 'Sale Price'.", time: '2 days ago' },
        { category: 'Communication', actor: 'Coordinator', action: "Requested 'Wire_Instructions.pdf'.", time: '2 days ago' },
        { category: 'Communication', actor: broker, action: "Uploaded 'Wire_Instructions.pdf'.", time: '1 day ago' },
        { category: 'Approval', actor: 'Coordinator', action: 'Approved by Coordinator.', time: '4 hours ago' },
        { category: 'Approval', actor: 'John Doe', action: 'Final approval by Broker.', time: '1 hour ago' },
        { category: 'Payment', actor: 'System', action: 'Payment scheduled.', time: '30 minutes ago' },
      ],
    };
  });
}

export function calculateCommission(deal, plan) {
  const gci = deal.salePrice * (deal.grossCommissionRate / 100);
  const referralFee = gci * (deal.referralFeePct / 100);
  const franchiseFee = gci * (plan.deductions.franchiseFeePct / 100);
  const adjustedGci = gci - referralFee - franchiseFee;

  // COMMISSION CAP LOGIC - COMMENTED OUT FOR NOW
  // Commission cap logic creates complexity where agents near their cap get more than their stated percentage
  // Using simple agent split calculation instead to match RPC function v3.2
  // const remainingCap = plan.commissionCap - plan.currentTowardsCap;
  // const brokerageSharePreCap = adjustedGci * (plan.primarySplit.brokerage / 100);
  // const brokerageShareToCap = Math.min(remainingCap, brokerageSharePreCap);
  // const agentShare = adjustedGci - brokerageShareToCap;  // Cap-adjusted calculation
  
  // SIMPLE AGENT SPLIT CALCULATION (matches RPC v3.2)
  const agentShare = adjustedGci * (plan.primarySplit.agent / 100);
  
  // Set cap variables for debugging/logging (but don't use in calculation)
  const remainingCap = plan.commissionCap - plan.currentTowardsCap;
  const brokerageSharePreCap = adjustedGci * (plan.primarySplit.brokerage / 100);
  const brokerageShareToCap = Math.min(remainingCap, brokerageSharePreCap);

  const agentNet = agentShare - plan.deductions.eoFee - plan.deductions.transactionFee;

  return {
    gci,
    referralFee,
    franchiseFee,
    adjustedGci,
    agentShare,
    brokerageShareToCap,
    agentNet,
    agentSplit: plan.primarySplit.agent,
    eoFee: plan.deductions.eoFee,
    transactionFee: plan.deductions.transactionFee,
  };
}

export function createMockStockData() {
  return [
    { symbol: 'DJI', price: 34584.88, openPrice: 34584.88, change: 123.45, dir: 'up' },
    { symbol: 'S&P 500', price: 4457.49, openPrice: 4457.49, change: -12.34, dir: 'down', alertThreshold: 0.5 },
    { symbol: 'NASDAQ', price: 13748.83, openPrice: 13748.83, change: 8.9, dir: 'up' },
    { symbol: 'MSFT', price: 329.81, openPrice: 329.81, change: 2.78, dir: 'up' },
    { symbol: 'AAPL', price: 174.21, openPrice: 174.21, change: -2.56, dir: 'down' },
    { symbol: 'GOOGL', price: 135.36, openPrice: 135.36, change: 1.12, dir: 'up' },
    { symbol: 'AMZN', price: 137.85, openPrice: 137.85, change: -0.45, dir: 'down' },
    { symbol: 'TSLA', price: 265.28, openPrice: 265.28, change: 5.67, dir: 'up' },
  ];
}

export function createMockUser() {
  return {
    name: 'Alex Johnson',
    avatarUrl: DEFAULT_AVATAR_URL,
  };
}
