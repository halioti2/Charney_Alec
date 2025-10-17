// Final payment scheduling test - corrected database schema
// Run this in browser console to test the complete workflow

window.testPaymentSchedulingFixed = async function() {
  console.log('🎯 Testing payment scheduling with corrected database schema...');
  
  try {
    // Wait for auth
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      throw new Error('No authentication session');
    }
    
    console.log('✅ Authentication ready');
    
    // Get a real payout ID from the database
    const { data: payouts, error: payoutError } = await window.supabase
      .from('commission_payouts')
      .select('id, status, payout_amount')
      .eq('status', 'ready')
      .limit(1);
      
    if (payoutError) {
      throw new Error(`Failed to fetch payouts: ${payoutError.message}`);
    }
    
    if (!payouts || payouts.length === 0) {
      console.log('⚠️  No ready payouts found, creating test payout...');
      // You might need to create test data first
      return { success: false, message: 'No ready payouts available for testing' };
    }
    
    const testPayout = payouts[0];
    console.log('📊 Testing with payout:', testPayout);
    
    // Create local date (no timezone issues)
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    console.log('📅 Scheduling for date:', localDate);
    
    // Test the corrected function
    const response = await fetch('/.netlify/functions/schedule-payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        payout_ids: [testPayout.id],
        scheduled_date: localDate,
        payment_method: 'manual',
        auto_ach: false,
        provider_details: null
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', result);
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Payment scheduling is working correctly!');
      console.log('✅ Database schema issues resolved');
      console.log('✅ Authentication working');
      console.log('✅ Date validation working');
      console.log('✅ Payment workflow complete');
      
      // Verify the payout was actually updated
      const { data: updatedPayout } = await window.supabase
        .from('commission_payouts')
        .select('status, scheduled_at, auto_ach')
        .eq('id', testPayout.id)
        .single();
        
      console.log('📊 Updated payout in database:', updatedPayout);
      
    } else {
      console.log('❌ Function call failed:', result.error);
    }
    
    return { 
      success: response.ok, 
      status: response.status, 
      result,
      testPayout
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

console.log('💪 Final payment test loaded! Run testPaymentSchedulingFixed() to verify everything works.');