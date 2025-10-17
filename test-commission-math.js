// Math Verification Test Suite
// Run this in browser console to test transaction math across all workflows

console.log('🧮 Commission Math Verification Test Suite');

// Test configuration
const TEST_CONFIG = {
  // Test scenarios with different sale prices and rates
  testCases: [
    { salePrice: 500000, commissionRate: 3.0, agentSplit: 70 },
    { salePrice: 750000, commissionRate: 3.5, agentSplit: 75 },
    { salePrice: 1000000, commissionRate: 4.0, agentSplit: 80 },
    { salePrice: 1250000, commissionRate: 4.2, agentSplit: 65 },
    { salePrice: 1500000, commissionRate: 2.5, agentSplit: 85 },
    { salePrice: 2000000, commissionRate: 3.8, agentSplit: 72 },
    { salePrice: 850000, commissionRate: 3.2, agentSplit: 78 },
    { salePrice: 1100000, commissionRate: 4.5, agentSplit: 68 },
    { salePrice: 950000, commissionRate: 2.8, agentSplit: 82 },
    { salePrice: 1650000, commissionRate: 3.6, agentSplit: 76 }
  ]
};

// Helper functions for math verification
function calculateExpectedPayout(salePrice, commissionRate, agentSplit) {
  const totalCommission = salePrice * (commissionRate / 100);
  const agentPayout = totalCommission * (agentSplit / 100);
  return Math.round(agentPayout * 100) / 100; // Round to 2 decimal places
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Test 1: Automated Approval Workflow (Phase 1A)
async function testAutomatedApprovalMath() {
  console.log('\n🤖 TEST 1: Automated Approval Math Verification');
  console.log('Testing 10 auto-approved transactions...');
  
  const results = [];
  
  for (let i = 0; i < TEST_CONFIG.testCases.length; i++) {
    const testCase = TEST_CONFIG.testCases[i];
    console.log(`\n--- Test Case ${i + 1} ---`);
    console.log(`Sale Price: ${formatCurrency(testCase.salePrice)}`);
    console.log(`Commission: ${testCase.commissionRate}%`);
    console.log(`Agent Split: ${testCase.agentSplit}%`);
    
    try {
      // Calculate expected payout
      const expectedPayout = calculateExpectedPayout(
        testCase.salePrice, 
        testCase.commissionRate, 
        testCase.agentSplit
      );
      console.log(`Expected Payout: ${formatCurrency(expectedPayout)}`);
      
      // Create auto-approval transaction
      console.log('🔄 Creating phase1a transaction...');
      const createResponse = await fetch('/.netlify/functions/create-test-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type: 'phase1a',
          sale_price: testCase.salePrice,
          commission_rate: testCase.commissionRate,
          agent_split: testCase.agentSplit
        })
      });
      
      if (!createResponse.ok) {
        throw new Error(`Failed to create transaction: ${createResponse.statusText}`);
      }
      
      const createResult = await createResponse.json();
      console.log(`✅ Transaction created: ${createResult.transaction_id}`);
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the created payout
      const { data: payouts, error: payoutError } = await window.supabase
        .from('commission_payouts')
        .select('*')
        .eq('transaction_id', createResult.transaction_id);
      
      if (payoutError) throw payoutError;
      
      if (payouts && payouts.length > 0) {
        const actualPayout = parseFloat(payouts[0].payout_amount);
        const difference = Math.abs(actualPayout - expectedPayout);
        const isCorrect = difference < 0.01; // Allow 1 cent tolerance
        
        console.log(`Actual Payout: ${formatCurrency(actualPayout)}`);
        console.log(`Difference: ${formatCurrency(difference)}`);
        console.log(`Math Correct: ${isCorrect ? '✅ YES' : '❌ NO'}`);
        
        results.push({
          testCase: i + 1,
          salePrice: testCase.salePrice,
          commissionRate: testCase.commissionRate,
          agentSplit: testCase.agentSplit,
          expectedPayout,
          actualPayout,
          difference,
          isCorrect,
          transactionId: createResult.transaction_id
        });
      } else {
        console.log('❌ No payout found for transaction');
        results.push({
          testCase: i + 1,
          isCorrect: false,
          error: 'No payout created'
        });
      }
      
    } catch (error) {
      console.error(`❌ Test case ${i + 1} failed:`, error);
      results.push({
        testCase: i + 1,
        isCorrect: false,
        error: error.message
      });
    }
  }
  
  // Summary
  const passed = results.filter(r => r.isCorrect).length;
  const total = results.length;
  console.log(`\n📊 AUTOMATED APPROVAL RESULTS: ${passed}/${total} tests passed`);
  
  if (passed < total) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.isCorrect).forEach(result => {
      console.log(`Test ${result.testCase}: ${result.error || 'Math incorrect'}`);
      if (result.expectedPayout && result.actualPayout) {
        console.log(`  Expected: ${formatCurrency(result.expectedPayout)}, Got: ${formatCurrency(result.actualPayout)}`);
      }
    });
  }
  
  return results;
}

