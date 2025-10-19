// COMPREHENSIVE PAYMENT PIPELINE DEBUG SCRIPT
// Run this in your browser console at localhost:8888
// This will test every step of the payout creation process

console.log('🔍 COMPREHENSIVE PAYMENT PIPELINE DEBUG');
console.log('=====================================');

async function debugPaymentPipeline() {
    if (!window.supabase) {
        console.error('❌ Supabase not available');
        return;
    }

    try {
        // Step 1: Check Authentication
        console.log('\n📋 STEP 1: Authentication Check');
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session) {
            console.error('❌ Not authenticated - this could be the issue!');
            return;
        }
        console.log('✅ Authenticated as:', session.user.email);

        // Step 2: Check for Approved Transactions
        console.log('\n📋 STEP 2: Approved Transactions Check');
        const { data: approvedTxns, error: txnError } = await window.supabase
            .from('transactions')
            .select('id, status, final_broker_agent_name, final_sale_price, final_listing_commission_percent, final_agent_split_percent, latest_payout_id, agent_id')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (txnError) {
            console.error('❌ Error fetching approved transactions:', txnError);
            return;
        }

        console.log(`✅ Found ${approvedTxns?.length || 0} approved transactions`);
        
        if (!approvedTxns || approvedTxns.length === 0) {
            console.log('⚠️  NO APPROVED TRANSACTIONS FOUND - This is likely the issue!');
            console.log('   Check if transactions are actually getting approved');
            return;
        }

        // Find transactions without payouts
        const withoutPayouts = approvedTxns.filter(t => !t.latest_payout_id);
        console.log(`💰 Transactions with payouts: ${approvedTxns.length - withoutPayouts.length}`);
        console.log(`⚠️  Transactions WITHOUT payouts: ${withoutPayouts.length}`);

        if (withoutPayouts.length === 0) {
            console.log('ℹ️  All approved transactions already have payouts');
        } else {
            console.log('🔍 Transactions missing payouts:', withoutPayouts.map(t => ({
                id: t.id,
                agent: t.final_broker_agent_name,
                salePrice: t.final_sale_price,
                agentId: t.agent_id
            })));
        }

        // Step 3: Test RPC Function Directly
        console.log('\n📋 STEP 3: RPC Function Test');
        if (withoutPayouts.length > 0) {
            const testTxn = withoutPayouts[0];
            console.log(`🧪 Testing RPC with transaction: ${testTxn.id}`);
            console.log(`   Agent: ${testTxn.final_broker_agent_name}`);
            console.log(`   Sale Price: $${testTxn.final_sale_price}`);

            const { data: rpcResult, error: rpcError } = await window.supabase
                .rpc('create_commission_payout', { 
                    p_transaction_id: testTxn.id 
                });

            if (rpcError) {
                console.error('❌ RPC FUNCTION FAILED:', rpcError.message);
                console.log('🔍 This is likely the root cause of the issue');
                console.log('   Common causes:');
                console.log('   - RPC function has syntax errors');
                console.log('   - Missing data in transaction record');
                console.log('   - Agent ID issues');
                console.log('   - Permission problems');
            } else {
                console.log('✅ RPC SUCCESS:', rpcResult);
                console.log('🎉 RPC function works! Checking why auto-creation isn\'t happening...');
            }
        }

        // Step 4: Check Existing Payouts
        console.log('\n📋 STEP 4: Existing Payouts Check');
        const { data: allPayouts, error: payoutError } = await window.supabase
            .from('commission_payouts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (payoutError) {
            console.error('❌ Error fetching payouts:', payoutError);
        } else {
            console.log(`✅ Found ${allPayouts?.length || 0} total payouts in database`);
            if (allPayouts && allPayouts.length > 0) {
                console.log('📋 Recent payouts:', allPayouts.map(p => ({
                    id: p.id,
                    amount: p.payout_amount,
                    status: p.status,
                    created: p.created_at
                })));
            }
        }

        // Step 5: Check Transaction Events (Audit Trail)
        console.log('\n📋 STEP 5: Transaction Events Audit Trail');
        const { data: events, error: eventsError } = await window.supabase
            .from('transaction_events')
            .select('event_type, actor_name, metadata, created_at, transaction_id')
            .in('event_type', ['transaction_approved', 'payout_created', 'payout_creation_failed'])
            .order('created_at', { ascending: false })
            .limit(20);

        if (eventsError) {
            console.error('❌ Error fetching events:', eventsError);
        } else {
            console.log(`✅ Found ${events?.length || 0} relevant events`);
            events?.forEach(event => {
                const timestamp = new Date(event.created_at).toLocaleString();
                console.log(`   📅 ${timestamp}: ${event.event_type} by ${event.actor_name}`);
                if (event.metadata?.error) {
                    console.log(`      ❌ Error: ${event.metadata.error}`);
                }
                if (event.metadata?.payout_amount) {
                    console.log(`      💰 Amount: $${event.metadata.payout_amount}`);
                }
            });
        }

        // Step 6: Check if Netlify Functions are Being Called
        console.log('\n📋 STEP 6: Netlify Functions Check');
        console.log('⚠️  Manual test required:');
        console.log('   1. Go to Coordinator tab');
        console.log('   2. Click "Process" on a transaction');
        console.log('   3. Check browser Network tab for approve-transaction calls');
        console.log('   4. Look for any 4xx/5xx errors in Network tab');

        // Step 7: Agent ID Validation
        console.log('\n📋 STEP 7: Agent ID Validation');
        const { data: agents, error: agentError } = await window.supabase
            .from('agents')
            .select('id, full_name')
            .limit(10);

        if (agentError) {
            console.error('❌ Error fetching agents:', agentError);
        } else {
            console.log(`✅ Found ${agents?.length || 0} agents in database`);
            
            // Check if approved transactions have valid agent IDs
            if (approvedTxns && approvedTxns.length > 0) {
                const agentIds = new Set(agents?.map(a => a.id) || []);
                const txnsWithInvalidAgents = approvedTxns.filter(t => t.agent_id && !agentIds.has(t.agent_id));
                
                if (txnsWithInvalidAgents.length > 0) {
                    console.log('❌ Transactions with invalid agent IDs:', txnsWithInvalidAgents.map(t => ({
                        id: t.id,
                        agent_id: t.agent_id,
                        agent_name: t.final_broker_agent_name
                    })));
                } else {
                    console.log('✅ All approved transactions have valid agent IDs');
                }
            }
        }

        // Summary
        console.log('\n🎯 SUMMARY & NEXT STEPS');
        console.log('========================');
        
        if (withoutPayouts && withoutPayouts.length > 0) {
            console.log('🔍 PRIMARY ISSUE: Approved transactions exist but have no payouts');
            console.log('   NEXT STEPS:');
            console.log('   1. Test RPC function manually (see Step 3 results above)');
            console.log('   2. Check Netlify function logs for approve-transaction errors');
            console.log('   3. Verify auto-approval flow is calling RPC function');
            console.log('   4. Check for missing agent_id or other data issues');
        } else if (approvedTxns && approvedTxns.length === 0) {
            console.log('🔍 PRIMARY ISSUE: No approved transactions found');
            console.log('   NEXT STEPS:');
            console.log('   1. Check transaction approval process');
            console.log('   2. Verify transactions are reaching "approved" status');
            console.log('   3. Test manual approval in Coordinator tab');
        } else {
            console.log('✅ No obvious issues found - payouts may be working correctly');
        }

    } catch (error) {
        console.error('❌ Debug script error:', error);
    }
}

debugPaymentPipeline();