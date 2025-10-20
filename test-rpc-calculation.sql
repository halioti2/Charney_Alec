-- =====================================================
-- TEST RPC FUNCTION CALCULATION FOR JESSICA WONG
-- =====================================================
-- This will test the v3.2 RPC function calculation step by step
-- to identify where the $20,723.28 vs $17,169.40 discrepancy comes from

-- Test the calculation manually with Jessica Wong's data
DO $$
DECLARE
  v_sale_price NUMERIC := 1080206.45;
  v_commission_percent NUMERIC := 2.5;
  v_agent_split_percent NUMERIC := 70;
  v_franchise_fee_percent NUMERIC := 6.0;
  v_eo_fee NUMERIC := 150;
  v_transaction_fee NUMERIC := 450;
  
  v_gci NUMERIC;
  v_franchise_fee NUMERIC;
  v_adjusted_gci NUMERIC;
  v_agent_share NUMERIC;
  v_net_payout NUMERIC;
  v_final_amount NUMERIC;
BEGIN
  -- Step 1: Calculate GCI
  v_gci := v_sale_price * (v_commission_percent / 100);
  RAISE NOTICE 'Step 1 - GCI: $%', v_gci;
  
  -- Step 2: Calculate Franchise Fee
  v_franchise_fee := v_gci * (v_franchise_fee_percent / 100.0);
  RAISE NOTICE 'Step 2 - Franchise Fee: $%', v_franchise_fee;
  
  -- Step 3: Calculate Adjusted GCI
  v_adjusted_gci := v_gci - v_franchise_fee;
  RAISE NOTICE 'Step 3 - Adjusted GCI: $%', v_adjusted_gci;
  
  -- Step 4: Calculate Agent Share (70%)
  v_agent_share := v_adjusted_gci * (v_agent_split_percent / 100.0);
  RAISE NOTICE 'Step 4 - Agent Share (70%%): $%', v_agent_share;
  
  -- Step 5: Calculate Net Payout (subtract fees)
  v_net_payout := v_agent_share - v_eo_fee - v_transaction_fee;
  RAISE NOTICE 'Step 5 - Net Payout (after $% E&O + $% transaction fees): $%', v_eo_fee, v_transaction_fee, v_net_payout;
  
  -- Step 6: Round final amount
  v_final_amount := ROUND(v_net_payout::NUMERIC, 2);
  RAISE NOTICE 'Step 6 - Final Rounded Amount: $%', v_final_amount;
  
  -- Summary
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'EXPECTED: $17,169.40';
  RAISE NOTICE 'ACTUAL:   $%', v_final_amount;
  
  IF v_final_amount = 17169.40 THEN
    RAISE NOTICE 'STATUS: ✅ CALCULATION IS CORRECT';
  ELSE
    RAISE NOTICE 'STATUS: ❌ CALCULATION IS WRONG - DIFFERENCE: $%', ABS(v_final_amount - 17169.40);
  END IF;
  
END $$;

-- Test calling the actual RPC function (if no existing payout)
-- Uncomment this line to test with a real transaction ID:
-- SELECT * FROM create_commission_payout('your-jessica-wong-transaction-id-here');