// Test 2: Manual Approval Workflow (Phase 1B)  
async function testManualApprovalMath() {
  console.log('\n👤 TEST 2: Manual Approval Math Verification');
  console.log('Testing manual edit and approval workflow...');
  
  const results = [];
  const testCases = TEST_CONFIG.testCases.slice(0, 3); // Test first 3 cases for manual workflow
  
  for (let i = 0; i < testCases.length; i++) {
    const originalCase = testCases[i];
    // Create a modified case with different sale price for manual editing
    const editedCase = {
      salePrice: originalCase.salePrice + 100000, // Add $100k
      commissionRate: originalCase.commissionRate + 0.3, // Add 0.3%
      agentSplit: Math.min(originalCase.agentSplit + 5, 100) // Add 5%
    };
    
    console.log(`\n--- Manual Test Case ${i + 1} ---`);
    console.log(`Original: ${formatCurrency(originalCase.salePrice)} @ ${originalCase.commissionRate}% / ${originalCase.agentSplit}%`);
    console.log(`Edited: ${formatCurrency(editedCase.salePrice)} @ ${editedCase.commissionRate}% / ${editedCase.agentSplit}%`);
    
    try {
      // Calculate expected payout for edited values
      const expectedPayout = calculateExpectedPayout(
        editedCase.salePrice,
        editedCase.commissionRate,
        editedCase.agentSplit
      );
      console.log(`Expected Final Payout: ${formatCurrency(expectedPayout)}`);
      
      // Create phase1b transaction (needs manual review)
      console.log('🔄 Creating phase1b transaction...');
      const createResponse = await fetch('/.netlify/functions/create-test-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_type: 'phase1b',
          sale_price: originalCase.salePrice,
          commission_rate: originalCase.commissionRate,
          agent_split: originalCase.agentSplit
        })
      });
      
      if (!createResponse.ok) {
        throw new Error(`Failed to create transaction: ${createResponse.statusText}`);
      }
      
      const createResult = await createResponse.json();
      console.log(`✅ Transaction created: ${createResult.transaction_id}`);
      
      // Simulate manual approval with edited values
      console.log('🔄 Simulating manual approval with edited values...');
      const { data: { session } } = await window.supabase.auth.getSession();
      
      const approveResponse = await fetch('/.netlify/functions/approve-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          transaction_id: createResult.transaction_id,
          final_data: {
            final_broker_agent_name: 'Test Manual Agent',
            property_address: 'Manual Test Property',
            final_sale_price: editedCase.salePrice,
            final_listing_commission_percent: editedCase.commissionRate,
            final_buyer_commission_percent: 2.5,
            final_agent_split_percent: editedCase.agentSplit,
            final_co_broker_agent_name: '',
            final_co_brokerage_firm_name: ''
          },
          checklist_responses: {
            "Contract of Sale": true,
            "Invoice": true,
            "Disclosure Forms": true
          }
        })
      });
      
      if (!approveResponse.ok) {
        throw new Error(`Failed to approve transaction: ${approveResponse.statusText}`);
      }
      
      await approveResponse.json();
      console.log('✅ Transaction approved');
      
      // Wait for payout creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch the created payout
      const { data: payouts, error: payoutError } = await window.supabase
        .from('commission_payouts')
        .select('*')
        .eq('transaction_id', createResult.transaction_id);
      
      if (payoutError) throw payoutError;
      
      if (payouts && payouts.length > 0) {
        const actualPayout = parseFloat(payouts[0].payout_amount);
        const difference = Math.abs(actualPayout - expectedPayout);
        const isCorrect = difference < 0.01; // Allow 1 cent tolerance
        
        console.log(`Actual Payout: ${formatCurrency(actualPayout)}`);
        console.log(`Difference: ${formatCurrency(difference)}`);
        console.log(`Math Correct: ${isCorrect ? '✅ YES' : '❌ NO'}`);
        
        results.push({
          testCase: i + 1,
          originalCase,
          editedCase,
          expectedPayout,
          actualPayout,
          difference,
          isCorrect,
          transactionId: createResult.transaction_id
        });
      } else {
        console.log('❌ No payout found for transaction');
        results.push({
          testCase: i + 1,
          isCorrect: false,
          error: 'No payout created'
        });
      }
      
    } catch (error) {
      console.error(`❌ Manual test case ${i + 1} failed:`, error);
      results.push({
        testCase: i + 1,
        isCorrect: false,
        error: error.message
      });
    }
  }
  
  // Summary
  const passed = results.filter(r => r.isCorrect).length;
  const total = results.length;
  console.log(`\n📊 MANUAL APPROVAL RESULTS: ${passed}/${total} tests passed`);
  
  if (passed < total) {
    console.log('\n❌ Failed tests:');
    results.filter(r => !r.isCorrect).forEach(result => {
      console.log(`Test ${result.testCase}: ${result.error || 'Math incorrect'}`);
      if (result.expectedPayout && result.actualPayout) {
        console.log(`  Expected: ${formatCurrency(result.expectedPayout)}, Got: ${formatCurrency(result.actualPayout)}`);
      }
    });
  }
  
  return results;
}

