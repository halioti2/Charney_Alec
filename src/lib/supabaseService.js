import { supabase } from './supabaseClient.js';

/**
 * Fetch all transactions with their related commission evidences
 * @returns {Promise<Array>} Array of transactions with commission data
 */
export async function fetchTransactions() {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        commission_evidences (
          id,
          extraction_data,
          confidence,
          requires_review,
          source_document_type,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    return transactions || [];
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return [];
  }
}

/**
 * Fetch a specific transaction with commission evidences for verification modal
 * @param {string} transactionId - The transaction ID
 * @returns {Promise<Object|null>} Transaction with evidence data
 */
export async function fetchTransactionForVerification(transactionId) {
  try {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        commission_evidences (
          id,
          extraction_data,
          confidence,
          requires_review,
          source_document_type,
          source_document_url,
          created_at
        ),
        transaction_events (
          id,
          event_type,
          actor_name,
          created_at,
          metadata
        )
      `)
      .eq('id', transactionId)
      .single();

    if (error) {
      console.error('Error fetching transaction for verification:', error);
      throw error;
    }

    return transaction;
  } catch (error) {
    console.error('Failed to fetch transaction for verification:', error);
    return null;
  }
}

/**
 * Subscribe to realtime changes on transactions table
 * @param {Function} callback - Function to call when changes occur
 * @returns {Object} Supabase subscription object
 */
export function subscribeToTransactions(callback) {
  const subscription = supabase
    .channel('coordinator-transactions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'transactions',
      },
      (payload) => {
        console.log('Transaction update received:', payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log('Transaction subscription status:', status);
    });

  return subscription;
}

/**
 * Subscribe to realtime changes on commission_evidences table
 * @param {Function} callback - Function to call when changes occur
 * @returns {Object} Supabase subscription object
 */
export function subscribeToCommissionEvidences(callback) {
  const subscription = supabase
    .channel('coordinator-evidences')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'commission_evidences',
      },
      (payload) => {
        console.log('Commission evidence update received:', payload);
        callback(payload);
      }
    )
    .subscribe((status) => {
      console.log('Commission evidence subscription status:', status);
    });

  return subscription;
}

/**
 * Transform Supabase transaction data to match component expectations
 * @param {Array} transactions - Raw transactions from Supabase
 * @returns {Array} Transformed transactions for components
 */
export function transformTransactionsForUI(transactions) {
  return transactions.map((transaction) => {
    const evidence = transaction.commission_evidences?.[0];
    const extractionData = evidence?.extraction_data || {};

    return {
      id: transaction.id,
      broker: transaction.final_broker_agent_name || extractionData.broker_agent_name || 'Unknown Agent',
      propertyAddress: transaction.property_address || extractionData.property_address || 'Unknown Property',
      salePrice: transaction.final_sale_price || extractionData.sale_price || 0,
      grossCommissionRate: 
        transaction.final_listing_commission_percent || 
        extractionData.listing_side_commission_percent || 
        3.0,
      status: getUIStatus(transaction),
      confidence: evidence?.confidence || 0,
      requiresReview: evidence?.requires_review || false,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
      // Keep raw transaction data for verification modal
      _rawTransaction: transaction,
    };
  });
}

/**
 * Get user-friendly status for UI display
 * @param {Object} transaction - Transaction object
 * @returns {string} UI status
 */
function getUIStatus(transaction) {
  const evidence = transaction.commission_evidences?.[0];
  
  if (transaction.status === 'approved') {
    return 'Approved';
  }
  
  if (transaction.intake_status === 'completed' && evidence?.requires_review === false) {
    return 'Approved';
  }
  
  if (evidence?.requires_review === true) {
    return 'Needs Review';
  }
  
  if (transaction.intake_status === 'in_queue') {
    return 'Processing';
  }
  
  return 'Awaiting Info';
}

/**
 * Fetch all commission payouts with related transaction and agent data
 * @returns {Promise<Array>} Array of commission payouts with related data
 */
export async function fetchCommissionPayouts() {
  try {
    const { data: payouts, error } = await supabase
      .from('commission_payouts')
      .select(`
        *,
        transactions!commission_payouts_transaction_id_fkey (
          id,
          property_address,
          final_sale_price,
          created_at
        ),
        agents (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commission payouts:', error);
      throw error;
    }

    return payouts || [];
  } catch (error) {
    console.error('Failed to fetch commission payouts:', error);
    return [];
  }
}

/**
 * Transform commission payouts for UI display
 * @param {Array} payouts - Raw payout data from Supabase
 * @returns {Array} Transformed payout data for UI components
 */
export function transformPayoutsForUI(payouts) {
  if (!Array.isArray(payouts)) return [];

  return payouts.map(payout => {
    const transaction = payout.transactions;
    const agent = payout.agents;

    return {
      id: payout.id,
      transaction_id: payout.transaction_id,
      agent_id: payout.agent_id,
      payout_amount: payout.payout_amount,
      status: payout.status,
      auto_ach: payout.auto_ach,
      batch_id: payout.batch_id,
      ach_provider: payout.ach_provider,
      ach_reference: payout.ach_reference,
      scheduled_at: payout.scheduled_at,
      paid_at: payout.paid_at,
      failure_reason: payout.failure_reason,
      created_at: payout.created_at,
      // Related data
      property_address: transaction?.property_address,
      final_sale_price: transaction?.final_sale_price,
      agent_name: agent?.full_name,
      agent_email: agent?.email,
      // Keep raw data for advanced operations
      _rawPayout: payout,
    };
  });
}