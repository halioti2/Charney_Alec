// Quick Math Test - Copy to browser console
// Tests a few key scenarios to verify commission calculations

console.log('🧮 Quick Commission Math Test');

async function quickMathTest() {
  console.log('Testing commission calculation accuracy...');
  
  // Test case: Clean numbers that should have exact results
  const testCase = {
    salePrice: 1000000,  // $1M
    commissionRate: 4.0, // 4%  
    agentSplit: 75       // 75%
  };
  
  const expectedPayout = 1000000 * 0.04 * 0.75; // Should be exactly $30,000
  console.log(`Expected payout: $${expectedPayout.toFixed(2)}`);
  
  try {
    // Create test transaction
    const { data: { session } } = await window.supabase.auth.getSession();
    
    const response = await fetch('/.netlify/functions/create-test-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        test_type: 'phase1a',
        sale_price: testCase.salePrice,
        commission_rate: testCase.commissionRate,
        agent_split: testCase.agentSplit
      })
    });
    
    const result = await response.json();
    console.log(`Transaction created: ${result.transaction_id}`);
    
    // Wait for payout creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check payout
    const { data: payouts } = await window.supabase
      .from('commission_payouts')
      .select('*')
      .eq('transaction_id', result.transaction_id);
    
    if (payouts && payouts.length > 0) {
      const actualPayout = parseFloat(payouts[0].payout_amount);
      const difference = Math.abs(actualPayout - expectedPayout);
      
      console.log(`Actual payout: $${actualPayout.toFixed(2)}`);
      console.log(`Difference: $${difference.toFixed(4)}`);
      console.log(`Math correct: ${difference < 0.01 ? '✅' : '❌'}`);
      
      return {
        expected: expectedPayout,
        actual: actualPayout,
        correct: difference < 0.01
      };
    } else {
      console.log('❌ No payout found');
      return { error: 'No payout created' };
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    return { error: error.message };
  }
}

// Run the test
quickMathTest();