// Quick test for schedule-payout with proper authentication
// Load this in the browser and run testWithAuth()

window.testWithAuth = async function() {
  console.log('🧪 Testing schedule-payout with authentication...');
  
  try {
    // Wait for auth to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get the authentication session
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
      console.log('⚠️  No session found, waiting longer...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      const { data: { session: retrySession } } = await window.supabase.auth.getSession();
      if (!retrySession) {
        throw new Error('Still no authentication session after retry');
      }
      session = retrySession;
    }
    
    console.log('✅ Got authentication session for:', session.user.email);
    
    // Create a proper local date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;
    
    console.log('📅 Using date:', localDate);
    console.log('📅 Local time:', today.toString());
    console.log('📅 UTC time:', today.toISOString());
    
    // Test the function
    const response = await fetch('/.netlify/functions/schedule-payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        payout_ids: ['test-payout-id'],
        scheduled_date: localDate,
        payment_method: 'manual',
        auto_ach: false
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Function call successful!');
    } else {
      console.log('❌ Function call failed:', result.error);
    }
    
    return { success: response.ok, status: response.status, result };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
};

// Auto-run in 3 seconds to allow auth to complete
setTimeout(() => {
  if (typeof window !== 'undefined' && window.supabase) {
    console.log('🚀 Auto-running auth test...');
    window.testWithAuth();
  }
}, 3000);

console.log('Auth test loaded. Will auto-run in 3 seconds or run testWithAuth() manually.');