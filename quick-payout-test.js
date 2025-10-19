// QUICK PAYOUT TEST - Run in browser console
// This tests the most likely failure points

console.log('🚀 QUICK PAYOUT PIPELINE TEST');

async function quickTest() {
    const supabase = window.supabase;
    if (!supabase) {
        console.error('❌ Supabase not available');
        return;
    }

    // 1. Check auth
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Auth:', session ? '✅ Logged in' : '❌ Not logged in');

    // 2. Count transactions by status
    const { data: statusCounts } = await supabase
        .from('transactions')
        .select('status')
        .then(result => {
            if (result.data) {
                const counts = result.data.reduce((acc, t) => {
                    acc[t.status] = (acc[t.status] || 0) + 1;
                    return acc;
                }, {});
                return { data: counts };
            }
            return result;
        });

    console.log('Transaction Status Counts:', statusCounts);

    // 3. Check approved transactions without payouts
    const { data: needPayouts } = await supabase
        .from('transactions')
        .select('id, final_broker_agent_name, final_sale_price, latest_payout_id')
        .eq('status', 'approved')
        .is('latest_payout_id', null);

    console.log(`Approved transactions needing payouts: ${needPayouts?.length || 0}`);

    // 4. Test RPC function if we have candidates
    if (needPayouts && needPayouts.length > 0) {
        const testTxn = needPayouts[0];
        console.log(`Testing RPC with: ${testTxn.id} (${testTxn.final_broker_agent_name})`);
        
        const { data: rpcResult, error: rpcError } = await supabase
            .rpc('create_commission_payout', { p_transaction_id: testTxn.id });

        if (rpcError) {
            console.error('❌ RPC Failed:', rpcError.message);
        } else {
            console.log('✅ RPC Success:', rpcResult);
            
            // Check if payout was actually created
            const { data: newPayout } = await supabase
                .from('commission_payouts')
                .select('*')
                .eq('transaction_id', testTxn.id)
                .single();
                
            if (newPayout) {
                console.log('✅ Payout verified in database:', newPayout);
            } else {
                console.log('❌ Payout not found in database after RPC success');
            }
        }
    }

    // 5. Show recent transaction events
    const { data: events } = await supabase
        .from('transaction_events')
        .select('event_type, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(5);

    console.log('Recent events:', events?.map(e => `${e.event_type} at ${e.created_at}`));
}

quickTest();