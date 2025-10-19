import { createClient } from '@supabase/supabase-js';

/**
 * Enhanced Commission Payout Creation Function
 * Uses proper net payout calculation with all deductions
 */
export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { transaction_id } = JSON.parse(event.body);
    
    if (!transaction_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'transaction_id is required' }),
      };
    }

    // Get auth token from header
    const jwt = event.headers.authorization?.split(' ')[1];
    if (!jwt) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication token is required' }),
      };
    }

    // Initialize Supabase client with user token
    const userSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${jwt}`
          }
        }
      }
    );

    // Get current user for audit trail
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid authentication token' }),
      };
    }

    console.log(`🔄 Creating enhanced commission payout for transaction ${transaction_id}`);

    // 1. Fetch transaction with agent lookup
    const { data: transaction, error: transactionError } = await userSupabase
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
      .eq('id', transaction_id)
      .single();

    if (transactionError || !transaction) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Transaction not found: ${transaction_id}` }),
      };
    }

    if (transaction.status !== 'approved') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Transaction must be approved to create payout. Current status: ${transaction.status}` }),
      };
    }

    // 2. Check if payout already exists
    const { data: existingPayout } = await userSupabase
      .from('commission_payouts')
      .select('id')
      .eq('transaction_id', transaction_id)
      .single();

    if (existingPayout) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Payout already exists for transaction: ${transaction_id}` }),
      };
    }

    // 3. Calculate proper net payout using the same logic as PDF audit
    const agentPlans = {
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

    const agentName = transaction.final_broker_agent_name;
    const plan = agentPlans[agentName];
    
    let payoutAmount = 0;
    
    if (plan) {
      // Use detailed commission calculation
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
      
      console.log(`💰 Enhanced payout calculation for ${agentName}:`, {
        gci: gci,
        franchiseFee: franchiseFee,
        adjustedGci: adjustedGci,
        agentShare: agentShare,
        eoFee: plan.deductions.eoFee,
        transactionFee: plan.deductions.transactionFee,
        finalPayout: payoutAmount
      });
    } else {
      // Fallback for unknown agents
      const salePrice = transaction.final_sale_price || 0;
      const commissionRate = transaction.final_listing_commission_percent || 3.0;
      const agentSplit = transaction.final_agent_split_percent || 70;
      
      payoutAmount = salePrice * (commissionRate / 100) * (agentSplit / 100);
      console.log(`💰 Fallback payout calculation for ${agentName}: ${payoutAmount}`);
    }

    // Round to 2 decimal places
    payoutAmount = Math.round(payoutAmount * 100) / 100;

    if (payoutAmount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Invalid payout amount calculated: ${payoutAmount}` }),
      };
    }

    // 4. Create commission payout directly
    const now = new Date();
    const { data: payout, error: payoutError } = await userSupabase
      .from('commission_payouts')
      .insert({
        transaction_id: transaction_id,
        agent_id: transaction.agent_id,
        payout_amount: payoutAmount,
        status: 'ready',
        auto_ach: false,
        created_at: now.toISOString()
      })
      .select()
      .single();

    if (payoutError) {
      console.error('❌ Failed to create commission payout:', payoutError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create commission payout', details: payoutError.message }),
      };
    }

    // 5. Create audit trail
    const { error: eventError } = await userSupabase
      .from('transaction_events')
      .insert({
        transaction_id: transaction_id,
        event_type: 'payout_created',
        actor_name: user.user_metadata?.full_name || user.email,
        actor_id: user.id,
        metadata: {
          payout_id: payout.id,
          payout_amount: payoutAmount,
          calculation_method: plan ? 'enhanced_with_deductions' : 'fallback_simple',
          agent_name: agentName,
          created_via: 'enhanced_payout_function',
          timestamp: now.toISOString()
        },
        visible_to_agent: true
      });

    if (eventError) {
      console.warn('⚠️ Failed to create audit trail:', eventError);
    }

    console.log(`✅ Enhanced commission payout created: ${payout.id} for $${payoutAmount}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        payout: {
          payout_id: payout.id,
          amount: payoutAmount,
          status: payout.status,
          agent_id: payout.agent_id,
          created_at: payout.created_at
        },
        calculation: plan ? 'enhanced_with_deductions' : 'fallback_simple',
        message: `Enhanced payout created: $${payoutAmount}`
      }),
    };

  } catch (error) {
    console.error('❌ Enhanced payout creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
}