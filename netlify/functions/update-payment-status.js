import { createClient } from '@supabase/supabase-js';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { transactionId, paymentStatus, paidAt, achReference, failureReason } = JSON.parse(event.body);
    
    // Get JWT token from Authorization header
    const jwt = event.headers.authorization?.split(' ')[1];
    if (!jwt) {
      throw new Error('Authentication token is required.');
    }

    // Create authenticated Supabase client
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

    // Verify user is authenticated
    const { data: { user } } = await userSupabase.auth.getUser();
    if (!user) {
      throw new Error('User not found or token invalid.');
    }

    // Validate required data
    if (!transactionId) {
      throw new Error('Transaction ID is required.');
    }

    if (!paymentStatus || !['scheduled', 'paid', 'failed', 'cancelled'].includes(paymentStatus)) {
      throw new Error('Valid payment status is required (scheduled, paid, failed, cancelled).');
    }

    // Fetch current transaction to validate
    const { data: transaction, error: fetchError } = await userSupabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    // Prepare update data
    const updateData = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    };

    // Add status-specific fields
    if (paymentStatus === 'paid') {
      updateData.paid_at = paidAt || new Date().toISOString();
      if (achReference) {
        updateData.ach_reference = achReference;
      }
    }

    if (paymentStatus === 'failed' && failureReason) {
      updateData.payment_failure_reason = failureReason;
    }

    // Update transaction with payment status
    const { error: updateError } = await userSupabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId);

    if (updateError) {
      throw new Error(`Failed to update transaction: ${updateError.message}`);
    }

    // Create transaction event for payment status change
    const eventMetadata = {
      previous_status: transaction.payment_status || 'none',
      new_status: paymentStatus,
    };

    if (achReference) {
      eventMetadata.ach_reference = achReference;
    }

    if (failureReason) {
      eventMetadata.failure_reason = failureReason;
    }

    const { error: eventError } = await userSupabase
      .from('transaction_events')
      .insert({
        transaction_id: transactionId,
        event_type: `payment_${paymentStatus}`,
        actor_name: user.email || 'System',
        metadata: eventMetadata,
      });

    if (eventError) {
      console.error(`Error creating event for transaction ${transactionId}:`, eventError);
      // Continue even if event creation fails
    }

    console.log(`Updated payment status for transaction ${transactionId}: ${paymentStatus}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        transaction_id: transactionId,
        payment_status: paymentStatus,
        updated_at: updateData.updated_at,
        paid_at: updateData.paid_at || null,
        ach_reference: updateData.ach_reference || null,
      }),
    };

  } catch (error) {
    console.error('Payment status update error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        success: false,
      }),
    };
  }
}