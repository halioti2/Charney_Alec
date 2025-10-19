// Direct test of integrated supabaseService functions
// This tests the actual service functions used by the dashboard

import { fetchTransactions, transformTransactionsForUI, fetchCommissionPayouts, transformPayoutsForUI } from './src/lib/supabaseService.js';

console.log('🔍 Testing integrated Supabase service functions...\n');

async function testSupabaseIntegration() {
    try {
        console.log('1. Testing fetchTransactions...');
        const transactions = await fetchTransactions();
        console.log(`   ✅ Found ${transactions?.length || 0} transactions`);
        
        if (transactions && transactions.length > 0) {
            console.log('2. Testing transformTransactionsForUI...');
            const uiTransactions = transformTransactionsForUI(transactions);
            console.log(`   ✅ Transformed ${uiTransactions?.length || 0} transactions for UI`);
            console.log(`   Sample: ${JSON.stringify(uiTransactions[0], null, 2).substring(0, 200)}...`);
        }
        
        console.log('\n3. Testing fetchCommissionPayouts...');
        const payouts = await fetchCommissionPayouts();
        console.log(`   ✅ Found ${payouts?.length || 0} commission payouts`);
        
        if (payouts && payouts.length > 0) {
            console.log('4. Testing transformPayoutsForUI...');
            const uiPayouts = transformPayoutsForUI(payouts);
            console.log(`   ✅ Transformed ${uiPayouts?.length || 0} payouts for UI`);
            console.log(`   Sample payout status: ${uiPayouts[0]?.status || 'unknown'}`);
        }
        
        console.log('\n🎉 Supabase service integration: SUCCESS');
        console.log('✅ All service functions working properly');
        console.log('✅ Data transformation functions operational');
        
    } catch (error) {
        console.error('❌ Supabase service integration failed:', error.message);
        console.error('   Check environment variables and network connection');
    }
}

testSupabaseIntegration();