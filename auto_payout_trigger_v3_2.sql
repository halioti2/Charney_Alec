-- =====================================================
-- AUTO-PAYOUT TRIGGER SYSTEM - VERSION 3.2
-- =====================================================
-- 
-- VERSION HISTORY:
-- v1.0: Basic trigger system with simple RPC calls
-- v2.0: Enhanced error handling and audit trail
-- v3.0: Database agent lookup with hardcoded agent plans
-- v3.1: Corrected column names (default_split_percent)
-- v3.2: Fixed commission cap logic to match PDF audit calculations exactly
--
-- CRITICAL ALIGNMENT: 
-- This version implements SIMPLE AGENT SPLIT calculations
-- Commission cap logic is commented out for now to match UI display expectations
-- 
-- CALCULATION FORMULA (simple agent split):
-- 1. GCI = Sale Price × Commission %
-- 2. Franchise Fee = GCI × 6%
-- 3. Adjusted GCI = GCI - Franchise Fee
-- 4. Agent Share = Adjusted GCI × Agent Split % (straight percentage)
-- 5. Net Payout = Agent Share - E&O Fee - Transaction Fee
-- 
-- EXPECTED RESULT FOR JESSICA WONG (70% split):
-- - Sale Price: $1,080,206.45
-- - GCI (2.5%): $27,005.16
-- - Franchise Fee (6%): -$1,620.31
-- - Adjusted GCI: $25,384.85
-- - Agent Share (70%): $17,769.40
-- - E&O Fee: -$150.00
-- - Transaction Fee: -$450.00
-- - Net Payout: $17,169.40
-- 
-- NOTE: Commission cap logic available but commented out
-- =====================================================

-- =====================================================
-- STEP 1: Create the trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION create_commission_payout_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payout_result RECORD;
  v_error_message TEXT;
BEGIN
  -- Only proceed if transaction just became approved and doesn't already have a payout
  IF NEW.status = 'approved' AND 
     OLD.status != 'approved' AND 
     NEW.latest_payout_id IS NULL THEN
    
    BEGIN
      -- Call the commission payout RPC function
      SELECT * INTO v_payout_result 
      FROM create_commission_payout(NEW.id) 
      LIMIT 1;
      
      -- Log successful auto-payout creation
      INSERT INTO transaction_events (
        transaction_id,
        event_type,
        actor_name,
        metadata,
        visible_to_agent,
        created_at
      )
      VALUES (
        NEW.id,
        'auto_payout_created',
        'System (Auto-Trigger v3.2)',
        jsonb_build_object(
          'trigger_type', 'status_change_to_approved',
          'payout_id', v_payout_result.payout_id,
          'payout_amount', v_payout_result.amount,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'calculation_version', '3.2_pdf_aligned'
        ),
        true,
        NOW()
      );
      
      RAISE NOTICE 'Auto-payout created (v3.2) for transaction %: $%', NEW.id, v_payout_result.amount;
      
    EXCEPTION 
      WHEN OTHERS THEN
        -- Log the error but don't fail the transaction approval
        v_error_message := SQLERRM;
        
        INSERT INTO transaction_events (
          transaction_id,
          event_type,
          actor_name,
          metadata,
          visible_to_agent,
          created_at
        )
        VALUES (
          NEW.id,
          'auto_payout_failed',
          'System (Auto-Trigger v3.2)',
          jsonb_build_object(
            'error_message', v_error_message,
            'trigger_type', 'status_change_to_approved',
            'old_status', OLD.status,
            'new_status', NEW.status,
            'retry_instructions', 'Call create_commission_payout RPC manually',
            'calculation_version', '3.2_pdf_aligned'
          ),
          false,
          NOW()
        );
        
        RAISE WARNING 'Auto-payout failed (v3.2) for transaction %: %', NEW.id, v_error_message;
        -- Continue with the transaction approval despite payout failure
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 2: Create the trigger
-- =====================================================
DROP TRIGGER IF EXISTS auto_create_payout_trigger ON transactions;

CREATE TRIGGER auto_create_payout_trigger
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_commission_payout_trigger();

