// Quick authentication test for payment functions
// Run this in the browser console to verify auth is working

window.testAuthentication = async function() {
  console.log('🔍 Testing authentication setup...');
  
  try {
    // Test 1: Check if supabase is available
    if (!window.supabase) {
      throw new Error('❌ window.supabase is not available');
    }
    console.log('✅ window.supabase is available');
    
    // Test 2: Check current session
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    if (sessionError) {
      throw new Error(`❌ Session error: ${sessionError.message}`);
    }
    
    if (!session) {
      console.log('⚠️  No active session - attempting auto-login...');
      
      // Test 3: Try to sign in with demo credentials
      const email = import.meta.env?.VITE_DEMO_EMAIL;
      const password = import.meta.env?.VITE_DEMO_PASSWORD;
      
      if (!email || !password) {
        throw new Error('❌ Demo credentials not available');
      }
      
      const { data: loginData, error: loginError } = await window.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (loginError) {
        throw new Error(`❌ Login failed: ${loginError.message}`);
      }
      
      console.log('✅ Auto-login successful');
      session = loginData.session;
    } else {
      console.log('✅ Active session found');
    }
    
    // Test 4: Verify token extraction
    if (!session?.access_token) {
      throw new Error('❌ No access token in session');
    }
    console.log('✅ Access token available');
    
    // Test 5: Test a simple authenticated request
    const { data: testData, error: testError } = await window.supabase
      .from('commission_payouts')
      .select('id')
      .limit(1);
      
    if (testError) {
      throw new Error(`❌ Test query failed: ${testError.message}`);
    }
    
    console.log('✅ Authenticated database query successful');
    
    console.log('🎯 Authentication is working correctly!');
    console.log('Session user:', session.user.email);
    console.log('Token expires:', new Date(session.expires_at * 1000).toLocaleString());
    
    return {
      success: true,
      session: session,
      message: 'Authentication setup is working correctly'
    };
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Auto-run the test
console.log('Authentication test loaded. Run testAuthentication() to test manually, or it will auto-run in 2 seconds...');
setTimeout(() => {
  if (typeof window !== 'undefined') {
    window.testAuthentication();
  }
}, 2000);