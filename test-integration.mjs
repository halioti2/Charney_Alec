// Quick test of backend integration
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://shtlthybdjpgvvrbgjrj.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGx0aHliZGpwZ3Z2cmJnanJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyMTg3MTAsImV4cCI6MjA0NDc5NDcxMH0.vKcCrEPAaPJYSZWev4BK-tkkURBdNCF0x8vBDcNa33s'
);

console.log('Testing backend connection...');

// Test database connection
supabase.from('transactions').select('id, status').limit(5)
  .then(({data, error}) => {
    if (error) {
      console.error('❌ Database connection error:', error.message);
    } else {
      console.log('✅ Database connected! Found', data?.length || 0, 'transactions');
      console.log('Sample data:', data);
    }
  })
  .catch(e => console.error('❌ Connection failed:', e.message));

// Test commission payouts
supabase.from('commission_payouts').select('id, status, payout_amount').limit(3)
  .then(({data, error}) => {
    if (error) {
      console.error('❌ Payouts query error:', error.message);
    } else {
      console.log('✅ Payouts connected! Found', data?.length || 0, 'payouts');
    }
  })
  .catch(e => console.error('❌ Payouts failed:', e.message));