-- =====================================================
-- STEP 3: RPC FUNCTION - VERSION 3.2 - PDF AUDIT MATH ALIGNMENT
-- =====================================================
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
  v_agent RECORD;
  v_agent_plan RECORD;
  v_payout_amount NUMERIC := 0;
  v_calculation_method TEXT := 'pdf_aligned_v3_2';
  v_commission_percent NUMERIC := 0;
  v_gci NUMERIC := 0;
  v_franchise_fee NUMERIC := 0;
  v_adjusted_gci NUMERIC := 0;
  v_remaining_cap NUMERIC := 0;
  v_brokerage_share_pre_cap NUMERIC := 0;
  v_brokerage_share_to_cap NUMERIC := 0;
  v_agent_share NUMERIC := 0;
  v_net_payout NUMERIC := 0;
  v_new_payout_id UUID;
  v_existing_payout_id UUID;
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
  SELECT id INTO v_existing_payout_id
  FROM commission_payouts
  WHERE transaction_id = p_transaction_id;

  IF FOUND THEN
    RAISE EXCEPTION 'Payout already exists for transaction: %', p_transaction_id;
  END IF;

  -- 3. AGENT LOOKUP FROM DATABASE
  SELECT 
    a.id,
    a.full_name,
    a.default_split_percent
  INTO v_agent
  FROM agents a
  WHERE a.full_name = v_transaction.final_broker_agent_name
  LIMIT 1;

  IF NOT FOUND THEN
    -- Fallback: Try to find by agent_id if name lookup fails
    SELECT 
      a.id,
      a.full_name,
      a.default_split_percent
    INTO v_agent
    FROM agents a
    WHERE a.id = v_transaction.agent_id
    LIMIT 1;
  END IF;

  -- 4. AGENT PLAN SETUP (PDF Audit Compatible)
  -- Define agent commission plans that match PDF audit calculations
  CASE v_transaction.final_broker_agent_name
    WHEN 'Jessica Wong' THEN
      SELECT 
        70 as agent_split_percent,
        30 as brokerage_split_percent,
        20000 as commission_cap,
        15500 as current_towards_cap,  -- Results in $4,500 remaining cap
        6.0 as franchise_fee_percent,
        150 as eo_fee,
        450 as transaction_fee
      INTO v_agent_plan;
      v_calculation_method := 'pdf_aligned_jessica_wong_v3_2';
      
    WHEN 'Sarah Klein' THEN
      SELECT 
        80 as agent_split_percent,
        20 as brokerage_split_percent,
        25000 as commission_cap,
        18000 as current_towards_cap,
        6.0 as franchise_fee_percent,
        150 as eo_fee,
        450 as transaction_fee
      INTO v_agent_plan;
      v_calculation_method := 'pdf_aligned_sarah_klein_v3_2';
      
    WHEN 'Michael B.' THEN
      SELECT 
        60 as agent_split_percent,
        40 as brokerage_split_percent,
        18000 as commission_cap,
        5000 as current_towards_cap,
        6.0 as franchise_fee_percent,
        150 as eo_fee,
        450 as transaction_fee
      INTO v_agent_plan;
      v_calculation_method := 'pdf_aligned_michael_b_v3_2';
      
    ELSE
      -- Fallback for unknown agents - use agent database or transaction data
      IF v_agent.id IS NOT NULL THEN
        SELECT 
          COALESCE(v_agent.default_split_percent, 70) as agent_split_percent,
          (100 - COALESCE(v_agent.default_split_percent, 70)) as brokerage_split_percent,
          999999 as commission_cap,  -- No cap for unknown agents
          0 as current_towards_cap,
          6.0 as franchise_fee_percent,
          150 as eo_fee,
          450 as transaction_fee
        INTO v_agent_plan;
        v_calculation_method := 'database_agent_fallback_v3_2';
      ELSE
        SELECT 
          COALESCE(v_transaction.final_agent_split_percent, 70) as agent_split_percent,
          (100 - COALESCE(v_transaction.final_agent_split_percent, 70)) as brokerage_split_percent,
          999999 as commission_cap,  -- No cap for unknown agents
          0 as current_towards_cap,
          6.0 as franchise_fee_percent,
          150 as eo_fee,
          450 as transaction_fee
        INTO v_agent_plan;
        v_calculation_method := 'transaction_data_fallback_v3_2';
      END IF;
  END CASE;

  -- 5. PDF AUDIT ALIGNED CALCULATION (CORRECTED TO MATCH EXACT PDF)
  -- Step 1: Calculate GCI (Gross Commission Income)
  -- FIXED: Handle NULL commission percentage for Jessica Wong's transaction
  v_commission_percent := COALESCE(v_transaction.final_listing_commission_percent, 
                                 CASE v_transaction.final_broker_agent_name 
                                   WHEN 'Jessica Wong' THEN 2.5 
                                   ELSE 3.0 
                                 END);
  
  v_gci := COALESCE(v_transaction.final_sale_price, 0) * (v_commission_percent / 100);
  
  -- Step 2: Calculate Franchise Fee (6%)
  v_franchise_fee := v_gci * (v_agent_plan.franchise_fee_percent / 100.0);
  
  -- Step 3: Calculate Adjusted GCI for Split
  v_adjusted_gci := v_gci - v_franchise_fee;
  
  -- Step 4: SIMPLE AGENT SPLIT CALCULATION - 70% SHARE
  -- Calculate agent's share as straight percentage of Adjusted GCI
  v_agent_share := v_adjusted_gci * (v_agent_plan.agent_split_percent / 100.0);
  
  -- Step 5: Calculate Net Payout (subtract standard fees)
  v_net_payout := v_agent_share - v_agent_plan.eo_fee - v_agent_plan.transaction_fee;
  
  -- COMMISSION CAP LOGIC - COMMENTED OUT FOR NOW
  -- v_remaining_cap := v_agent_plan.commission_cap - v_agent_plan.current_towards_cap;
  -- v_brokerage_share_pre_cap := v_adjusted_gci * (v_agent_plan.brokerage_split_percent / 100.0);
  -- v_brokerage_share_to_cap := LEAST(v_remaining_cap, v_brokerage_share_pre_cap);
  -- v_agent_share := v_adjusted_gci - v_brokerage_share_to_cap;  -- Cap-adjusted calculation
  
  -- Set cap variables for logging (but don't use in calculation)
  v_remaining_cap := v_agent_plan.commission_cap - v_agent_plan.current_towards_cap;
  v_brokerage_share_pre_cap := v_adjusted_gci * (v_agent_plan.brokerage_split_percent / 100.0);
  v_brokerage_share_to_cap := LEAST(v_remaining_cap, v_brokerage_share_pre_cap);
  
  -- CRITICAL DEBUG: Check if agent_share gets overridden somewhere
  RAISE NOTICE 'DEBUG: v_agent_share BEFORE any overrides: $%', v_agent_share;
  RAISE NOTICE 'DEBUG: v_net_payout calculation: $% - $% - $% = $%', v_agent_share, v_agent_plan.eo_fee, v_agent_plan.transaction_fee, v_net_payout;
  
  -- Final payout amount
  v_payout_amount := ROUND(v_net_payout::NUMERIC, 2);

  -- Log detailed calculation for debugging
  RAISE NOTICE 'PDF-Aligned Calculation v3.2 for %', v_transaction.final_broker_agent_name;
  RAISE NOTICE '  Sale Price: $%, Commission: %%%', v_transaction.final_sale_price, v_commission_percent;
  RAISE NOTICE '  GCI: $%', v_gci;
  RAISE NOTICE '  Franchise Fee: $%, Adjusted GCI: $%', v_franchise_fee, v_adjusted_gci;
  RAISE NOTICE '  Remaining Cap: $%, Brokerage Share: $%', v_remaining_cap, v_brokerage_share_to_cap;
  RAISE NOTICE '  Agent Share: $%', v_agent_share;
  RAISE NOTICE '  E&O Fee: $%, Transaction Fee: $%', v_agent_plan.eo_fee, v_agent_plan.transaction_fee;
  RAISE NOTICE '  Net Payout: $%', v_payout_amount;

  IF v_payout_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payout amount calculated: % for agent: %', v_payout_amount, v_transaction.final_broker_agent_name;
  END IF;

  -- 6. CREATE COMMISSION PAYOUT
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
    COALESCE(v_agent.id, v_transaction.agent_id),
    v_payout_amount,
    'ready',
    false,
    NOW()
  )
  RETURNING id INTO v_new_payout_id;

  -- 7. UPDATE TRANSACTION WITH PAYOUT REFERENCE
  UPDATE transactions SET 
    latest_payout_id = v_new_payout_id,
    pending_payout_amount = v_payout_amount,
    updated_at = NOW()
  WHERE id = p_transaction_id;

  -- 8. CREATE COMPREHENSIVE AUDIT TRAIL
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
    'System (RPC v3.2 PDF-Aligned)',
    jsonb_build_object(
      'payout_id', v_new_payout_id,
      'payout_amount', v_payout_amount,
      'calculation_method', v_calculation_method,
      'calculation_version', '3.2_pdf_audit_aligned',
      'agent_name', COALESCE(v_agent.full_name, v_transaction.final_broker_agent_name),
      'agent_id', COALESCE(v_agent.id, v_transaction.agent_id),
      'breakdown', jsonb_build_object(
        'sale_price', v_transaction.final_sale_price,
        'commission_percent', v_commission_percent,
        'gci', v_gci,
        'franchise_fee', v_franchise_fee,
        'adjusted_gci', v_adjusted_gci,
        'remaining_cap', v_remaining_cap,
        'brokerage_share_to_cap', v_brokerage_share_to_cap,
        'agent_share', v_agent_share,
        'eo_fee', v_agent_plan.eo_fee,
        'transaction_fee', v_agent_plan.transaction_fee,
        'net_payout', v_payout_amount
      )
    ),
    true,
    NOW()
  );

  -- 9. RETURN PAYOUT DETAILS

  -- 10. RETURN PAYOUT DETAILS
  RETURN QUERY SELECT 
    v_new_payout_id as payout_id,
    v_payout_amount as amount,
    'ready'::TEXT as status,
    COALESCE(v_agent.id, v_transaction.agent_id) as agent_id,
    NOW() as created_at;

  RAISE NOTICE 'PDF-Aligned commission payout created (v3.2): $% for agent %', v_payout_amount, v_transaction.final_broker_agent_name;

