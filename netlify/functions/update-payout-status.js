/**
 * UPDATE PAYOUT STATUS NETLIFY FUNCTION
 * 
 * Purpose: Handles status updates for commission payouts (e.g., mark as paid, cancel, etc.)
 * Integration: Part of Stage 2.3 - Payment Operation Functions
 * 
 * Workflow:
 * 1. Validates user authentication and status transition
 * 2. Updates payout status with proper state machine validation
 * 3. Records payment completion details (date, reference, etc.)
 * 4. Creates comprehensive audit trail
 * 5. Returns updated payout information
 * 
 * Valid Status Transitions:
 * - ready → scheduled → processing → paid
 * - ready → cancelled
 * - scheduled → cancelled
 * - processing → failed → scheduled (retry)
 * 
 * Security: Uses JWT authentication, validates state transitions, server-side validation
 * Error Handling: Validates all status changes and logs detailed audit trail
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

  console.log('🔄 UPDATE-PAYOUT-STATUS FUNCTION TRIGGERED');
  
  try {
    // STEP 1: EXTRACT AND VALIDATE REQUEST DATA
    const { 
      payout_id, 
      new_status, 
      paid_at, 
      payment_reference, 
      ach_provider, 
      failure_reason,
      notes 
    } = JSON.parse(event.body);
    
    const authHeader = event.headers.authorization;
    const jwt = authHeader?.split(' ')[1];

    // Validate required parameters
    if (!jwt) throw new Error('Authentication token is required.');
    if (!payout_id) throw new Error('A payout_id is required.');
    if (!new_status) throw new Error('A new_status is required.');

    // Validate status values
    const validStatuses = ['ready', 'scheduled', 'processing', 'paid', 'failed', 'cancelled'];
    if (!validStatuses.includes(new_status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // STEP 2: AUTHENTICATE USER WITH SUPABASE
    const userSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error('User not found or token invalid.');

    console.log(`Updating payout ${payout_id} status to ${new_status} for user ${user.id}`);

    // STEP 3: VALIDATE PAYOUT EXISTS AND GET CURRENT STATUS
    const { data: existingPayout, error: fetchError } = await userSupabase
      .from('commission_payouts')
      .select('*')
      .eq('id', payout_id)
      .single();

    if (fetchError) throw new Error(`Payout not found: ${fetchError.message}`);
    
    const currentStatus = existingPayout.status;
    console.log(`Current status: ${currentStatus} → New status: ${new_status}`);

    // STEP 4: VALIDATE STATUS TRANSITION
    const validTransitions = {
      'ready': ['scheduled', 'cancelled'],
      'scheduled': ['processing', 'cancelled'],
      'processing': ['paid', 'failed'],
      'failed': ['scheduled', 'cancelled'], // Allow retry
      'paid': [], // Terminal state
      'cancelled': [] // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(new_status)) {
      throw new Error(`Invalid status transition from '${currentStatus}' to '${new_status}'. Valid transitions: ${validTransitions[currentStatus]?.join(', ') || 'none'}`);
    }

    // STEP 5: PREPARE UPDATE DATA BASED ON NEW STATUS
    const now = new Date();
    const updateData = {
      status: new_status,
      updated_at: now.toISOString()
    };

    // Status-specific data updates
    switch (new_status) {
      case 'paid':
        updateData.paid_at = paid_at ? new Date(paid_at).toISOString() : now.toISOString();
        if (payment_reference) updateData.ach_reference = payment_reference;
        if (ach_provider) updateData.ach_provider = ach_provider;
        break;
      
      case 'failed':
        if (failure_reason) updateData.failure_reason = failure_reason;
        break;
      
      case 'processing':
        if (ach_provider) updateData.ach_provider = ach_provider;
        break;
      
      case 'cancelled':
        if (failure_reason) updateData.failure_reason = failure_reason;
        break;
    }

    console.log('Updating payout with data:', updateData);

    // STEP 6: UPDATE PAYOUT STATUS IN DATABASE
    const { data: updatedPayout, error: updateError } = await userSupabase
      .from('commission_payouts')
      .update(updateData)
      .eq('id', payout_id)
      .select(`
        *,
        transactions!commission_payouts_transaction_id_fkey (
          id,
          property_address,
          final_sale_price,
          agent_id
        )
      `)
      .single();

    if (updateError) throw updateError;

    // STEP 7: CREATE COMPREHENSIVE AUDIT TRAIL EVENT
    const { error: eventError } = await userSupabase
      .from('transaction_events')
      .insert({
        transaction_id: existingPayout.transaction_id,
        event_type: 'payout_status_updated',
        actor_name: user.email,
        actor_id: user.id,
        metadata: {
          payout_id: payout_id,
          previous_status: currentStatus,
          new_status: new_status,
          paid_at: updateData.paid_at || null,
          payment_reference: payment_reference || null,
          ach_provider: ach_provider || null,
          failure_reason: failure_reason || null,
          notes: notes || null,
          updated_by: user.email,
          updated_at: now.toISOString(),
          payout_amount: existingPayout.payout_amount
        },
        visible_to_agent: ['paid', 'cancelled', 'failed'].includes(new_status)
      });

    if (eventError) throw eventError;

    // STEP 8: CREATE STATUS-SPECIFIC SUCCESS MESSAGE
    let message = `Payout status updated to ${new_status}`;
    switch (new_status) {
      case 'paid':
        message = `Payout marked as paid${paid_at ? ` on ${new Date(paid_at).toLocaleDateString()}` : ''}`;
        break;
      case 'scheduled':
        message = 'Payout rescheduled for processing';
        break;
      case 'processing':
        message = 'Payout is now being processed';
        break;
      case 'failed':
        message = `Payout failed${failure_reason ? `: ${failure_reason}` : ''}`;
        break;
      case 'cancelled':
        message = `Payout cancelled${failure_reason ? `: ${failure_reason}` : ''}`;
        break;
    }

    console.log(`✅ Payout ${payout_id} status updated: ${currentStatus} → ${new_status}`);

    // STEP 9: RETURN SUCCESS RESPONSE
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({
        success: true,
        payout: updatedPayout,
        message: message,
        details: {
          payout_id: payout_id,
          amount: updatedPayout.payout_amount,
          previous_status: currentStatus,
          new_status: new_status,
          updated_at: now.toISOString()
        }
      })
    };

  } catch (err) {
    // TOP-LEVEL ERROR HANDLING
    console.error('❌ Top-level update-payout-status error:', err);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: err.message || 'An unknown server error occurred.' 
      }) 
    };
  }
}
