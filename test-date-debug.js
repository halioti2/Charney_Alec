// Date debugging test for payment scheduling
// Run this in the browser console to debug date/timezone issues

window.testDateHandling = function() {
  console.log('🕒 Testing date handling for payment scheduling...');
  
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];
  const todayLocal = now.toLocaleDateString();
  
  console.log('Current date info:');
  console.log('- Current time:', now.toISOString());
  console.log('- Today ISO (what we send):', todayISO);
  console.log('- Today local:', todayLocal);
  console.log('- Timezone offset:', now.getTimezoneOffset(), 'minutes');
  
  // Test what the server will receive
  const serverDate = new Date(todayISO);
  console.log('- Server interprets as:', serverDate.toISOString());
  console.log('- Server date only:', serverDate.toISOString().split('T')[0]);
  
  // Check if there's a mismatch
  const clientDateOnly = now.toISOString().split('T')[0];
  const serverDateOnly = serverDate.toISOString().split('T')[0];
  
  if (clientDateOnly !== serverDateOnly) {
    console.warn('⚠️  Date mismatch detected!');
    console.warn('Client sends:', clientDateOnly);
    console.warn('Server receives:', serverDateOnly);
  } else {
    console.log('✅ Dates match');
  }
  
  return {
    clientTime: now.toISOString(),
    clientDate: todayISO,
    serverDate: serverDate.toISOString(),
    timezoneOffset: now.getTimezoneOffset()
  };
};

// Test creating a proper date string
window.createScheduleDate = function(daysFromNow = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  
  // Use local date to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const localDateString = `${year}-${month}-${day}`;
  console.log(`Date ${daysFromNow} days from now:`, localDateString);
  
  return localDateString;
};

console.log('Date debugging loaded. Run testDateHandling() or createScheduleDate() to test.');
window.testDateHandling();