/**
 * Enhanced Commission Calculation Utilities
 * Shared logic for proper net payout calculations with all deductions
 */

// Agent plans with commission caps and deductions
export const agentPlans = {
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

/**
 * Calculate enhanced commission payout with all deductions
 * @param {Object} transaction - Transaction data
 * @returns {Object} - Calculation breakdown and final payout amount
 */
export function calculateEnhancedPayout(transaction) {
  const agentName = transaction.final_broker_agent_name;
  const plan = agentPlans[agentName];
  
  let payoutAmount = 0;
  let calculationMethod = 'fallback_simple';
  let breakdown = {};
  
  if (plan) {
    calculationMethod = 'enhanced_with_deductions';
    
    const salePrice = transaction.final_sale_price || 0;
    const commissionRate = transaction.final_listing_commission_percent || 3.0;
    
    const gci = salePrice * (commissionRate / 100);
    const referralFee = 0; // No referral fee in this case
    const franchiseFee = gci * (plan.deductions.franchiseFeePct / 100);
    const adjustedGci = gci - referralFee - franchiseFee;

    const remainingCap = plan.commissionCap - plan.currentTowardsCap;
    const brokerageSharePreCap = adjustedGci * (plan.primarySplit.brokerage / 100);
    const brokerageShareToCap = Math.min(remainingCap, brokerageSharePreCap);
    const agentShare = adjustedGci - brokerageShareToCap;

    payoutAmount = agentShare - plan.deductions.eoFee - plan.deductions.transactionFee;
    
    breakdown = {
      gci,
      franchiseFee,
      adjustedGci,
      remainingCap,
      brokerageShareToCap,
      agentShare,
      eoFee: plan.deductions.eoFee,
      transactionFee: plan.deductions.transactionFee,
      finalPayout: payoutAmount
    };
  } else {
    // Fallback for unknown agents
    const salePrice = transaction.final_sale_price || 0;
    const commissionRate = transaction.final_listing_commission_percent || 3.0;
    const agentSplit = transaction.final_agent_split_percent || 70;
    
    payoutAmount = salePrice * (commissionRate / 100) * (agentSplit / 100);
    
    breakdown = {
      salePrice,
      commissionRate,
      agentSplit,
      finalPayout: payoutAmount
    };
  }

  // Round to 2 decimal places
  payoutAmount = Math.round(payoutAmount * 100) / 100;

  return {
    payoutAmount,
    calculationMethod,
    breakdown,
    agentName,
    agentPlan: plan
  };
}

/**
 * Create enhanced commission payout in database
 * @param {Object} supabaseClient - Initialized Supabase client
 * @param {string} transactionId - Transaction ID
 * @param {Object} user - User object for audit trail
 * @returns {Promise<Object>} - Created payout object
 */
export async function createEnhancedPayout(supabaseClient, transactionId, user) {
  console.log(`🔄 Creating enhanced commission payout for transaction ${transactionId}`);

  // 1. Fetch transaction
  const { data: transaction, error: transactionError } = await supabaseClient
    .from('transactions')
    .select(`
      id,
      final_sale_price,
      final_listing_commission_percent,
      final_agent_split_percent,
      final_broker_agent_name,
      agent_id,
      status
    `)
    .eq('id', transactionId)
    .single();

  if (transactionError || !transaction) {
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  if (transaction.status !== 'approved') {
    throw new Error(`Transaction must be approved to create payout. Current status: ${transaction.status}`);
  }

  // 2. Check if payout already exists
  const { data: existingPayout } = await supabaseClient
    .from('commission_payouts')
    .select('id')
    .eq('transaction_id', transactionId)
    .single();

  if (existingPayout) {
    throw new Error(`Payout already exists for transaction: ${transactionId}`);
  }

  // 3. Calculate enhanced payout
  const calculation = calculateEnhancedPayout(transaction);
  
  if (calculation.payoutAmount <= 0) {
    throw new Error(`Invalid payout amount calculated: ${calculation.payoutAmount}`);
  }

  console.log(`💰 Enhanced payout calculation for ${calculation.agentName}:`, calculation.breakdown);

  // 4. Create commission payout
  const now = new Date();
  const { data: payout, error: payoutError } = await supabaseClient
    .from('commission_payouts')
    .insert({
      transaction_id: transactionId,
      agent_id: transaction.agent_id,
      payout_amount: calculation.payoutAmount,
      status: 'ready',
      auto_ach: false,
      created_at: now.toISOString()
    })
    .select()
    .single();

  if (payoutError) {
    console.error('❌ Failed to create commission payout:', payoutError);
    throw new Error(`Failed to create commission payout: ${payoutError.message}`);
  }

  // 5. Create audit trail
  const { error: eventError } = await supabaseClient
    .from('transaction_events')
    .insert({
      transaction_id: transactionId,
      event_type: 'payout_created',
      actor_name: user.user_metadata?.full_name || user.email,
      actor_id: user.id,
      metadata: {
        payout_id: payout.id,
        payout_amount: calculation.payoutAmount,
        calculation_method: calculation.calculationMethod,
        agent_name: calculation.agentName,
        breakdown: calculation.breakdown,
        created_via: 'enhanced_payout_utility',
        timestamp: now.toISOString()
      },
      visible_to_agent: true
    });

  if (eventError) {
    console.warn('⚠️ Failed to create audit trail:', eventError);
  }

  console.log(`✅ Enhanced commission payout created: ${payout.id} for $${calculation.payoutAmount}`);

  return {
    payout,
    calculation
  };
}