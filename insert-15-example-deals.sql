-- =====================================================
-- 15 EXAMPLE DEALS WITH COMPLETED PAYMENTS
-- =====================================================
-- 
-- This script creates 15 realistic example transactions with their
-- corresponding commission payouts (1:1 mapping via transaction_id)
-- 
-- Includes:
-- - 15 Example Agents
-- - 15 Transactions (approved status)
-- - 15 Commission Payouts (paid status with various ACH methods)
-- =====================================================

-- Step 1: Ensure we have a brokerage to work with
DO $$
DECLARE
    test_brokerage_id UUID;
BEGIN
    -- Get existing brokerage or create one
    SELECT id INTO test_brokerage_id FROM brokerages LIMIT 1;
    
    IF test_brokerage_id IS NULL THEN
        INSERT INTO brokerages (
            id, 
            brokerage_name, 
            franchise_fee_percent, 
            eo_insurance_fee, 
            transaction_fee,
            ach_provider,
            ach_config
        ) VALUES (
            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'Charney Real Estate',
            6.0,
            150.0,
            450.0,
            'plaid',
            '{"enabled": true, "same_day": true}'::jsonb
        ) ON CONFLICT (id) DO NOTHING
        RETURNING id INTO test_brokerage_id;
    END IF;
    
    RAISE NOTICE 'Using brokerage ID: %', test_brokerage_id;
END $$;

-- Step 2: Insert 15 Example Agents
INSERT INTO agents (
    id,
    full_name,
    email,
    is_active,
    default_split_percent,
    annual_cap_amount,
    brokerage_id,
    team_name,
    created_at
) VALUES 
    -- Top Performers Team
    ('a1111111-1111-1111-1111-111111111111', 'Sarah Martinez', 'sarah.martinez@charney.com', true, 80.0, 25000, (SELECT id FROM brokerages LIMIT 1), 'Top Performers', NOW() - INTERVAL '2 years'),
    ('a2222222-2222-2222-2222-222222222222', 'Michael Chen', 'michael.chen@charney.com', true, 75.0, 22000, (SELECT id FROM brokerages LIMIT 1), 'Top Performers', NOW() - INTERVAL '18 months'),
    ('a3333333-3333-3333-3333-333333333333', 'Jessica Wong', 'jessica.wong@charney.com', true, 70.0, 20000, (SELECT id FROM brokerages LIMIT 1), 'Top Performers', NOW() - INTERVAL '15 months'),
    
    -- Rising Stars Team
    ('a4444444-4444-4444-4444-444444444444', 'David Rodriguez', 'david.rodriguez@charney.com', true, 65.0, 18000, (SELECT id FROM brokerages LIMIT 1), 'Rising Stars', NOW() - INTERVAL '1 year'),
    ('a5555555-5555-5555-5555-555555555555', 'Emily Johnson', 'emily.johnson@charney.com', true, 70.0, 20000, (SELECT id FROM brokerages LIMIT 1), 'Rising Stars', NOW() - INTERVAL '10 months'),
    ('a6666666-6666-6666-6666-666666666666', 'Robert Kim', 'robert.kim@charney.com', true, 68.0, 19000, (SELECT id FROM brokerages LIMIT 1), 'Rising Stars', NOW() - INTERVAL '8 months'),
    
    -- New Agents Team
    ('a7777777-7777-7777-7777-777777777777', 'Amanda Foster', 'amanda.foster@charney.com', true, 60.0, 15000, (SELECT id FROM brokerages LIMIT 1), 'New Agents', NOW() - INTERVAL '6 months'),
    ('a8888888-8888-8888-8888-888888888888', 'James Wilson', 'james.wilson@charney.com', true, 62.0, 16000, (SELECT id FROM brokerages LIMIT 1), 'New Agents', NOW() - INTERVAL '5 months'),
    ('a9999999-9999-9999-9999-999999999999', 'Lisa Thompson', 'lisa.thompson@charney.com', true, 65.0, 17500, (SELECT id FROM brokerages LIMIT 1), 'New Agents', NOW() - INTERVAL '4 months'),
    
    -- Luxury Specialists Team
    ('aaaaaaaa-1111-1111-1111-111111111111', 'Christopher Davis', 'christopher.davis@charney.com', true, 78.0, 30000, (SELECT id FROM brokerages LIMIT 1), 'Luxury Specialists', NOW() - INTERVAL '3 years'),
    ('aaaaaaaa-2222-2222-2222-222222222222', 'Rachel Green', 'rachel.green@charney.com', true, 75.0, 28000, (SELECT id FROM brokerages LIMIT 1), 'Luxury Specialists', NOW() - INTERVAL '2.5 years'),
    
    -- Commercial Team
    ('aaaaaaaa-3333-3333-3333-333333333333', 'Steven Park', 'steven.park@charney.com', true, 72.0, 35000, (SELECT id FROM brokerages LIMIT 1), 'Commercial', NOW() - INTERVAL '4 years'),
    ('aaaaaaaa-4444-4444-4444-444444444444', 'Nicole Brown', 'nicole.brown@charney.com', true, 70.0, 32000, (SELECT id FROM brokerages LIMIT 1), 'Commercial', NOW() - INTERVAL '2 years'),
    
    -- Independent Agents
    ('aaaaaaaa-5555-5555-5555-555555555555', 'Kevin Liu', 'kevin.liu@charney.com', true, 68.0, 21000, (SELECT id FROM brokerages LIMIT 1), NULL, NOW() - INTERVAL '1.5 years'),
    ('aaaaaaaa-6666-6666-6666-666666666666', 'Stephanie Clark', 'stephanie.clark@charney.com', true, 73.0, 24000, (SELECT id FROM brokerages LIMIT 1), NULL, NOW() - INTERVAL '1 year')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Insert 15 Example Transactions
