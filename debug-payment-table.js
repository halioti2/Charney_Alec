// Debug script to check commission payouts and transaction status
// Run in browser console at localhost:8888

console.log('🔍 Debugging Payment Table Issues...');

async function debugPaymentTable() {
    if (!window.supabase) {
        console.error('❌ Supabase not available');
        return;
    }

    try {
        // Check authentication
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session) {
            console.error('❌ Not authenticated');
            return;
        }
        console.log('✅ Authenticated as:', session.user.email);

        // 1. Check raw commission_payouts table
        console.log('\n1. Checking commission_payouts table...');
        const { data: payouts, error: payoutsError } = await window.supabase
            .from('commission_payouts')
            .select('*')
            .order('created_at', { ascending: false });

        if (payoutsError) {
            console.error('❌ Error fetching payouts:', payoutsError);
        } else {
            console.log(`✅ Found ${payouts?.length || 0} commission payouts`);
            if (payouts && payouts.length > 0) {
                console.log('📋 Sample payout:', payouts[0]);
            }
        }

        // 2. Check approved transactions
        console.log('\n2. Checking approved transactions...');
        const { data: transactions, error: transError } = await window.supabase
            .from('transactions')
            .select('id, status, final_broker_agent_name, final_sale_price, latest_payout_id')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (transError) {
            console.error('❌ Error fetching transactions:', transError);
        } else {
            console.log(`✅ Found ${transactions?.length || 0} approved transactions`);
            if (transactions && transactions.length > 0) {
                console.log('📋 Sample approved transaction:', transactions[0]);
                
                // Check if approved transactions have payouts
                const withPayouts = transactions.filter(t => t.latest_payout_id);
                const withoutPayouts = transactions.filter(t => !t.latest_payout_id);
                
                console.log(`   💰 Approved transactions WITH payouts: ${withPayouts.length}`);
                console.log(`   ⚠️  Approved transactions WITHOUT payouts: ${withoutPayouts.length}`);
                
                if (withoutPayouts.length > 0) {
                    console.log('🔍 Transactions missing payouts:', withoutPayouts.map(t => ({
                        id: t.id,
                        agent: t.final_broker_agent_name,
                        salePrice: t.final_sale_price
                    })));
                }
            }
        }

        // 3. Test RPC function directly
        console.log('\n3. Testing RPC function...');
        if (transactions && transactions.length > 0) {
            const testTransaction = transactions.find(t => !t.latest_payout_id);
            if (testTransaction) {
                console.log(`🧪 Testing RPC with transaction: ${testTransaction.id}`);
                
                const { data: rpcResult, error: rpcError } = await window.supabase
                    .rpc('create_commission_payout', { 
                        p_transaction_id: testTransaction.id 
                    });

                if (rpcError) {
                    console.error('❌ RPC Error:', rpcError.message);
                    console.log('🔍 This might explain why payouts aren\'t being created');
                } else {
                    console.log('✅ RPC Success:', rpcResult);
                }
            } else {
                console.log('ℹ️  All approved transactions already have payouts');
            }
        }

        // 4. Check for recent transaction events
        console.log('\n4. Checking recent transaction events...');
        const { data: events, error: eventsError } = await window.supabase
            .from('transaction_events')
            .select('event_type, actor_name, metadata, created_at')
            .in('event_type', ['transaction_approved', 'payout_created', 'payout_creation_failed'])
            .order('created_at', { ascending: false })
            .limit(10);

        if (eventsError) {
            console.error('❌ Error fetching events:', eventsError);
        } else {
            console.log(`✅ Found ${events?.length || 0} relevant events`);
            events?.forEach(event => {
                console.log(`   📅 ${event.created_at}: ${event.event_type} by ${event.actor_name}`);
                if (event.metadata?.error) {
                    console.log(`      ❌ Error: ${event.metadata.error}`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Debug script error:', error);
    }
}

debugPaymentTable();