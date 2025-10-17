// Test the complete workflow: schedule payout + verify history filter
// Run this in browser console to test end-to-end

window.testPaymentHistoryFilter = async function() {
  console.log('🧪 Testing payment history filter with scheduled payouts...');
  
  try {
    // Step 1: Check authentication
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      throw new Error('No authentication session');
    }
    console.log('✅ Authentication ready');
    
    // Step 2: Check current payout data
    const { data: allPayouts, error: fetchError } = await window.supabase
      .from('commission_payouts')
      .select('id, status, payout_amount')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      throw new Error(`Failed to fetch payouts: ${fetchError.message}`);
    }
    
    const statusCounts = allPayouts.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Current payout status breakdown:', statusCounts);
    
    // Step 3: If no scheduled payouts, create one
    let scheduledCount = statusCounts.scheduled || 0;
    
    if (scheduledCount === 0) {
      console.log('⚡ No scheduled payouts found, creating one...');
      
      const readyPayouts = allPayouts.filter(p => p.status === 'ready');
      if (readyPayouts.length === 0) {
        console.log('⚠️ No ready payouts to schedule. Need to create test data first.');
        return { success: false, message: 'No payouts available to schedule' };
      }
      
      const testPayout = readyPayouts[0];
      console.log('📋 Scheduling payout:', testPayout.id);
      
      // Create local date
      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Schedule the payout
      const scheduleResponse = await fetch('/.netlify/functions/schedule-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payout_ids: [testPayout.id],
          scheduled_date: localDate,
          payment_method: 'manual',
          auto_ach: false
        })
      });
      
      const scheduleResult = await scheduleResponse.json();
      
      if (!scheduleResponse.ok) {
        throw new Error(`Failed to schedule payout: ${scheduleResult.error}`);
      }
      
      console.log('✅ Payout scheduled successfully:', scheduleResult);
      scheduledCount = 1;
    }
    
    // Step 4: Wait a moment for any UI updates
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 5: Check the updated data
    const { data: updatedPayouts } = await window.supabase
      .from('commission_payouts')
      .select('id, status, payout_amount, scheduled_at')
      .eq('status', 'scheduled');
    
    console.log('📅 Scheduled payouts after test:', updatedPayouts);
    
    // Step 6: Verify the filter should work now
    console.log(`🎯 Payment history filter should now show ${updatedPayouts.length} scheduled payout(s)`);
    
    if (updatedPayouts.length > 0) {
      console.log('✅ SUCCESS: There are scheduled payouts available for the filter');
      console.log('🔄 Try refreshing the Payment History view and selecting "Scheduled" filter');
      
      // Provide instructions
      console.log('📋 Instructions:');
      console.log('1. Go to Payments tab');
      console.log('2. Scroll down to Payment History section'); 
      console.log('3. Change dropdown from "All" to "Scheduled"');
      console.log('4. You should see the scheduled payouts');
    }
    
    return {
      success: true,
      message: `Found ${updatedPayouts.length} scheduled payout(s)`,
      scheduledPayouts: updatedPayouts,
      totalPayouts: allPayouts.length,
      statusBreakdown: statusCounts
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

console.log('🔍 Payment history filter test loaded. Run testPaymentHistoryFilter() to verify the workflow.');