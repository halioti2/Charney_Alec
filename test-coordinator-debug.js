// Simple browser console test to check database state
// Run this in browser console: window.testCoordinatorData()

window.testCoordinatorData = async function() {
  console.log('=== COORDINATOR DATA DEBUG TEST ===');
  
  if (!window.supabase) {
    console.error('❌ Supabase not available on window');
    return;
  }
  
  try {
    // Test 1: Check if transactions table exists and count
    console.log('1️⃣ Testing transactions table...');
    const { count, error: countError } = await window.supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error accessing transactions table:', countError);
      return;
    }
    
    console.log('✅ Transactions table accessible');
    console.log('📊 Total transactions in database:', count);
    
    if (count === 0) {
      console.warn('⚠️ No transactions found in database - this explains empty coordinator view');
      console.log('💡 You may need to:');
      console.log('   - Import some test data');
      console.log('   - Check if transactions are in a different table');
      console.log('   - Verify database connection');
      return;
    }
    
    // Test 2: Fetch some sample transactions
    console.log('2️⃣ Fetching sample transactions...');
    const { data: sampleTransactions, error: fetchError } = await window.supabase
      .from('transactions')
      .select('*')
      .limit(3);
    
    if (fetchError) {
      console.error('❌ Error fetching transactions:', fetchError);
      return;
    }
    
    console.log('✅ Sample transactions:', sampleTransactions);
    
    // Test 3: Test the same query as DashboardContext
    console.log('3️⃣ Testing DashboardContext query...');
    const { data: fullTransactions, error: fullError } = await window.supabase
      .from('transactions')
      .select(`
        *,
        commission_evidences (
          id,
          extraction_data,
          confidence,
          requires_review,
          source_document_type,
          created_at
        )
      `)
      .order('created_at', { ascending: false });
    
    if (fullError) {
      console.error('❌ Error with full query:', fullError);
      return;
    }
    
    console.log('✅ Full query successful');
    console.log('📋 Transactions with evidence:', fullTransactions);
    console.log('🔢 Count:', fullTransactions?.length || 0);
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

// Auto-run the test
if (typeof window !== 'undefined') {
  console.log('🔧 Coordinator data test loaded. Run: window.testCoordinatorData()');
}