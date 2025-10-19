// Debug payment history data structure
// Run this in browser console to see what data is available

window.debugPaymentHistory = function() {
  console.log('🔍 Debugging payment history data...');
  
  // Check if DashboardContext is available
  if (typeof window.React === 'undefined') {
    console.log('⚠️ React not available in window, try running this from the React DevTools console');
    return;
  }
  
  // Try to access the context data through the global state (if available)
  console.log('💾 Checking localStorage for debug data...');
  
  // Manual data check via Supabase
  if (window.supabase) {
    console.log('📊 Checking commission_payouts data directly...');
    
    window.supabase
      .from('commission_payouts')
      .select('*')
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Error fetching payouts:', error);
          return;
        }
        
        console.log('📋 All payouts:', data);
        
        const statusBreakdown = data.reduce((acc, payout) => {
          acc[payout.status] = (acc[payout.status] || 0) + 1;
          return acc;
        }, {});
        
        console.log('📊 Status breakdown:', statusBreakdown);
        
        const scheduledPayouts = data.filter(p => p.status === 'scheduled');
        console.log('📅 Scheduled payouts:', scheduledPayouts);
        
        if (scheduledPayouts.length === 0) {
          console.log('⚠️ No scheduled payouts found - this explains why the filter shows nothing');
          console.log('🔧 Try scheduling a payout first to test the filter');
        } else {
          console.log(`✅ Found ${scheduledPayouts.length} scheduled payout(s)`);
        }
      });
  } else {
    console.log('❌ window.supabase not available');
  }
  
  return 'Check console output above for results';
};

console.log('🔍 Payment history debugger loaded. Run debugPaymentHistory() to check data.');