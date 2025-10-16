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

  console.log('🔄 APPROVE-TRANSACTION FUNCTION TRIGGERED');
  
  try {
    const { transaction_id, final_data, checklist_responses } = JSON.parse(event.body);
    const authHeader = event.headers.authorization;
    const jwt = authHeader?.split(' ')[1];

    if (!jwt) throw new Error('Authentication token is required.');
    if (!transaction_id) throw new Error('A transaction_id is required.');
    if (!final_data) throw new Error('Final data is required.');

    const userSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error('User not found or token invalid.');

    console.log(`Approving transaction ${transaction_id} for user ${user.id}`);

    // Clean and validate numeric fields
    const cleanFinalData = {
      status: 'approved',
      intake_status: 'completed',
      final_broker_agent_name: final_data.final_broker_agent_name || null,
      property_address: final_data.property_address || null,
      final_sale_price: final_data.final_sale_price ? parseFloat(final_data.final_sale_price) : null,
      final_listing_commission_percent: final_data.final_listing_commission_percent ? parseFloat(final_data.final_listing_commission_percent) : null,
      final_buyer_commission_percent: final_data.final_buyer_commission_percent ? parseFloat(final_data.final_buyer_commission_percent) : null,
      final_agent_split_percent: final_data.final_agent_split_percent ? parseFloat(final_data.final_agent_split_percent) : null,
      final_co_broker_agent_name: final_data.final_co_broker_agent_name || null,
      final_co_brokerage_firm_name: final_data.final_co_brokerage_firm_name || null,
      updated_at: new Date().toISOString()
    };

    console.log('Cleaned final data:', cleanFinalData);

    // 1. Update the transaction with final data
    const { data: updatedTransaction, error: transactionError } = await userSupabase
      .from('transactions')
      .update(cleanFinalData)
      .eq('id', transaction_id)
      .select()
      .single();

    if (transactionError) throw transactionError;

    // 2. Create transaction event for audit trail
    const { error: eventError } = await userSupabase
      .from('transaction_events')
      .insert({
        transaction_id: transaction_id,
        event_type: 'manual_approval',
        actor_name: user.email,
        actor_id: user.id,
        metadata: {
          final_data,
          checklist_responses,
          approved_at: new Date().toISOString()
        },
        visible_to_agent: true
      });

    if (eventError) throw eventError;

    console.log(`✅ Transaction ${transaction_id} approved successfully`);

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({
        success: true,
        transaction: updatedTransaction,
        message: 'Transaction approved successfully'
      })
    };

  } catch (err) {
    console.error('❌ Top-level approve-transaction error:', err);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: err.message || 'An unknown server error occurred.' 
      }) 
    };
  }
}