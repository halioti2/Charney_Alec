-- =====================================================
-- COMPREHENSIVE JESSICA WONG PAYOUT FIX
-- =====================================================
-- 
-- Issue: PayoutQueue still showing $20,723.28 despite previous fix
-- This script will find ALL Jessica Wong payouts and ensure correct amount
-- =====================================================

-- Step 1: Find ALL Jessica Wong payouts (there might be multiple)
SELECT 
  cp.id as payout_id,
  cp.payout_amount,
  cp.status,
  cp.created_at,
  t.id as transaction_id,
  t.final_broker_agent_name,
  t.final_sale_price,
  t.final_listing_commission_percent,
  t.status as transaction_status,
  t.pending_payout_amount
FROM commission_payouts cp
JOIN transactions t ON cp.transaction_id = t.id
WHERE t.final_broker_agent_name = 'Jessica Wong'
ORDER BY cp.created_at DESC;

-- Step 2: Update ALL Jessica Wong payouts to correct amount
UPDATE commission_payouts 
SET payout_amount = 17169.40
FROM transactions t
WHERE commission_payouts.transaction_id = t.id
  AND t.final_broker_agent_name = 'Jessica Wong'
  AND commission_payouts.payout_amount != 17169.40;

-- Step 3: Update ALL Jessica Wong transactions pending amounts
UPDATE transactions 
SET 
  pending_payout_amount = 17169.40,
  updated_at = NOW()
WHERE final_broker_agent_name = 'Jessica Wong'
  AND status = 'approved'
  AND pending_payout_amount != 17169.40;

-- Step 4: Find the specific payout that PayoutQueue is using (by ID from debug)
-- The debug shows payout ID: '3c4d3ae0-7c1c-42b6-9b9c-d82666110c95'
SELECT 
  cp.id,
  cp.payout_amount,
  cp.status,
  t.final_broker_agent_name
FROM commission_payouts cp
JOIN transactions t ON cp.transaction_id = t.id
WHERE cp.id = '3c4d3ae0-7c1c-42b6-9b9c-d82666110c95';

-- Step 5: Update that specific payout if it exists and is wrong
UPDATE commission_payouts 
SET payout_amount = 17169.40
WHERE id = '3c4d3ae0-7c1c-42b6-9b9c-d82666110c95'
  AND payout_amount != 17169.40;

-- Step 6: Add audit trail for all corrections
INSERT INTO transaction_events (
  transaction_id,
  event_type,
  actor_name,
  metadata,
  visible_to_agent,
  created_at
)
SELECT 
  t.id,
  'payout_amount_comprehensive_fix',
  'System (Comprehensive Fix)',
  jsonb_build_object(
    'old_amount', cp.payout_amount,
    'new_amount', 17169.40,
    'reason', 'Comprehensive fix - ensure all Jessica Wong payouts use v3.2 calculation',
    'calculation_method', 'v3.2_simple_agent_split',
    'payout_id', cp.id,
    'correction_date', NOW()
  ),
  true,
  NOW()
FROM commission_payouts cp
JOIN transactions t ON cp.transaction_id = t.id
WHERE t.final_broker_agent_name = 'Jessica Wong'
  AND cp.payout_amount != 17169.40;

-- Step 7: Verify ALL Jessica Wong payouts are now correct
SELECT 
  cp.id as payout_id,
  cp.payout_amount as corrected_amount,
  cp.status,
  t.final_broker_agent_name,
  t.pending_payout_amount,
  cp.created_at
FROM commission_payouts cp
JOIN transactions t ON cp.transaction_id = t.id
WHERE t.final_broker_agent_name = 'Jessica Wong'
ORDER BY cp.created_at DESC;

-- Expected result: ALL payout_amount values should be 17169.40

-- Step 8: Double-check the specific problematic payout
SELECT 
  'SPECIFIC PAYOUT CHECK' as check_type,
  cp.id,
  cp.payout_amount,
  CASE 
    WHEN cp.payout_amount = 17169.40 THEN '✅ CORRECT'
    ELSE '❌ STILL WRONG - CHECK SUPABASE CACHE'
  END as status
FROM commission_payouts cp
WHERE cp.id = '3c4d3ae0-7c1c-42b6-9b9c-d82666110c95';