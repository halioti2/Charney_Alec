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
    const { transactionIds, batchId, achEnabled, batchNote } = JSON.parse(event.body);
    
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
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      throw new Error('Transaction IDs are required and must be a non-empty array.');
    }

    if (!batchId) {
      throw new Error('Batch ID is required.');
    }

    // Process each transaction payment
    const processedTransactions = [];
    const timestamp = new Date().toISOString();
    
    for (const transactionId of transactionIds) {
      // Fetch current transaction to validate
      const { data: transaction, error: fetchError } = await userSupabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError || !transaction) {
        console.error(`Error fetching transaction ${transactionId}:`, fetchError);
        continue;
      }

      // Validate transaction is eligible for payment (approved and not already paid)
      if (transaction.status !== 'approved') {
        console.error(`Transaction ${transactionId} is not approved for payment`);
        continue;
      }

      if (transaction.paid_at) {
        console.error(`Transaction ${transactionId} is already paid`);
        continue;
      }

      // Update transaction with payment information
      const { error: updateError } = await userSupabase
        .from('transactions')
        .update({
          payment_batch_id: batchId,
          payment_method: achEnabled ? 'ach' : 'manual',
          scheduled_payout_date: timestamp,
          payment_status: 'scheduled',
          updated_at: timestamp,
        })
        .eq('id', transactionId);

      if (updateError) {
        console.error(`Error updating transaction ${transactionId}:`, updateError);
        continue;
      }

      // Create transaction event for payment scheduling
      const { error: eventError } = await userSupabase
        .from('transaction_events')
        .insert({
          transaction_id: transactionId,
          event_type: 'payment_scheduled',
          actor_name: user.email || 'System',
          metadata: {
            batch_id: batchId,
            payment_method: achEnabled ? 'ach' : 'manual',
            batch_note: batchNote || null,
            scheduled_at: timestamp,
          },
        });

      if (eventError) {
        console.error(`Error creating event for transaction ${transactionId}:`, eventError);
        // Continue processing even if event creation fails
      }

      processedTransactions.push({
        transaction_id: transactionId,
        status: 'scheduled',
        batch_id: batchId,
        payment_method: achEnabled ? 'ach' : 'manual',
      });
    }

    console.log(`Processed ${processedTransactions.length} payments for batch ${batchId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        batch_id: batchId,
        processed_count: processedTransactions.length,
        processed_transactions: processedTransactions,
        payment_method: achEnabled ? 'ach' : 'manual',
        scheduled_at: timestamp,
      }),
    };

  } catch (error) {
    console.error('Payment processing error:', error);
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