-- Enhanced Commission Payout RPC Function with Proper Net Calculation
-- Version 2.0 - Includes deductions, franchise fees, and commission caps
-- Paste this into your Supabase SQL editor to replace the old function

-- Drop the existing function first since we're changing the return signature
DROP FUNCTION IF EXISTS create_commission_payout(UUID);

CREATE OR REPLACE FUNCTION create_commission_payout(
  p_transaction_id UUID
) 
RETURNS TABLE(
  payout_id UUID, 
  amount NUMERIC, 
  status TEXT,
  agent_id UUID,
  created_at TIMESTAMPTZ,
  calculation_method TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
  v_agent_plan RECORD;
  v_payout_amount NUMERIC := 0;
  v_calculation_method TEXT := 'fallback_simple';
  v_gci NUMERIC := 0;
  v_franchise_fee NUMERIC := 0;
  v_adjusted_gci NUMERIC := 0;
  v_remaining_cap NUMERIC := 0;
  v_brokerage_share_pre_cap NUMERIC := 0;
  v_brokerage_share_to_cap NUMERIC := 0;
  v_agent_share NUMERIC := 0;
  v_payout_record RECORD;
  v_existing_payout UUID;
BEGIN
  -- 1. TRANSACTION VALIDATION
  SELECT 
    t.id, t.final_sale_price, t.final_listing_commission_percent,
    t.final_agent_split_percent, t.final_broker_agent_name, 
    t.agent_id, t.status
  INTO v_transaction
  FROM transactions t
  WHERE t.id = p_transaction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;

  IF v_transaction.status != 'approved' THEN
    RAISE EXCEPTION 'Transaction must be approved to create payout. Current status: %', v_transaction.status;
  END IF;

  -- 2. DUPLICATE PAYOUT CHECK
  SELECT id INTO v_existing_payout
  FROM commission_payouts
  WHERE transaction_id = p_transaction_id;

  IF FOUND THEN
    RAISE EXCEPTION 'Payout already exists for transaction: %', p_transaction_id;
  END IF;

  -- 3. ENHANCED PAYOUT CALCULATION
  -- Define agent plans with commission caps and deductions
  CASE v_transaction.final_broker_agent_name
    WHEN 'Jessica Wong' THEN
      v_agent_plan := ROW(70, 30, 20000, 15500, 6, 150, 450)::RECORD;
      v_calculation_method := 'enhanced_with_deductions';
    WHEN 'Sarah Klein' THEN
      v_agent_plan := ROW(80, 20, 25000, 18000, 6, 150, 450)::RECORD;
      v_calculation_method := 'enhanced_with_deductions';
    WHEN 'Michael B.' THEN
      v_agent_plan := ROW(60, 40, 18000, 5000, 6, 150, 450)::RECORD;
      v_calculation_method := 'enhanced_with_deductions';
    WHEN 'David Chen' THEN
      v_agent_plan := ROW(90, 10, 30000, 29000, 6, 150, 450)::RECORD;
      v_calculation_method := 'enhanced_with_deductions';
    WHEN 'Emily White' THEN
      v_agent_plan := ROW(75, 25, 22000, 10000, 6, 150, 450)::RECORD;
      v_calculation_method := 'enhanced_with_deductions';
    WHEN 'James Riley' THEN
      v_agent_plan := ROW(70, 30, 20000, 19500, 6, 150, 450)::RECORD;
      v_calculation_method := 'enhanced_with_deductions';
    WHEN 'Maria Garcia' THEN
      v_agent_plan := ROW(65, 35, 19000, 12000, 6, 150, 450)::RECORD;
      v_calculation_method := 'enhanced_with_deductions';
    ELSE
      v_agent_plan := NULL;
      v_calculation_method := 'fallback_simple';
  END CASE;

  -- Calculate payout based on agent plan
  IF v_agent_plan IS NOT NULL THEN
    -- Enhanced calculation with deductions
    -- Agent plan structure: (agent_split, brokerage_split, commission_cap, current_towards_cap, franchise_fee_pct, eo_fee, transaction_fee)
    
    v_gci := COALESCE(v_transaction.final_sale_price, 0) * (COALESCE(v_transaction.final_listing_commission_percent, 3.0) / 100);
    v_franchise_fee := v_gci * ((v_agent_plan).f6 / 100); -- franchise_fee_pct is field 6
    v_adjusted_gci := v_gci - 0 - v_franchise_fee; -- referral_fee = 0

    v_remaining_cap := (v_agent_plan).f3 - (v_agent_plan).f4; -- commission_cap - current_towards_cap
    v_brokerage_share_pre_cap := v_adjusted_gci * ((v_agent_plan).f2 / 100); -- brokerage_split
    v_brokerage_share_to_cap := LEAST(v_remaining_cap, v_brokerage_share_pre_cap);
    v_agent_share := v_adjusted_gci - v_brokerage_share_to_cap;

    v_payout_amount := v_agent_share - (v_agent_plan).f7 - (v_agent_plan).f8; -- eo_fee - transaction_fee
    
    -- Log calculation details
    RAISE NOTICE 'Enhanced calculation for %: GCI=%, Franchise Fee=%, Adjusted GCI=%, Agent Share=%, Final Payout=%', 
      v_transaction.final_broker_agent_name, v_gci, v_franchise_fee, v_adjusted_gci, v_agent_share, v_payout_amount;
  ELSE
    -- Fallback calculation for unknown agents
    v_payout_amount := COALESCE(v_transaction.final_sale_price, 0) * 
                       (COALESCE(v_transaction.final_listing_commission_percent, 3.0) / 100) * 
                       (COALESCE(v_transaction.final_agent_split_percent, 70) / 100);
    
    RAISE NOTICE 'Fallback calculation for %: Payout=%', 
      v_transaction.final_broker_agent_name, v_payout_amount;
  END IF;

  -- Round to 2 decimal places
  v_payout_amount := ROUND(v_payout_amount, 2);

  IF v_payout_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payout amount calculated: %', v_payout_amount;
  END IF;

  -- 4. CREATE COMMISSION PAYOUT
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
    false,
    NOW()
  )
  RETURNING id, payout_amount, status, agent_id, created_at
  INTO v_payout_record;

  -- 5. UPDATE TRANSACTION WITH PAYOUT REFERENCE
  UPDATE transactions SET 
    latest_payout_id = v_payout_record.id,
    pending_payout_amount = v_payout_amount,
    updated_at = NOW()
  WHERE id = p_transaction_id;

  -- 6. CREATE AUDIT TRAIL
  INSERT INTO transaction_events (
    transaction_id,
    event_type,
    actor_name,
    metadata,
    visible_to_agent,
    created_at
  )
  VALUES (
    p_transaction_id,
    'payout_created',
    'System (Enhanced RPC)',
    jsonb_build_object(
      'payout_id', v_payout_record.id,
      'payout_amount', v_payout_amount,
      'calculation_method', v_calculation_method,
      'agent_name', v_transaction.final_broker_agent_name,
      'gci', v_gci,
      'franchise_fee', v_franchise_fee,
      'adjusted_gci', v_adjusted_gci,
      'agent_share', v_agent_share,
      'rpc_version', '2.0_enhanced'
    ),
    true,
    NOW()
  );

  -- 7. RETURN PAYOUT DETAILS
  RETURN QUERY SELECT 
    v_payout_record.id as payout_id,
    v_payout_record.payout_amount as amount,
    v_payout_record.status,
    v_payout_record.agent_id,
    v_payout_record.created_at,
    v_calculation_method as calculation_method;

  RAISE NOTICE 'Enhanced commission payout created: % for $%', v_payout_record.id, v_payout_amount;

END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_commission_payout(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION create_commission_payout(UUID) IS 'Enhanced commission payout creation with proper net calculations including deductions, franchise fees, and commission caps. Version 2.0';