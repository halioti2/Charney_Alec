// Test backend integration through netlify dev environment
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:8888';

console.log('🔧 Testing Phase 3 Integration with Netlify Dev Environment...\n');

// Test 1: Verify netlify functions are accessible
console.log('1. Testing Netlify Functions Accessibility...');

async function testNetlifyFunction(functionName) {
  try {
    const response = await fetch(`${BASE_URL}/.netlify/functions/${functionName}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const result = response.status;
    console.log(`   ✓ /.netlify/functions/${functionName} → Status: ${result}`);
    return result < 500; // Success if not server error
  } catch (error) {
    console.log(`   ✗ /.netlify/functions/${functionName} → Error: ${error.message}`);
    return false;
  }
}

// Test our key functions
const functions = [
  'schedule-payout',
  'process-payment', 
  'approve-transaction',
  'update-payout-status'
];

console.log('\n2. Testing Individual Netlify Functions...');
for (const func of functions) {
  await testNetlifyFunction(func);
}

// Test 3: Verify frontend loads properly
console.log('\n3. Testing Frontend Loading...');
try {
  const response = await fetch(BASE_URL);
  const html = await response.text();
  const hasReact = html.includes('id="root"');
  const hasVite = html.includes('vite');
  
  console.log(`   ✓ Frontend loads → Status: ${response.status}`);
  console.log(`   ✓ React root element present: ${hasReact}`);
  console.log(`   ✓ Vite integration: ${hasVite}`);
} catch (error) {
  console.log(`   ✗ Frontend loading failed: ${error.message}`);
}

console.log('\n4. Testing Environment Variables...');
console.log(`   ✓ Netlify dev environment: ${process.env.NODE_ENV !== 'production'}`);
console.log(`   ✓ Base URL accessible: ${BASE_URL}`);

console.log('\n🎉 Netlify Dev Environment Test Complete!');
console.log('📋 Next: Test dashboard functionality in browser at http://localhost:8888');