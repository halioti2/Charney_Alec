/**
 * APPROVE TRANSACTION NETLIFY FUNCTION
 * 
 * Purpose: Handles manual verification approval of transactions with automatic payout creation
 * Integration: Part of Stage 2.2 - Auto-Payout Integration with Approval Flows
 * 
 * Workflow:
 * 1. Validates user authentication and transaction data
 * 2. Updates transaction with final approved data
 * 3. Creates audit trail event for approval
 * 4. Attempts automatic payout creation via RPC function
 * 5. Logs all outcomes for transparency
 * 
 * Error Handling Strategy:
 * - Transaction approval ALWAYS succeeds if data is valid
 * - Payout creation failures are logged but don't block approval
 * - Categorized error responses for different failure types
 * - Comprehensive audit trail for all actions and failures
 * 
 * Security: Uses JWT authentication, validates user permissions, server-side data validation
 */
import { createClient } from '@supabase/supabase-js';

export async function handler(event) {
  // CORS headers for cross-origin requests from frontend
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') { 
    return { statusCode: 200, headers }; 
  }
  
  // Only allow POST requests for security
  if (event.httpMethod !== 'POST') { 
    return { statusCode: 405, headers, body: 'Method Not Allowed' }; 
  }

  console.log('🔄 APPROVE-TRANSACTION FUNCTION TRIGGERED');
  
  try {
    // STEP 1: EXTRACT AND VALIDATE REQUEST DATA
    const { transaction_id, final_data, checklist_responses = null } = JSON.parse(event.body);
    const authHeader = event.headers.authorization;
    const jwt = authHeader?.split(' ')[1];

    // Validate required parameters
    if (!jwt) throw new Error('Authentication token is required.');
    if (!transaction_id) throw new Error('A transaction_id is required.');
    if (!final_data) throw new Error('Final data is required.');

    // STEP 2: AUTHENTICATE USER WITH SUPABASE
    const userSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error('User not found or token invalid.');

    console.log(`Approving transaction ${transaction_id} for user ${user.id}`);

    // STEP 3: PREPARE TRANSACTION UPDATE DATA
    // Clean and validate numeric fields to prevent injection and ensure proper types
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

    // STEP 4: UPDATE TRANSACTION IN DATABASE
    const { data: updatedTransaction, error: transactionError } = await userSupabase
      .from('transactions')
      .update(cleanFinalData)
      .eq('id', transaction_id)
      .select()
      .single();

    if (transactionError) throw transactionError;

    // STEP 5: CREATE AUDIT TRAIL EVENT
    // Record manual approval action for compliance and tracking
    const { error: eventError } = await userSupabase
      .from('transaction_events')
      .insert({
        transaction_id: transaction_id,
        event_type: 'manual_approval',
        actor_name: user.email,
        actor_id: user.id,
        metadata: {
          final_data,
          checklist_responses: checklist_responses || null, // Optional: checklist requirement removed
          approved_at: new Date().toISOString()
        },
        visible_to_agent: true
      });

    if (eventError) throw eventError;

    // STEP 6: AUTOMATIC PAYOUT CREATION VIA RPC
    // This integrates with the commission payout RPC function created in Stage 2.1
    // The RPC function handles all business logic: validation, calculation, and audit trail
    let payoutResult = null;
    let payoutError = null;
    let payoutWarning = null;
    
    try {
      console.log(`🔄 Creating commission payout for transaction ${transaction_id}`);
      
      const { data: payout, error: rpcError } = await userSupabase
        .rpc('create_commission_payout', { 
          p_transaction_id: transaction_id 
        });

      if (rpcError) {
        // CATEGORIZED ERROR HANDLING: Different error types get different treatment
        // This allows the frontend to handle various scenarios appropriately
        if (rpcError.message?.includes('already exists')) {
          payoutWarning = 'Payout already exists for this transaction';
          console.log(`⚠️ Payout already exists for transaction ${transaction_id}`);
        } else if (rpcError.message?.includes('not found')) {
          payoutError = 'Transaction not found for payout creation';
          console.error(`❌ Transaction ${transaction_id} not found for payout`);
        } else if (rpcError.message?.includes('not approved')) {
          payoutError = 'Transaction must be approved before creating payout';
          console.error(`❌ Transaction ${transaction_id} not approved for payout`);
        } else {
          payoutError = `Payout creation failed: ${rpcError.message}`;
          console.error(`❌ Payout creation failed for ${transaction_id}:`, rpcError.message);
        }
        
        // AUDIT TRAIL: Log all payout failures for debugging and compliance
        await userSupabase
          .from('transaction_events')
          .insert({
            transaction_id: transaction_id,
            event_type: 'payout_creation_failed',
            actor_name: user.email,
            actor_id: user.id,
            metadata: {
              error: rpcError.message,
              error_code: rpcError.code || 'UNKNOWN',
              attempted_at: new Date().toISOString()
            },
            visible_to_agent: false
          });
          
      } else {
        payoutResult = payout?.[0] || null;
        console.log(`✅ Commission payout created:`, payoutResult);
        
        // AUDIT TRAIL: Log successful payout creation
        await userSupabase
          .from('transaction_events')
          .insert({
            transaction_id: transaction_id,
            event_type: 'payout_created',
            actor_name: 'System',
            metadata: {
              payout_id: payoutResult?.payout_id,
              payout_amount: payoutResult?.amount,
              created_via: 'manual_approval'
            },
            visible_to_agent: true
          });
      }
    } catch (rpcErr) {
      payoutError = `Payout creation exception: ${rpcErr.message}`;
      console.error(`❌ Payout creation exception for ${transaction_id}:`, rpcErr.message);
      
      // AUDIT TRAIL: Log exception events for debugging
      await userSupabase
        .from('transaction_events')
        .insert({
          transaction_id: transaction_id,
          event_type: 'payout_creation_exception',
          actor_name: user.email,
          actor_id: user.id,
          metadata: {
            exception: rpcErr.message,
            stack: rpcErr.stack || 'No stack trace available',
            attempted_at: new Date().toISOString()
          },
          visible_to_agent: false
        });
    }

    console.log(`✅ Transaction ${transaction_id} approved successfully`);

    // STEP 7: RETURN COMPREHENSIVE RESPONSE
    // The response includes all relevant information for frontend handling
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({
        success: true,
        transaction: updatedTransaction,
        payout: payoutResult,
        payout_error: payoutError,
        payout_warning: payoutWarning,
        message: payoutError 
          ? 'Transaction approved successfully, but payout creation failed'
          : payoutWarning
          ? 'Transaction approved successfully, payout already existed'
          : 'Transaction approved and payout created successfully'
      })
    };

  } catch (err) {
    // TOP-LEVEL ERROR HANDLING: Catches any unhandled errors in the entire function
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