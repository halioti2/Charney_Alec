// Test commission payout data and UI fixes
// Run this in browser console to test the fixes

console.log('🧪 Testing Commission Payout Data and UI Fixes');

// Test 1: Verify fetchCommissionPayouts returns data
async function testFetchPayouts() {
  console.log('\n=== Test 1: Fetch Commission Payouts ===');
  
  try {
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase
        .from('commission_payouts')
        .select(`
          id,
          payout_amount,
          status,
          auto_ach,
          scheduled_at,
          paid_at,
          created_at,
          transaction:transactions(
            id,
            property_address,
            final_sale_price
          ),
          agent:agents(
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Fetch error:', error);
        return null;
      }
      
      console.log('✅ Raw payout data:', data);
      console.log(`📊 Found ${data?.length || 0} payouts`);
      return data;
    } else {
      console.log('⚠️ Supabase client not available in window');
      return null;
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
    return null;
  }
}

// Test 2: Verify data transformation
async function testDataTransformation() {
  console.log('\n=== Test 2: Data Transformation ===');
  
  const rawData = await testFetchPayouts();
  if (!rawData) return;
  
  // Apply the same transformation logic as transformPayoutsForUI
  const transformedData = rawData.map(payout => {
    const transformed = {
      id: payout.id,
      broker: payout.agent?.full_name || 'Unknown Agent',
      propertyAddress: payout.transaction?.property_address || 'Unknown Address',
      payout_amount: parseFloat(payout.payout_amount) || 0,
      status: payout.status || 'unknown',
      auto_ach: payout.auto_ach || false,
      scheduled_at: payout.scheduled_at,
      paid_at: payout.paid_at,
      created_at: payout.created_at,
      transaction_id: payout.transaction?.id,
      agent_id: payout.agent?.id,
      sale_price: payout.transaction?.final_sale_price
    };
    
    // Check for issues
    const issues = [];
    if (!transformed.broker || transformed.broker === 'Unknown Agent') {
      issues.push('Missing broker name');
    }
    if (!transformed.propertyAddress || transformed.propertyAddress === 'Unknown Address') {
      issues.push('Missing property address');
    }
    if (isNaN(transformed.payout_amount) || transformed.payout_amount === 0) {
      issues.push(`Invalid payout amount: ${payout.payout_amount}`);
    }
    
    if (issues.length > 0) {
      console.log(`⚠️ Issues with payout ${payout.id}:`, issues);
    } else {
      console.log(`✅ Payout ${payout.id}: $${transformed.payout_amount} - ${transformed.broker} - ${transformed.propertyAddress}`);
    }
    
    return transformed;
  });
  
  console.log('🔄 Transformed data:', transformedData);
  return transformedData;
}

// Test 3: Check for NaN values specifically
async function testNaNValues() {
  console.log('\n=== Test 3: NaN Value Detection ===');
  
  const transformedData = await testDataTransformation();
  if (!transformedData) return;
  
  const nanPayouts = transformedData.filter(payout => 
    isNaN(payout.payout_amount) || payout.payout_amount === null || payout.payout_amount === undefined
  );
  
  if (nanPayouts.length > 0) {
    console.error('❌ Found payouts with NaN amounts:', nanPayouts);
  } else {
    console.log('✅ No NaN payout amounts found');
  }
  
  const missingBrokers = transformedData.filter(payout => 
    !payout.broker || payout.broker === 'Unknown Agent'
  );
  
  if (missingBrokers.length > 0) {
    console.warn('⚠️ Found payouts with missing broker names:', missingBrokers);
  } else {
    console.log('✅ All payouts have broker names');
  }
}

// Test 4: Simulate PayoutQueue component data processing
async function testPayoutQueueData() {
  console.log('\n=== Test 4: PayoutQueue Component Simulation ===');
  
  const transformedData = await testDataTransformation();
  if (!transformedData) return;
  
  // Filter for ready payouts (what PayoutQueue would display)
  const readyPayouts = transformedData.filter(payout => payout.status === 'ready');
  
  console.log(`💰 Ready payouts for queue: ${readyPayouts.length}`);
  
  readyPayouts.forEach((payout, index) => {
    console.log(`${index + 1}. ${payout.broker} - ${payout.propertyAddress} - $${payout.payout_amount.toLocaleString()}`);
  });
  
  return readyPayouts;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive payout data tests...');
  
  await testFetchPayouts();
  await testDataTransformation();  
  await testNaNValues();
  await testPayoutQueueData();
  
  console.log('\n🏁 Tests completed! Check above for any issues.');
}

// Make functions available globally for manual testing
if (typeof window !== 'undefined') {
  window.testCommissionPayouts = {
    runAllTests,
    testFetchPayouts,
    testDataTransformation,
    testNaNValues,
    testPayoutQueueData
  };
  
  console.log('🔧 Test functions added to window.testCommissionPayouts');
  console.log('📋 Run window.testCommissionPayouts.runAllTests() to test everything');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  runAllTests();
}