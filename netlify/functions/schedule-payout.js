/**
 * SCHEDULE PAYOUT NETLIFY FUNCTION
 * 
 * Purpose: Handles scheduling of commission payouts for payment processing
 * Integration: Part of Stage 2.3 - Payment Operation Functions
 * 
 * Workflow:
 * 1. Validates user authentication and payout data
 * 2. Updates payout status from 'ready' to 'scheduled'
 * 3. Sets scheduled_at timestamp and payment provider details
 * 4. Creates audit trail event for scheduling action
 * 5. Returns updated payout information
 * 
 * Status Transitions: ready → scheduled
 * 
 * Security: Uses JWT authentication, validates payout ownership, server-side validation
 * Error Handling: Comprehensive validation and audit trail for all actions
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

  console.log('🔄 SCHEDULE-PAYOUT FUNCTION TRIGGERED');
  
  try {
    // STEP 1: EXTRACT AND VALIDATE REQUEST DATA
    const { payout_id, scheduled_date, payment_method, provider_details } = JSON.parse(event.body);
    const authHeader = event.headers.authorization;
    const jwt = authHeader?.split(' ')[1];

    // Validate required parameters
    if (!jwt) throw new Error('Authentication token is required.');
    if (!payout_id) throw new Error('A payout_id is required.');
    if (!scheduled_date) throw new Error('A scheduled_date is required.');
    if (!payment_method) throw new Error('A payment_method is required.');

    // Validate payment method
    const validPaymentMethods = ['ach', 'wire', 'check', 'manual'];
    if (!validPaymentMethods.includes(payment_method)) {
      throw new Error(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
    }

    // STEP 2: AUTHENTICATE USER WITH SUPABASE
    const userSupabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) throw new Error('User not found or token invalid.');

    console.log(`Scheduling payout ${payout_id} for user ${user.id}`);

    // STEP 3: VALIDATE PAYOUT EXISTS AND IS SCHEDULABLE
    const { data: existingPayout, error: fetchError } = await userSupabase
      .from('commission_payouts')
      .select('*')
      .eq('id', payout_id)
      .single();

    if (fetchError) throw new Error(`Payout not found: ${fetchError.message}`);
    
    // Validate payout status - only 'ready' payouts can be scheduled
    if (existingPayout.status !== 'ready') {
      throw new Error(`Cannot schedule payout. Current status: ${existingPayout.status}. Only 'ready' payouts can be scheduled.`);
    }

    // STEP 4: PREPARE PAYOUT UPDATE DATA
    const scheduledAt = new Date(scheduled_date);
    const now = new Date();
    
    // Validate scheduled date is not in the past
    if (scheduledAt < now) {
      throw new Error('Scheduled date cannot be in the past.');
    }

    const updateData = {
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
      payment_method: payment_method,
      provider_details: provider_details || null,
      updated_at: now.toISOString()
    };

    console.log('Scheduling payout with data:', updateData);

    // STEP 5: UPDATE PAYOUT STATUS IN DATABASE
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

    // STEP 6: CREATE AUDIT TRAIL EVENT
    const { error: eventError } = await userSupabase
      .from('transaction_events')
      .insert({
        transaction_id: existingPayout.transaction_id,
        event_type: 'payout_scheduled',
        actor_name: user.email,
        actor_id: user.id,
        metadata: {
          payout_id: payout_id,
          scheduled_date: scheduledAt.toISOString(),
          payment_method: payment_method,
          provider_details: provider_details,
          previous_status: existingPayout.status,
          new_status: 'scheduled',
          scheduled_by: user.email,
          scheduled_at: now.toISOString()
        },
        visible_to_agent: true
      });

    if (eventError) throw eventError;

    console.log(`✅ Payout ${payout_id} scheduled successfully for ${scheduledAt.toISOString()}`);

    // STEP 7: RETURN SUCCESS RESPONSE
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({
        success: true,
        payout: updatedPayout,
        message: `Payout scheduled successfully for ${scheduledAt.toLocaleDateString()}`,
        details: {
          payout_id: payout_id,
          amount: updatedPayout.payout_amount,
          scheduled_date: scheduledAt.toISOString(),
          payment_method: payment_method,
          status: 'scheduled'
        }
      })
    };

  } catch (err) {
    // TOP-LEVEL ERROR HANDLING
    console.error('❌ Top-level schedule-payout error:', err);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        error: err.message || 'An unknown server error occurred.' 
      }) 
    };
  }
}
