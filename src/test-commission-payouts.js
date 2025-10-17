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
            final_sale_price,
            final_broker_agent_name
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
      
      // Check data structure
      if (data && data.length > 0) {
        const sample = data[0];
        console.log('📋 Sample payout structure:', {
          id: sample.id,
          payout_amount: sample.payout_amount,
          transaction: sample.transaction,
          agent: sample.agent
        });
      }
      
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

// Test 2: Verify data transformation using our actual function
async function testDataTransformation() {
  console.log('\n=== Test 2: Data Transformation ===');
  
  const rawData = await testFetchPayouts();
  if (!rawData) return;
  
  // Import the transformation function if available
  let transformedData;
  
  if (typeof window !== 'undefined' && window.transformPayoutsForUI) {
    // Use the actual transformation function from the app
    transformedData = window.transformPayoutsForUI(rawData);
  } else {
    // Fallback: Apply the same transformation logic manually
    transformedData = rawData.map(payout => {
      const transaction = payout.transaction;
      const agent = payout.agent;
      
      return {
        id: payout.id,
        broker: agent?.full_name || transaction?.final_broker_agent_name || 'Unknown Agent',
        propertyAddress: transaction?.property_address || 'Unknown Address',
        payout_amount: parseFloat(payout.payout_amount) || 0,
        status: payout.status || 'unknown',
        auto_ach: payout.auto_ach || false,
        scheduled_at: payout.scheduled_at,
        paid_at: payout.paid_at,
        created_at: payout.created_at,
        transaction_id: payout.transaction?.id,
        agent_id: payout.agent?.id,
        sale_price: payout.transaction?.final_sale_price,
        _rawPayout: payout,
        _rawTransaction: transaction,
        _rawAgent: agent
      };
    });
  }
  
  console.log('🔄 Transformed data:', transformedData);
  
  // Check each transformed payout
  transformedData.forEach((payout, index) => {
    const issues = [];
    
    if (!payout.broker || payout.broker === 'Unknown Agent') {
      issues.push('Missing broker name');
    }
    if (!payout.propertyAddress || payout.propertyAddress === 'Unknown Address') {
      issues.push('Missing property address');
    }
    if (isNaN(payout.payout_amount) || payout.payout_amount === 0) {
      issues.push(`Invalid payout amount: ${payout.payout_amount}`);
    }
    
    if (issues.length > 0) {
      console.log(`⚠️ Issues with payout ${index + 1} (${payout.id}):`, issues);
      console.log('  Raw data:', payout._rawPayout);
    } else {
      console.log(`✅ Payout ${index + 1}: $${payout.payout_amount.toLocaleString()} - ${payout.broker} - ${payout.propertyAddress}`);
    }
  });
  
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
  
  if (readyPayouts.length === 0) {
    console.log('⚠️ No payouts with "ready" status found');
    console.log('Available statuses:', [...new Set(transformedData.map(p => p.status))]);
  } else {
    readyPayouts.forEach((payout, index) => {
      console.log(`${index + 1}. ${payout.broker} - ${payout.propertyAddress} - $${payout.payout_amount.toLocaleString()}`);
    });
  }
  
  return readyPayouts;
}

// Test 5: Check what the PayoutQueue component would actually see
async function testPayoutQueueContext() {
  console.log('\n=== Test 5: PayoutQueue Context Data ===');
  
  // Check if the DashboardContext has payment data
  if (typeof window !== 'undefined' && window.DashboardContext) {
    console.log('✅ DashboardContext found');
    // Try to access the context data if possible
  } else {
    console.log('⚠️ DashboardContext not available in window');
  }
  
  // Check if paymentData is available globally
  if (typeof window !== 'undefined' && window.paymentData) {
    console.log('✅ Global paymentData found:', window.paymentData);
  } else {
    console.log('⚠️ Global paymentData not available');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive payout data tests...');
  
  await testFetchPayouts();
  await testDataTransformation();  
  await testNaNValues();
  await testPayoutQueueData();
  await testPayoutQueueContext();
  
  console.log('\n🏁 Tests completed! Check above for any issues.');
  console.log('\n💡 Next steps:');
  console.log('1. If you see NaN values, check the raw payout_amount field');
  console.log('2. If broker names are missing, check agent relationships');
  console.log('3. If property addresses are missing, check transaction relationships');
  console.log('4. Refresh your dashboard to see if fixes work in the UI');
}

// Make functions available globally for manual testing
if (typeof window !== 'undefined') {
  window.testCommissionPayouts = {
    runAllTests,
    testFetchPayouts,
    testDataTransformation,
    testNaNValues,
    testPayoutQueueData,
    testPayoutQueueContext
  };
  
  console.log('🔧 Test functions added to window.testCommissionPayouts');
  console.log('📋 Run window.testCommissionPayouts.runAllTests() to test everything');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  runAllTests();
}