INSERT INTO transactions (
    id,
    agent_id,
    property_address,
    final_broker_agent_name,
    final_buyer_name,
    final_seller_name,
    final_sale_price,
    final_listing_commission_percent,
    final_agent_split_percent,
    final_co_broker_agent_name,
    final_co_brokerage_firm_name,
    status,
    brokerage_id,
    created_at,
    updated_at,
    gci_verified_at
) VALUES 
    -- High-value luxury sales
    ('11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', '456 Oak Avenue, Unit 3B', 'Jessica Wong', 'John & Mary Smith', 'Robert & Patricia Johnson', 1080206.45, 2.5, 70.0, 'Michael Chen', 'Charney Real Estate', 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-1111-1111-1111-111111111111', '789 Mansion Drive', 'Christopher Davis', 'Tech Executive LLC', 'Celebrity Trust Fund', 2450000.00, 2.25, 78.0, NULL, NULL, 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', '123 Penthouse Plaza, PH1', 'Sarah Martinez', 'Investment Group Alpha', 'Downtown Development Corp', 1850000.00, 2.75, 80.0, 'Rachel Green', 'Charney Real Estate', 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    
    -- Standard residential sales
    ('44444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', '567 Maple Street', 'Emily Johnson', 'First Time Buyers Inc', 'Retiring Couple LLC', 725000.00, 3.0, 70.0, NULL, NULL, 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('55555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', '890 Pine Avenue', 'David Rodriguez', 'Young Professional Duo', 'Empty Nesters Trust', 615000.00, 3.25, 65.0, 'Emily Johnson', 'Charney Real Estate', 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
    ('66666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', '234 Cedar Lane', 'Robert Kim', 'Growing Family Co', 'Downsizing Seniors', 540000.00, 3.5, 68.0, NULL, NULL, 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
    
    -- Entry-level and starter homes
    ('77777777-7777-7777-7777-777777777777', 'a7777777-7777-7777-7777-777777777777', '345 Starter Home Blvd', 'Amanda Foster', 'Millennial Couple', 'Investor Group Beta', 485000.00, 3.75, 60.0, 'James Wilson', 'Charney Real Estate', 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
    ('88888888-8888-8888-8888-888888888888', 'a8888888-8888-8888-8888-888888888888', '678 First Time Dr', 'James Wilson', 'New Graduate Buyers', 'Relocating Family', 420000.00, 4.0, 62.0, NULL, NULL, 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
    ('99999999-9999-9999-9999-999999999999', 'a9999999-9999-9999-9999-999999999999', '912 Condo Complex Unit 5A', 'Lisa Thompson', 'Single Professional', 'Estate Sale Executors', 385000.00, 4.25, 65.0, 'Amanda Foster', 'Charney Real Estate', 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
    
    -- Commercial properties
    ('bbbbbbbb-1111-1111-1111-111111111111', 'aaaaaaaa-3333-3333-3333-333333333333', '100 Business Park Plaza', 'Steven Park', 'Retail Chain Expansion', 'Commercial Property Holdings', 3200000.00, 1.5, 72.0, 'Nicole Brown', 'Charney Real Estate', 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '20 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
    ('bbbbbbbb-2222-2222-2222-222222222222', 'aaaaaaaa-4444-4444-4444-444444444444', '250 Office Tower Suite 1200', 'Nicole Brown', 'Tech Startup Unicorn', 'Legacy Real Estate Fund', 1850000.00, 2.0, 70.0, NULL, NULL, 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '18 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
    
    -- Mid-range family homes
    ('bbbbbbbb-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', '456 Family Neighborhood St', 'Michael Chen', 'Expanding Family Unit', 'Corporate Relocation Sale', 780000.00, 2.8, 75.0, 'Sarah Martinez', 'Charney Real Estate', 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '14 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
    ('bbbbbbbb-4444-4444-4444-444444444444', 'aaaaaaaa-5555-5555-5555-555555555555', '789 Suburban Dream Ln', 'Kevin Liu', 'Military Family Transfer', 'Job Change Sellers', 625000.00, 3.1, 68.0, NULL, NULL, 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '11 days', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'),
    
    -- Luxury condos and townhomes
    ('bbbbbbbb-5555-5555-5555-555555555555', 'aaaaaaaa-2222-2222-2222-222222222222', '321 Waterfront Towers Unit 22B', 'Rachel Green', 'Executive Couple', 'Investment Property Liquidation', 1250000.00, 2.4, 75.0, 'Christopher Davis', 'Charney Real Estate', 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '9 days', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),
    ('bbbbbbbb-6666-6666-6666-666666666666', 'aaaaaaaa-6666-6666-6666-666666666666', '654 Historic District Townhouse', 'Stephanie Clark', 'Arts & Culture Enthusiasts', 'Heritage Property Trust', 920000.00, 2.9, 73.0, NULL, NULL, 'approved', (SELECT id FROM brokerages LIMIT 1), NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Insert 15 Corresponding Commission Payouts (1:1 mapping with transactions)
INSERT INTO commission_payouts (
    id,
    transaction_id,
    agent_id,
    payout_amount,
    status,
    auto_ach,
    ach_provider,
    ach_reference,
    scheduled_at,
    paid_at,
    created_at
) VALUES 
    -- Recent ACH payments (paid)
    ('cccccccc-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 17169.40, 'paid', true, 'plaid', 'ACH-JW-20251019-001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '5 days'),
    ('cccccccc-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-1111-1111-1111-111111111111', 38142.75, 'paid', true, 'plaid', 'ACH-CD-20251017-002', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'),
    ('cccccccc-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 35928.50, 'paid', true, 'plaid', 'ACH-SM-20251018-003', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 days'),
    
    -- Manual check payments (paid)
    ('cccccccc-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'a5555555-5555-5555-5555-555555555555', 14796.50, 'paid', false, NULL, 'CHECK-EJ-20251016-004', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
    ('cccccccc-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', 11565.94, 'paid', false, NULL, 'CHECK-DR-20251015-005', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 hours'),
    ('cccccccc-6666-6666-6666-666666666666', '66666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 11016.24, 'paid', true, 'plaid', 'ACH-RK-20251014-006', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 hours'),
    
    -- Wire transfer payments (paid)
    ('cccccccc-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777777', 'a7777777-7777-7777-7777-777777777777', 9792.94, 'paid', false, NULL, 'WIRE-AF-20251013-007', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 hours'),
    ('cccccccc-8888-8888-8888-888888888888', '88888888-8888-8888-8888-888888888888', 'a8888888-8888-8888-8888-888888888888', 8964.48, 'paid', true, 'plaid', 'ACH-JW-20251012-008', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours'),
    ('cccccccc-9999-9999-9999-999999999999', '99999999-9999-9999-9999-999999999999', 'a9999999-9999-9999-9999-999999999999', 9521.81, 'paid', false, NULL, 'CHECK-LT-20251011-009', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 hour'),
    
    -- Large commercial payments (paid)
    ('dddddddd-1111-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111111', 'aaaaaaaa-3333-3333-3333-333333333333', 31008.96, 'paid', true, 'plaid', 'ACH-SP-20251001-010', NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '7 days'),
    ('dddddddd-2222-2222-2222-222222222222', 'bbbbbbbb-2222-2222-2222-222222222222', 'aaaaaaaa-4444-4444-4444-444444444444', 22508.00, 'paid', false, NULL, 'WIRE-NB-20250930-011', NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '6 days'),
    
    -- More recent payments
    ('dddddddd-3333-3333-3333-333333333333', 'bbbbbbbb-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 14951.40, 'paid', true, 'plaid', 'ACH-MC-20251005-012', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '4 days'),
    ('dddddddd-4444-4444-4444-444444444444', 'bbbbbbbb-4444-4444-4444-444444444444', 'aaaaaaaa-5555-5555-5555-555555555555', 12392.66, 'paid', false, NULL, 'CHECK-KL-20251008-013', NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 minutes'),
    
    -- Luxury property payments
    ('dddddddd-5555-5555-5555-555555555555', 'bbbbbbbb-5555-5555-5555-555555555555', 'aaaaaaaa-2222-2222-2222-222222222222', 21810.00, 'paid', true, 'plaid', 'ACH-RG-20251007-014', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '15 minutes'),
    ('dddddddd-6666-6666-6666-666666666666', 'bbbbbbbb-6666-6666-6666-666666666666', 'aaaaaaaa-6666-6666-6666-666666666666', 18061.56, 'paid', true, 'plaid', 'ACH-SC-20251009-015', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- Step 5: Update transactions with their corresponding payout references
UPDATE transactions SET 
    latest_payout_id = (
        SELECT cp.id 
        FROM commission_payouts cp 
        WHERE cp.transaction_id = transactions.id 
        LIMIT 1
    ),
    pending_payout_amount = (
        SELECT cp.payout_amount 
        FROM commission_payouts cp 
        WHERE cp.transaction_id = transactions.id 
        LIMIT 1
    )
WHERE id IN (
    SELECT DISTINCT transaction_id 
    FROM commission_payouts 
    WHERE transaction_id IS NOT NULL
);

-- Step 6: Create transaction events for audit trail
INSERT INTO transaction_events (
    transaction_id,
    event_type,
    actor_name,
    metadata,
    visible_to_agent,
    created_at
)
SELECT 
    cp.transaction_id,
    CASE 
        WHEN cp.auto_ach THEN 'payout_paid_ach'
        ELSE 'payout_paid_manual'
    END,
    'System (Example Data)',
    jsonb_build_object(
        'payout_id', cp.id,
        'payout_amount', cp.payout_amount,
        'payment_method', CASE 
            WHEN cp.auto_ach THEN 'ACH Transfer'
            ELSE COALESCE(
                CASE 
                    WHEN cp.ach_reference LIKE 'WIRE%' THEN 'Wire Transfer'
                    WHEN cp.ach_reference LIKE 'CHECK%' THEN 'Check Payment'
                    ELSE 'Manual Payment'
                END, 
                'Manual Payment'
            )
        END,
        'reference', cp.ach_reference
    ),
    true,
    cp.paid_at
FROM commission_payouts cp
WHERE cp.status = 'paid'
ON CONFLICT DO NOTHING;

-- Step 7: Verification queries
SELECT 
    '=== EXAMPLE DATA VERIFICATION ===' as verification_summary;

SELECT 
    COUNT(*) as total_agents,
    COUNT(CASE WHEN is_active THEN 1 END) as active_agents
FROM agents 
WHERE id::text LIKE 'a%' OR id::text LIKE 'aaaaaaaa%';

SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_transactions
FROM transactions 
WHERE id::text LIKE '1%' OR id::text LIKE '2%' OR id::text LIKE '3%' OR id::text LIKE '4%' OR id::text LIKE '5%' OR id::text LIKE '6%' OR id::text LIKE '7%' OR id::text LIKE '8%' OR id::text LIKE '9%' OR id::text LIKE 'b%';

SELECT 
    COUNT(*) as total_payouts,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_payouts,
    COUNT(CASE WHEN auto_ach THEN 1 END) as ach_payouts,
    ROUND(SUM(payout_amount), 2) as total_payout_amount
FROM commission_payouts 
WHERE id::text LIKE 'c%' OR id::text LIKE 'd%';

SELECT 
    t.id as transaction_id,
    t.final_broker_agent_name as agent_name,
    t.property_address,
    t.final_sale_price,
    cp.id as payout_id,
    cp.payout_amount,
    cp.status as payout_status,
    CASE WHEN cp.auto_ach THEN 'ACH' ELSE 'Manual' END as payment_method
FROM transactions t
JOIN commission_payouts cp ON t.id = cp.transaction_id
WHERE (t.id::text LIKE '1%' OR t.id::text LIKE '2%' OR t.id::text LIKE '3%' OR t.id::text LIKE '4%' OR t.id::text LIKE '5%' OR t.id::text LIKE '6%' OR t.id::text LIKE '7%' OR t.id::text LIKE '8%' OR t.id::text LIKE '9%' OR t.id::text LIKE 'b%')
ORDER BY t.created_at DESC;

-- Final success messages
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully created 15 example deals with completed payments';
    RAISE NOTICE '📊 Transaction IDs: 11111111-1111... through bbbbbbbb-6666...';
    RAISE NOTICE '📊 Payout IDs: cccccccc-1111... through dddddddd-6666...';
    RAISE NOTICE '💰 Payment amounts calculated using realistic commission structures';
    RAISE NOTICE '🏦 Mix of ACH, check, and wire transfer payment methods';
END $$;