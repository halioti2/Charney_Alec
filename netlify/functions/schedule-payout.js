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
    const { payout_id, payout_ids, scheduled_date, payment_method, auto_ach, provider_details } = JSON.parse(event.body);
    const authHeader = event.headers.authorization;
    const jwt = authHeader?.split(' ')[1];

    // Validate required parameters
    if (!jwt) throw new Error('Authentication token is required.');
    
    // Support both single and bulk operations
    const payoutIds = payout_ids ? (Array.isArray(payout_ids) ? payout_ids : [payout_ids]) 
                                  : (payout_id ? [payout_id] : []);
    
    if (payoutIds.length === 0) throw new Error('At least one payout_id is required.');
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

    console.log(`Scheduling ${payoutIds.length} payout(s) for user ${user.id}:`, payoutIds);

    // STEP 3: VALIDATE SCHEDULED DATE - TIMEZONE SAFE
    const scheduledAt = new Date(scheduled_date);
    const now = new Date();
    
    console.log(`📅 Date validation - Received: "${scheduled_date}"`);
    console.log(`📅 Server parsed as: ${scheduledAt.toISOString()}`);
    console.log(`📅 Current server time: ${now.toISOString()}`);
    console.log(`📅 Timezone offset: ${now.getTimezoneOffset()} minutes`);
    
    // Very permissive date validation - allow anything from yesterday onwards
    // This accounts for timezone differences between client and server
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const scheduleDateTime = new Date(scheduledAt);
    scheduleDateTime.setHours(0, 0, 0, 0);
    
    console.log(`📅 Yesterday cutoff: ${yesterday.toISOString()}`);
    console.log(`📅 Schedule date normalized: ${scheduleDateTime.toISOString()}`);
    console.log(`📅 Is schedule date < yesterday? ${scheduleDateTime < yesterday}`);
    
    if (scheduleDateTime < yesterday) {
      throw new Error(`Scheduled date is too far in the past. Received: ${scheduled_date}, parsed as: ${scheduleDateTime.toISOString()}, Server time: ${now.toISOString()}, Cutoff: ${yesterday.toISOString()}`);
    }
    
    console.log(`✅ Date validation passed. Scheduled: ${scheduled_date} (${scheduleDateTime.toISOString()}), Server time: ${now.toISOString()}`);

    // STEP 4: PROCESS ALL PAYOUTS
    const results = [];
    const errors = [];

    for (const payoutId of payoutIds) {
      try {
        console.log(`Processing payout: ${payoutId}`);

        // Validate payout exists and is schedulable
        const { data: existingPayout, error: fetchError } = await userSupabase
          .from('commission_payouts')
          .select('*')
          .eq('id', payoutId)
          .single();

        if (fetchError) {
          errors.push({ payout_id: payoutId, error: `Payout not found: ${fetchError.message}` });
          continue;
        }
        
        // Validate payout status - only 'ready' payouts can be scheduled
        if (existingPayout.status !== 'ready') {
          errors.push({ 
            payout_id: payoutId, 
            error: `Cannot schedule payout. Current status: ${existingPayout.status}. Only 'ready' payouts can be scheduled.` 
          });
          continue;
        }

        // Prepare update data based on actual table schema
        const updateData = {
          status: 'scheduled',
          scheduled_at: scheduledAt.toISOString(),
          auto_ach: auto_ach || (payment_method === 'ach'),
          ach_provider: (payment_method === 'ach' && provider_details) ? provider_details.provider : null,
          ach_reference: (payment_method === 'ach' && provider_details) ? provider_details.reference : null
        };

        console.log(`Scheduling payout ${payoutId} with data:`, updateData);

        // Update payout status in database
        const { data: updatedPayout, error: updateError } = await userSupabase
          .from('commission_payouts')
          .update(updateData)
          .eq('id', payoutId)
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

        if (updateError) {
          errors.push({ payout_id: payoutId, error: `Update failed: ${updateError.message}` });
          continue;
        }

        // Create audit trail event
        const { error: eventError } = await userSupabase
          .from('transaction_events')
          .insert({
            transaction_id: existingPayout.transaction_id,
            event_type: 'payout_scheduled',
            actor_name: user.email,
            actor_id: user.id,
            metadata: {
              payout_id: payoutId,
              scheduled_date: scheduledAt.toISOString(),
              payment_method: payment_method,
              auto_ach: auto_ach || false,
              provider_details: provider_details,
              previous_status: existingPayout.status,
              new_status: 'scheduled',
              scheduled_by: user.email,
              scheduled_at: now.toISOString()
            },
            visible_to_agent: true
          });

        if (eventError) {
          console.warn(`Failed to create audit event for payout ${payoutId}:`, eventError);
          // Don't fail the whole operation for audit trail issues
        }

        results.push({
          payout_id: payoutId,
          success: true,
          payout: updatedPayout,
          scheduled_at: scheduledAt.toISOString()
        });

        console.log(`✅ Payout ${payoutId} scheduled successfully`);

      } catch (error) {
        console.error(`Failed to schedule payout ${payoutId}:`, error);
        errors.push({ payout_id: payoutId, error: error.message });
      }
    }

    // STEP 5: RETURN BULK RESULTS
    const successCount = results.length;
    const errorCount = errors.length;
    
    if (successCount === 0) {
      // All failed
      throw new Error(`Failed to schedule any payouts. Errors: ${errors.map(e => e.error).join(', ')}`);
    }
    
    console.log(`✅ Scheduled ${successCount} payout(s) successfully, ${errorCount} failed`);

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({
        success: true,
        scheduled_count: successCount,
        error_count: errorCount,
        results: results,
        errors: errors,
        message: errorCount > 0 
          ? `Scheduled ${successCount} payout(s), ${errorCount} failed`
          : `All ${successCount} payout(s) scheduled successfully for ${scheduledAt.toLocaleDateString()}`,
        details: {
          payout_ids: payoutIds,
          scheduled_date: scheduledAt.toISOString(),
          payment_method: payment_method,
          auto_ach: auto_ach || false,
          total_amount: results.reduce((sum, r) => sum + (r.payout?.payout_amount || 0), 0),
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
