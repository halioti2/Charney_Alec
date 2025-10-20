// =====================================================
// PAYMENT QUEUE DEBUG SCRIPT
// =====================================================
// 
// Run this in your browser console on the payments page
// to debug Jessica Wong's payout calculation discrepancy
//
// This will help identify:
// 1. What data is being used for calculations
// 2. Where the $20,723.28 vs $17,169.40 discrepancy comes from
// 3. Whether frontend or backend calculation is wrong
// =====================================================

console.log('🔍 PAYMENT QUEUE DEBUG STARTING...');

// Check if we're on the right page
if (!window.location.pathname.includes('payment') && !document.querySelector('[data-testid="payout-queue"]')) {
  console.warn('⚠️ This debug script should be run on the payments/payout page');
}

// Function to format currency for easy reading
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

// Function to debug commission calculation
function debugCommissionCalculation(salePrice, commissionPercent, agentSplitPercent = 70) {
  console.log('\n💰 COMMISSION CALCULATION DEBUG:');
  console.log('Input Values:');
  console.log('  Sale Price:', formatCurrency(salePrice));
  console.log('  Commission %:', commissionPercent + '%');
  console.log('  Agent Split %:', agentSplitPercent + '%');
  
  const gci = salePrice * (commissionPercent / 100);
  const franchiseFee = gci * 0.06; // 6%
  const adjustedGci = gci - franchiseFee;
  const agentShare = adjustedGci * (agentSplitPercent / 100);
  const eoFee = 150;
  const transactionFee = 450;
  const netPayout = agentShare - eoFee - transactionFee;
  
  console.log('\nCalculation Steps:');
  console.log('  1. GCI (Gross Commission):', formatCurrency(gci));
  console.log('  2. Franchise Fee (6%):', formatCurrency(franchiseFee));
  console.log('  3. Adjusted GCI:', formatCurrency(adjustedGci));
  console.log('  4. Agent Share (' + agentSplitPercent + '%):', formatCurrency(agentShare));
  console.log('  5. E&O Fee:', formatCurrency(eoFee));
  console.log('  6. Transaction Fee:', formatCurrency(transactionFee));
  console.log('  7. NET PAYOUT:', formatCurrency(netPayout));
  
  return {
    gci,
    franchiseFee,
    adjustedGci,
    agentShare,
    eoFee,
    transactionFee,
    netPayout
  };
}

// Check for React/Vue context
let dashboardContext = null;
try {
  // Try to find React component tree
  const reactFiber = document.querySelector('#root')._reactInternalInstance || 
                     document.querySelector('#root')._reactInternals ||
                     Object.keys(document.querySelector('#root')).find(key => key.startsWith('__reactInternalInstance'));
  
  if (reactFiber) {
    console.log('✅ React context found');
  }
} catch (e) {
  console.log('❌ No React context found:', e.message);
}

// Debug Jessica Wong's specific case
console.log('\n🎯 JESSICA WONG CASE ANALYSIS:');
const jessicaExpected = debugCommissionCalculation(1080206.45, 2.5, 70);

// Look for payout data in the DOM
console.log('\n🔍 SEARCHING DOM FOR PAYOUT DATA:');

// Find all payout amounts in the page
const payoutElements = document.querySelectorAll('[class*="payout"], [class*="amount"], [class*="currency"]');
console.log('Found potential payout elements:', payoutElements.length);

payoutElements.forEach((el, index) => {
  if (el.textContent.includes('$') || el.textContent.includes('20') || el.textContent.includes('17')) {
    console.log(`  Element ${index}:`, {
      text: el.textContent.trim(),
      className: el.className,
      tagName: el.tagName
    });
  }
});

// Look for Jessica Wong specifically
const jessicaElements = document.querySelectorAll('*');
const jessicaNodes = Array.from(jessicaElements).filter(el => 
  el.textContent.includes('Jessica Wong') || 
  el.textContent.includes('Jessica') ||
  el.textContent.includes('Wong')
);

console.log('\n👤 JESSICA WONG ELEMENTS:');
jessicaNodes.forEach((el, index) => {
  if (el.children.length === 0) { // Only text nodes
    console.log(`  Element ${index}:`, {
      text: el.textContent.trim(),
      parent: el.parentElement?.className || 'no parent',
      tagName: el.tagName
    });
  }
});

// Look for table rows or payout entries
const tableRows = document.querySelectorAll('tr, [class*="row"], [class*="item"], [class*="entry"]');
console.log('\n📊 TABLE ROWS/ITEMS:');

tableRows.forEach((row, index) => {
  if (row.textContent.includes('Jessica') || row.textContent.includes('20723') || row.textContent.includes('17169')) {
    console.log(`  Row ${index}:`, {
      text: row.textContent.trim(),
      className: row.className,
      innerHTML: row.innerHTML.substring(0, 200) + '...'
    });
  }
});

// Check for any global data objects
console.log('\n🌐 CHECKING FOR GLOBAL DATA:');
const globalKeys = ['transactions', 'payouts', 'commissions', 'agents', 'data'];
globalKeys.forEach(key => {
  if (window[key]) {
    console.log(`Found window.${key}:`, window[key]);
  }
});

// Check localStorage/sessionStorage
console.log('\n💾 STORAGE DATA:');
Object.keys(localStorage).forEach(key => {
  if (key.includes('transaction') || key.includes('payout') || key.includes('commission')) {
    console.log(`localStorage.${key}:`, localStorage.getItem(key));
  }
});

// Summary
console.log('\n📋 SUMMARY:');
console.log('Expected Jessica Wong payout (correct calc):', formatCurrency(jessicaExpected.netPayout));
console.log('Currently displayed amount: CHECK THE PAGE');
console.log('Discrepancy: If showing $20,723.28 instead of $17,169.40');
console.log('Difference:', formatCurrency(20723.28 - 17169.40), '(missing E&O and transaction fees)');

console.log('\n✅ DEBUG COMPLETE - Check output above for analysis');

// Return useful functions for manual testing
window.debugPayout = debugCommissionCalculation;
window.formatCurrency = formatCurrency;

console.log('\n🛠️ HELPER FUNCTIONS ADDED TO WINDOW:');
console.log('  window.debugPayout(salePrice, commissionPercent, agentSplitPercent)');
console.log('  window.formatCurrency(amount)');
console.log('\nExample: debugPayout(1080206.45, 2.5, 70)');