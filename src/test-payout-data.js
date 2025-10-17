// Test script to debug commission payouts data flow
// Run this in browser console to check data transformation

async function testPayoutData() {
  console.log('=== Testing Commission Payouts Data Flow ===');
  
  try {
    // Test direct Supabase connection
    const { createClient } = window.supabase || {};
    if (!createClient) {
      console.error('Supabase client not available');
      return;
    }
    
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    console.log('1. Testing direct Supabase query...');
    const { data: rawPayouts, error } = await supabase
      .from('commission_payouts')
      .select(`
        *,
        transactions!commission_payouts_transaction_id_fkey (
          id,
          property_address,
          final_sale_price,
          final_broker_agent_name,
          agent_id,
          created_at,
          status
        ),
        agents!commission_payouts_agent_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      return;
    }
    
    console.log('2. Raw payouts from Supabase:', rawPayouts);
    
    if (!rawPayouts || rawPayouts.length === 0) {
      console.warn('No payouts found in database');
      return;
    }
    
    // Test transformation
    console.log('3. Testing transformation...');
    const transformedPayouts = rawPayouts.map(payout => {
      const transaction = payout.transactions;
      const agent = payout.agents;
      
      const transformed = {
        id: payout.id,
        payout_amount: parseFloat(payout.payout_amount) || 0,
        broker: agent?.full_name || transaction?.final_broker_agent_name || 'Unknown Agent',
        propertyAddress: transaction?.property_address || 'Unknown Property',
        salePrice: parseFloat(transaction?.final_sale_price) || 0,
        status: payout.status || 'unknown',
        created_at: payout.created_at
      };
      
      console.log('Transformed payout:', transformed);
      return transformed;
    });
    
    console.log('4. Final transformed payouts:', transformedPayouts);
    
    // Check for $NaN values
    const hasNaN = transformedPayouts.some(p => 
      isNaN(p.payout_amount) || isNaN(p.salePrice) || 
      p.broker === 'Unknown Agent' || p.propertyAddress === 'Unknown Property'
    );
    
    if (hasNaN) {
      console.warn('⚠️ Found potential data issues (NaN values or missing data)');
    } else {
      console.log('✅ All data looks good!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testPayoutData();
}

export { testPayoutData };