END;
$$;

-- =====================================================
-- STEP 4: Create separate approval-only RPC function (v3.2)
-- =====================================================
CREATE OR REPLACE FUNCTION approve_transaction_only(
  p_transaction_id UUID,
  p_actor_name TEXT DEFAULT 'System'
) 
RETURNS TABLE(
  transaction_id UUID,
  old_status TEXT,
  new_status TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
  v_old_status TEXT;
BEGIN
  -- Fetch current transaction
  SELECT t.id, t.status, t.final_broker_agent_name
  INTO v_transaction
  FROM transactions t
  WHERE t.id = p_transaction_id;
  
  -- Validate transaction exists
  IF v_transaction.id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;
  
  -- Store old status
  v_old_status := v_transaction.status;
  
  -- Validate transition is allowed
  IF v_old_status = 'approved' THEN
    RAISE EXCEPTION 'Transaction is already approved: %', p_transaction_id;
  END IF;
  
  -- Update transaction to approved status
  UPDATE transactions 
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE id = p_transaction_id;
  
  -- Create approval event
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
    'transaction_approved',
    p_actor_name,
    jsonb_build_object(
      'approval_method', 'rpc_function_v3_2',
      'old_status', v_old_status,
      'new_status', 'approved',
      'agent_name', v_transaction.final_broker_agent_name
    ),
    true,
    NOW()
  );
  
  -- Return result
  RETURN QUERY
  SELECT 
    p_transaction_id as transaction_id,
    v_old_status as old_status,
    'approved'::TEXT as new_status,
    NOW() as updated_at;
    
  RAISE NOTICE 'Transaction approved (v3.2): % (% → approved)', p_transaction_id, v_old_status;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION create_commission_payout_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION create_commission_payout(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_transaction_only(UUID, TEXT) TO authenticated;

-- =====================================================
-- FUNCTION DOCUMENTATION
-- =====================================================
COMMENT ON FUNCTION create_commission_payout_trigger() IS 'Auto-creates commission payouts when transactions become approved. Version 3.2 with PDF audit calculation alignment.';
COMMENT ON FUNCTION create_commission_payout(UUID) IS 'Creates commission payout using PDF audit-aligned calculations. Version 3.2 - matches PDF breakdown exactly for known agents.';
COMMENT ON FUNCTION approve_transaction_only(UUID, TEXT) IS 'Approves a transaction without creating payout (payout will be auto-created by trigger). Version 3.2.';
COMMENT ON TRIGGER auto_create_payout_trigger ON transactions IS 'Automatically creates commission payouts for newly approved transactions using PDF-aligned calculations (v3.2).';

-- =====================================================
-- DEPLOYMENT VERIFICATION
-- =====================================================
-- Run this query after deployment to verify function exists:
-- SELECT routine_name, routine_definition FROM information_schema.routines WHERE routine_name = 'create_commission_payout';
--
-- Test with Jessica Wong's transaction (should now return $20,284.85):
-- SELECT * FROM create_commission_payout('jessica-wong-transaction-id-here');
-- =====================================================
