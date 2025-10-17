// Emergency Payment History Debug Script
// Run this in browser console to diagnose dropdown issues

window.debugDropdownIssue = function() {
  console.log('🚨 Emergency Payment History Debug...');
  
  try {
    // Check if there are any JavaScript errors
    console.log('1. Checking for React component state...');
    
    // Check the actual data in the database
    if (window.supabase) {
      console.log('2. Checking database for paid payouts...');
      
      window.supabase
        .from('commission_payouts')
        .select('id, status, payout_amount, paid_at, scheduled_at')
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ Database error:', error);
            return;
          }
          
          console.log('📊 All payouts in database:', data);
          
          const statusCounts = data.reduce((acc, p) => {
            acc[p.status] = (acc[p.status] || 0) + 1;
            return acc;
          }, {});
          
          console.log('📊 Status breakdown:', statusCounts);
          
          if (statusCounts.paid === 0) {
            console.log('⚠️ NO PAID PAYOUTS FOUND!');
            console.log('This is why the "Paid" filter shows nothing.');
            console.log('🔧 Solutions:');
            console.log('1. Click the "Reset" button to go back to "All Status"');
            console.log('2. Or manually change a payout to "paid" status');
            
            // Offer to create a test paid payout
            const readyPayouts = data.filter(p => p.status === 'ready');
            if (readyPayouts.length > 0) {
              console.log('🧪 Would you like to mark a payout as paid for testing?');
              console.log('Run: markPayoutAsPaid("' + readyPayouts[0].id + '")');
              
              window.markPayoutAsPaid = async function(payoutId) {
                const { error } = await window.supabase
                  .from('commission_payouts')
                  .update({ 
                    status: 'paid', 
                    paid_at: new Date().toISOString() 
                  })
                  .eq('id', payoutId);
                
                if (error) {
                  console.error('❌ Failed to update payout:', error);
                } else {
                  console.log('✅ Payout marked as paid! Refresh the page to see it in the filter.');
                }
              };
            }
          } else {
            console.log(`✅ Found ${statusCounts.paid} paid payout(s)`);
            console.log('The dropdown should work. Try refreshing the page.');
          }
        });
    }
    
    // Check if dropdowns are responsive
    console.log('3. Checking dropdown elements...');
    const statusDropdown = document.querySelector('select[value]');
    const allSelects = document.querySelectorAll('select');
    
    console.log('Found select elements:', allSelects.length);
    allSelects.forEach((select, index) => {
      console.log(`Select ${index + 1}:`, {
        value: select.value,
        disabled: select.disabled,
        options: Array.from(select.options).map(o => o.value)
      });
    });
    
    // Check for any React errors in console
    console.log('4. Check browser console for any React/JavaScript errors above this message');
    
    return {
      selectElements: allSelects.length,
      recommendation: statusCounts?.paid === 0 ? 'No paid payouts exist - use Reset button' : 'Check for JavaScript errors'
    };
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
    console.log('🔧 Manual fix: Try refreshing the page');
    return { error: error.message };
  }
};

// Auto-run the debug
setTimeout(() => {
  if (typeof window !== 'undefined') {
    window.debugDropdownIssue();
  }
}, 1000);

console.log('🚨 Emergency dropdown debug loaded. The analysis will run automatically, or call debugDropdownIssue() manually.');