// Run all tests
async function runAllMathTests() {
  console.log('🚀 Starting Complete Math Verification Test Suite...');
  
  try {
    const automatedResults = await testAutomatedApprovalMath();
    const manualResults = await testManualApprovalMath();
    
    const totalPassed = automatedResults.filter(r => r.isCorrect).length + 
                       manualResults.filter(r => r.isCorrect).length;
    const totalTests = automatedResults.length + manualResults.length;
    
    console.log(`\n🏁 FINAL RESULTS: ${totalPassed}/${totalTests} total tests passed`);
    
    if (totalPassed === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Commission math is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the details above.');
    }
    
    return {
      automated: automatedResults,
      manual: manualResults,
      summary: { passed: totalPassed, total: totalTests }
    };
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    return null;
  }
}

// Export functions for individual testing
window.testCommissionMath = {
  runAll: runAllMathTests,
  automated: testAutomatedApprovalMath,
  manual: testManualApprovalMath,
  calculateExpected: calculateExpectedPayout
};

console.log('\n📋 Available functions:');
console.log('- testCommissionMath.runAll() - Run complete test suite');
console.log('- testCommissionMath.automated() - Test automated approvals only'); 
console.log('- testCommissionMath.manual() - Test manual approvals only');
console.log('- testCommissionMath.calculateExpected(salePrice, commissionRate, agentSplit) - Calculate expected payout');

console.log('\n🎯 Ready to test! Run: testCommissionMath.runAll()');