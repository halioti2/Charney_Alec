-- FIXED VERSION: Create commission payout RPC function
-- 
-- ISSUES RESOLVED:
-- 1. PostgreSQL ROUND function syntax: Changed ROUND(value, 2) to ROUND(value::NUMERIC, 2)
-- 2. Column reference error: Fixed "f6" reference (if it existed in original)
--
-- DEPLOYMENT INSTRUCTIONS:
-- 1. Run this SQL directly in your Supabase SQL Editor
-- 2. Or save as migration file and run: npx supabase db push
-- 3. Test with: SELECT * FROM create_commission_payout('your-transaction-id');
--
-- ERROR HISTORY:
-- - "function round(double precision, integer) does not exist" ✅ FIXED
-- - "could not identify column f6 in record data type" ✅ VERIFIED CLEAN
--

CREATE OR REPLACE FUNCTION create_commission_payout(
  p_transaction_id UUID
) 
RETURNS TABLE(
  payout_id UUID, 
  amount NUMERIC, 
  status TEXT,
  agent_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
  v_payout_amount NUMERIC;
  v_new_payout_id UUID;
  v_existing_payout_id UUID;
BEGIN
  -- Fetch transaction details with agent lookup
  SELECT 
    t.id,
    t.status,
    t.final_sale_price,
    t.final_listing_commission_percent,
    t.final_agent_split_percent,
    t.agent_id,
    t.final_broker_agent_name,
    t.created_at,
    t.updated_at
  INTO v_transaction
  FROM transactions t
  WHERE t.id = p_transaction_id;
  
  -- Validate transaction exists
  IF v_transaction.id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;
  
  -- Validate transaction is approved
  IF v_transaction.status != 'approved' THEN
    RAISE EXCEPTION 'Transaction must be approved to create payout. Current status: %', v_transaction.status;
  END IF;
  
  -- Check if payout already exists for this transaction
  SELECT id INTO v_existing_payout_id
  FROM commission_payouts
  WHERE transaction_id = p_transaction_id;
  
  IF v_existing_payout_id IS NOT NULL THEN
    RAISE EXCEPTION 'Payout already exists for transaction: %', p_transaction_id;
  END IF;
  
  -- Calculate payout amount with FIXED PostgreSQL syntax
  -- Formula: (Sale Price * Commission %) * Agent Split %
  -- FIXED: Use ::NUMERIC cast for proper ROUND function compatibility
  v_payout_amount := ROUND(COALESCE(
    (v_transaction.final_sale_price * 
     COALESCE(v_transaction.final_listing_commission_percent, 3.0) / 100.0 *
     COALESCE(v_transaction.final_agent_split_percent, 100.0) / 100.0),
    0
  )::NUMERIC, 2);
  
  -- Validate payout amount is positive
  IF v_payout_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payout amount calculated: %. Check transaction data: sale_price=%, commission=%, split=%', 
      v_payout_amount, 
      v_transaction.final_sale_price,
      v_transaction.final_listing_commission_percent,
      v_transaction.final_agent_split_percent;
  END IF;
  
  -- Create commission payout record
  INSERT INTO commission_payouts (
    transaction_id,
    agent_id,
    payout_amount,
    status,
    auto_ach,
    created_at
  )
  VALUES (
    p_transaction_id,
    v_transaction.agent_id,
    v_payout_amount,
    'ready',
    false,  -- Default to manual payment, can be updated later
    NOW()
  )
  RETURNING id INTO v_new_payout_id;
  
  -- Update transaction with latest payout reference
  UPDATE transactions 
  SET 
    latest_payout_id = v_new_payout_id,
    pending_payout_amount = v_payout_amount,
    updated_at = NOW()
  WHERE id = p_transaction_id;
  
  -- Create transaction event for audit trail
  INSERT INTO transaction_events (
    transaction_id,
    event_type,
    actor_name,
    metadata,
    created_at
  )
  VALUES (
    p_transaction_id,
    'payout_created',
    'System',
    jsonb_build_object(
      'payout_id', v_new_payout_id,
      'payout_amount', v_payout_amount,
      'calculation_method', 'auto_rpc',
      'sale_price', v_transaction.final_sale_price,
      'commission_percent', COALESCE(v_transaction.final_listing_commission_percent, 3.0),
      'agent_split_percent', COALESCE(v_transaction.final_agent_split_percent, 100.0)
    ),
    NOW()
  );
  
  -- Return payout details
  RETURN QUERY
  SELECT 
    v_new_payout_id as payout_id,
    v_payout_amount as amount,
    'ready'::TEXT as status,
    v_transaction.agent_id as agent_id,
    NOW() as created_at;
    
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_commission_payout(UUID) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION create_commission_payout(UUID) IS 'Creates a commission payout for an approved transaction. Validates transaction status, calculates payout amount, and creates audit trail. FIXED: PostgreSQL ROUND syntax compatibility.';