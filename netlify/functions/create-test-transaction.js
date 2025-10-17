import { createClient } from '@supabase/supabase-js';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (event.httpMethod === 'OPTIONS') { 
    return { statusCode: 200, headers }; 
  }
  
  if (event.httpMethod !== 'POST') { 
    return { statusCode: 405, headers, body: 'Method Not Allowed' }; 
  }

  console.log('🔄 CREATE-TEST-TRANSACTION FUNCTION TRIGGERED');
  
  try {
    const requestBody = JSON.parse(event.body);
    const { 
      test_type, 
      sale_price, 
      commission_rate, 
      agent_split 
    } = requestBody;
    
    const authHeader = event.headers.authorization;
    const jwt = authHeader?.split(' ')[1];

    if (!jwt) throw new Error('Authentication token is required.');
    if (!test_type || !['phase1a', 'phase1b'].includes(test_type)) {
      throw new Error('Valid test_type (phase1a or phase1b) is required.');
    }

    const userSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error('User not found or token invalid.');

    const timestamp = new Date().toISOString();
    const randomId = Math.floor(Math.random() * 9999);
    
    // Get a real agent from the database for testing
    console.log('🔍 Attempting to fetch agents from database...');
    const { data: agents, error: agentsError } = await userSupabase
      .from('agents')
      .select('id, full_name, email')
      .limit(5);
    
    if (agentsError) {
      console.error('❌ Failed to fetch agents for test transaction:', agentsError);
      console.error('Error details:', JSON.stringify(agentsError, null, 2));
    } else {
      console.log('📋 Agents query result:', agents);
    }
    
    const testAgentId = agents && agents.length > 0 ? agents[0].id : null;
    const testAgentName = agents && agents.length > 0 ? agents[0].full_name : `Test Agent ${randomId}`;
    
    console.log(`🎯 Using agent for test: ${testAgentName} (${testAgentId})`);
    
    if (!testAgentId) {
      console.warn('⚠️  No agent ID available - will create transaction without agent reference');
    }
    
    const transactionData = {
      property_address: `${randomId} Test Street, Demo City, ST 12345`,
      final_sale_price: sale_price || (test_type === 'phase1a' ? 750000 : 1000000),
      final_broker_agent_name: testAgentName,
      final_listing_commission_percent: commission_rate || 4.2,
      final_buyer_commission_percent: 2.5,
      final_agent_split_percent: agent_split || 75,
      status: test_type === 'phase1a' ? 'approved' : 'in_queue',
      intake_status: test_type === 'phase1a' ? 'completed' : 'in_review',
      agent_id: testAgentId,
      brokerage_id: '5cac5c2d-8aa8-4509-92b2-137b590e3b0d'
    };

    console.log(`Creating ${test_type} transaction:`, transactionData);

    // 1. Create the transaction
    const { data: transaction, error: transactionError } = await userSupabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) throw transactionError;

    // 2. Create commission evidence
    const evidenceData = {
      transaction_id: transaction.id,
      extraction_data: {
        broker_agent_name: testAgentName,
        property_address: transactionData.property_address,
        sale_price: transactionData.final_sale_price,
        listing_side_commission_percent: transactionData.final_listing_commission_percent,
        buyer_side_commission_percent: transactionData.final_buyer_commission_percent,
        agent_split_percent: transactionData.final_agent_split_percent,
        detected_conflicts: test_type === 'phase1b' ? ['Test conflict for manual review'] : []
      },
      confidence: test_type === 'phase1a' ? 98 : 75,
      requires_review: test_type === 'phase1b',
      source_document_type: 'contract',
      created_at: timestamp
    };

    const { data: evidence, error: evidenceError } = await userSupabase
      .from('commission_evidences')
      .insert(evidenceData)
      .select()
      .single();

    if (evidenceError) throw evidenceError;

    // 3. Create transaction event
    const { error: eventError } = await userSupabase
      .from('transaction_events')
      .insert({
        transaction_id: transaction.id,
        event_type: test_type === 'phase1a' ? 'auto_approved' : 'needs_review',
        actor_name: 'Test System',
        actor_id: user.id,
        metadata: {
          test_type,
          created_via: 'test_function',
          confidence: evidenceData.confidence,
          timestamp
        },
        visible_to_agent: true
      });

    if (eventError) throw eventError;

    // 4. For phase1a (approved), create commission payout using RPC function
    let payoutResult = null;
    let payoutError = null;
    
    if (test_type === 'phase1a') {
      try {
        console.log(`🔄 Creating commission payout for approved test transaction ${transaction.id}`);
        
        const { data: payout, error: rpcError } = await userSupabase
          .rpc('create_commission_payout', { 
            p_transaction_id: transaction.id 
          });

        if (rpcError) {
          console.error('⚠️ Test payout creation failed:', rpcError.message);
          payoutError = rpcError.message;
        } else {
          payoutResult = payout?.[0] || null;
          console.log(`✅ Test commission payout created:`, payoutResult);
        }
      } catch (rpcErr) {
        console.error('⚠️ Test payout creation exception:', rpcErr.message);
        payoutError = rpcErr.message;
      }
    }

    console.log(`✅ Test transaction created: ${transaction.id} (${test_type})`);

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({
        success: true,
        transaction,
        evidence,
        payout: payoutResult,
        payout_error: payoutError,
        test_type,
        message: test_type === 'phase1a' 
          ? (payoutError 
            ? `${test_type.toUpperCase()} test transaction created, but payout creation failed`
            : `${test_type.toUpperCase()} test transaction and payout created successfully`)
          : `${test_type.toUpperCase()} test transaction created successfully`
      })
    };

  } catch (err) {
    console.error('❌ Top-level create-test-transaction error:', err);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: err.message || 'An unknown server error occurred.' 
      }) 
    };
  }
}