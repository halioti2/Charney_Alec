// Debug the authentication and data loading flow
// Run this in the browser console at http://localhost:61891

console.log('🔍 Debugging Auto-Refresh Issue...');

// Check if supabase is available
if (window.supabase) {
    console.log('✅ Supabase client available');
    
    // Check current session
    window.supabase.auth.getSession().then(({data: {session}}) => {
        if (session) {
            console.log('✅ User authenticated:', session.user.email);
            console.log('   Session expires:', new Date(session.expires_at * 1000));
            
            // Test direct data fetch
            console.log('🔄 Testing direct transaction fetch...');
            window.supabase
                .from('transactions')
                .select('id, status, property_address')
                .limit(3)
                .then(({data, error}) => {
                    if (error) {
                        console.error('❌ Direct fetch failed:', error.message);
                    } else {
                        console.log(`✅ Direct fetch success: ${data?.length || 0} transactions`);
                        if (data && data.length > 0) {
                            console.log('   Sample:', data[0]);
                        }
                    }
                });
        } else {
            console.log('❌ No active session');
        }
    });
} else {
    console.log('❌ Supabase client not available');
}

// Check if React context is working
setTimeout(() => {
    console.log('🔄 Checking React context state...');
    
    // Look for transactions in the DOM
    const transactionRows = document.querySelectorAll('[data-testid="transaction-row"], .transaction-row, tbody tr');
    console.log(`📊 Transaction rows in DOM: ${transactionRows.length}`);
    
    // Check for "No transactions" or empty state
    const emptyState = document.querySelector('.text-gray-500, .empty-state');
    if (emptyState && emptyState.textContent.includes('No transactions')) {
        console.log('⚠️  Empty state detected - likely data not loading');
    }
    
    // Check for loading states
    const loadingElements = document.querySelectorAll('.animate-spin, .loading, [aria-label*="loading"]');
    console.log(`⏳ Loading elements: ${loadingElements.length}`);
    
}, 2000);

console.log('📋 Check the console above for results, and navigate to Coordinator tab to test');
console.log('   Expected: User authenticated, data fetches working, transactions display');