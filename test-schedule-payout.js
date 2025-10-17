// Simple test to trigger schedule-payout function with debugging
// Run this in the browser console after loading the app

window.testSchedulePayout = async function() {
  console.log('🧪 Testing schedule-payout function...');
  
  try {
    // Get authentication session
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      throw new Error('No authentication session');
    }
    console.log('✅ Got auth session');
    
    // Create today's date in local timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayLocal = `${year}-${month}-${day}`;
    
    console.log('📅 Sending date:', todayLocal);
    console.log('📅 Current local time:', now.toString());
    console.log('📅 Current UTC time:', now.toISOString());
    
    // Make the request
    const response = await fetch('/.netlify/functions/schedule-payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        payout_ids: ['test-payout-id'], // Fake ID for testing
        scheduled_date: todayLocal,
        payment_method: 'manual',
        auto_ach: false
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Function call successful:', result);
    } else {
      console.log('❌ Function call failed:', result);
    }
    
    return { success: response.ok, result };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

console.log('Schedule payout test loaded. Run testSchedulePayout() to test the function.');