-- =====================================================
-- FIX JESSICA WONG PAYOUT AMOUNT
-- =====================================================
-- 
-- Issue: Jessica Wong's payout shows $20,723.28 (from old v3.1 calculation)
-- Fix: Update to correct $17,169.40 (from v3.2 simple agent split calculation)
--
-- CALCULATION VERIFICATION:
-- - Sale Price: $1,080,206.45
-- - GCI (2.5%): $27,005.16
-- - Franchise Fee (6%): -$1,620.31  
-- - Adjusted GCI: $25,384.85
-- - Agent Share (70%): $17,769.40
-- - E&O Fee: -$150.00
-- - Transaction Fee: -$450.00
-- - Net Payout: $17,169.40
-- =====================================================

-- Step 1: Find Jessica Wong's payout record
SELECT 
  cp.id as payout_id,
  cp.payout_amount as current_amount,
  cp.status,
  t.final_broker_agent_name,
  t.final_sale_price,
  t.final_listing_commission_percent
FROM commission_payouts cp
JOIN transactions t ON cp.transaction_id = t.id
WHERE t.final_broker_agent_name = 'Jessica Wong'
ORDER BY cp.created_at DESC
LIMIT 1;

-- Step 2: Update the payout amount to correct calculation
UPDATE commission_payouts 
SET 
  payout_amount = 17169.40
WHERE id IN (
  SELECT cp.id 
  FROM commission_payouts cp
  JOIN transactions t ON cp.transaction_id = t.id
  WHERE t.final_broker_agent_name = 'Jessica Wong'
  ORDER BY cp.created_at DESC
  LIMIT 1
);

-- Step 3: Update the transaction's pending_payout_amount
UPDATE transactions 
SET 
  pending_payout_amount = 17169.40,
  updated_at = NOW()
WHERE final_broker_agent_name = 'Jessica Wong'
  AND status = 'approved';

-- Step 4: Add audit trail for the correction
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
  'payout_amount_corrected',
  'System (Manual Correction)',
  jsonb_build_object(
    'old_amount', 20723.28,
    'new_amount', 17169.40,
    'reason', 'Updated to v3.2 calculation - simple agent split without commission cap',
    'calculation_method', 'v3.2_simple_agent_split',
    'correction_date', NOW()
  ),
  true,
  NOW()
FROM transactions t
WHERE t.final_broker_agent_name = 'Jessica Wong'
  AND t.status = 'approved'
LIMIT 1;

-- Step 5: Verify the update
SELECT 
  cp.id as payout_id,
  cp.payout_amount as corrected_amount,
  cp.status,
  t.final_broker_agent_name,
  t.pending_payout_amount
FROM commission_payouts cp
JOIN transactions t ON cp.transaction_id = t.id
WHERE t.final_broker_agent_name = 'Jessica Wong'
ORDER BY cp.created_at DESC
LIMIT 1;

-- Expected result: payout_amount should now be 17169.40