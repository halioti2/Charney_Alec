/**
 * Auto-refresh Test Script
 * Run this in browser console to monitor DashboardContext initialization
 */

// Monitor the initial setup
console.log('🔍 Auto-refresh Test: Monitoring DashboardContext initial load...');

// Check if data is being populated immediately
setTimeout(() => {
  console.log('⏱️  Auto-refresh Test: Checking data 2 seconds after page load...');
  
  // Check if transactions are loaded
  const transactionsLength = window.React && window.React.version ? 'React available' : 'Checking manual way...';
  console.log('📊 Transactions check:', transactionsLength);
  
  // Look for dashboard context in DOM
  const coordinatorTab = document.querySelector('[data-tab="coordinator"]');
  const paymentTab = document.querySelector('[data-tab="payments"]');
  
  console.log('🎯 Coordinator tab found:', !!coordinatorTab);
  console.log('💰 Payment tab found:', !!paymentTab);
  
  // Check for loading indicators
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
  console.log('⏳ Loading elements still visible:', loadingElements.length);
  
  // Check for data tables/content
  const dataElements = document.querySelectorAll('table, [class*="card"], [class*="metric"]');
  console.log('📈 Data elements rendered:', dataElements.length);
  
}, 2000);

setTimeout(() => {
  console.log('⏱️  Auto-refresh Test: Final check 5 seconds after page load...');
  
  // Check for specific UI elements that should be populated with data
  const transactionRows = document.querySelectorAll('tr[data-transaction-id], .transaction-row');
  const paymentRows = document.querySelectorAll('tr[data-payout-id], .payout-row');
  
  console.log('📊 Transaction rows found:', transactionRows.length);
  console.log('💰 Payment rows found:', paymentRows.length);
  
  // If no data is showing, the auto-refresh might not be working
  if (transactionRows.length === 0 && paymentRows.length === 0) {
    console.log('❌ Auto-refresh Test: No data visible - auto-refresh may not be working');
  } else {
    console.log('✅ Auto-refresh Test: Data is visible - auto-refresh appears to be working');
  }
  
}, 5000);

console.log('🚀 Auto-refresh Test: Monitoring started. Check console for updates...');