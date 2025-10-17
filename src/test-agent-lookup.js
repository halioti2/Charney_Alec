// Test agent lookup functionality (simulating n8n workflow)
// Run this script to verify agent matching works correctly

console.log('🔍 Testing Agent Lookup Functionality');

async function testAgentLookup() {
  console.log('\n=== Agent Lookup Test ===');
  
  try {
    if (typeof window !== 'undefined' && window.supabase) {
      // First, let's see what agents we have
      const { data: agents, error: agentsError } = await window.supabase
        .from('agents')
        .select('id, full_name, email')
        .order('full_name');
      
      if (agentsError) {
        console.error('❌ Error fetching agents:', agentsError);
        return;
      }
      
      console.log('📋 Available agents:', agents);
      
      // Test lookup by first name (simulating n8n logic)
      if (agents && agents.length > 0) {
        const testAgent = agents[0];
        const firstName = testAgent.full_name.split(' ')[0];
        
        console.log(`🔍 Testing lookup for first name: "${firstName}"`);
        
        // Simulate n8n's agent lookup logic
        const { data: matchedAgents, error: lookupError } = await window.supabase
          .from('agents')
          .select('id, full_name, email')
          .ilike('full_name', `${firstName}%`);
        
        if (lookupError) {
          console.error('❌ Error looking up agent:', lookupError);
          return;
        }
        
        console.log(`✅ Found ${matchedAgents?.length || 0} agents matching "${firstName}":`, matchedAgents);
        
        if (matchedAgents && matchedAgents.length > 0) {
          const selectedAgent = matchedAgents[0];
          console.log(`🎯 Would select agent: ${selectedAgent.full_name} (${selectedAgent.id})`);
          
          // Test if this agent_id works for our commission payouts
          const { data: payoutsForAgent, error: payoutsError } = await window.supabase
            .from('commission_payouts')
            .select(`
              id,
              payout_amount,
              status,
              transaction:transactions(property_address),
              agent:agents(full_name)
            `)
            .eq('agent_id', selectedAgent.id);
          
          if (payoutsError) {
            console.error('❌ Error fetching payouts for agent:', payoutsError);
          } else {
            console.log(`💰 Found ${payoutsForAgent?.length || 0} payouts for this agent:`, payoutsForAgent);
          }
        }
      }
      
    } else {
      console.log('⚠️ Supabase client not available');
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Test the RPC function creation with agent lookup
async function testRPCWithAgentLookup() {
  console.log('\n=== RPC Function Test with Agent Lookup ===');
  
  try {
    if (typeof window !== 'undefined' && window.supabase) {
      // First get an approved transaction
      const { data: transactions, error: txError } = await window.supabase
        .from('transactions')
        .select('id, agent_id, final_sale_price, final_listing_commission_percent, final_agent_split_percent, status')
        .eq('status', 'approved')
        .not('agent_id', 'is', null)
        .limit(1);
      
      if (txError) {
        console.error('❌ Error fetching transactions:', txError);
        return;
      }
      
      if (!transactions || transactions.length === 0) {
        console.log('⚠️ No approved transactions with agent_id found');
        return;
      }
      
      const testTransaction = transactions[0];
      console.log('🎯 Testing with transaction:', testTransaction);
      
      // Check if this transaction already has a payout
      const { data: existingPayouts, error: payoutCheckError } = await window.supabase
        .from('commission_payouts')
        .select('id')
        .eq('transaction_id', testTransaction.id);
      
      if (payoutCheckError) {
        console.error('❌ Error checking existing payouts:', payoutCheckError);
        return;
      }
      
      if (existingPayouts && existingPayouts.length > 0) {
        console.log('⚠️ Transaction already has payout(s):', existingPayouts);
        console.log('This simulates the duplicate prevention working correctly');
      } else {
        console.log('✅ Transaction has no existing payouts - good for testing');
        console.log('🔧 Would call RPC: create_commission_payout with transaction_id:', testTransaction.id);
        
        // Calculate expected payout
        const salePrice = testTransaction.final_sale_price || 0;
        const commissionPercent = testTransaction.final_listing_commission_percent || 3.0;
        const agentSplit = testTransaction.final_agent_split_percent || 100.0;
        const expectedPayout = (salePrice * commissionPercent / 100.0 * agentSplit / 100.0);
        
        console.log(`💰 Expected payout calculation:`);
        console.log(`   Sale Price: $${salePrice.toLocaleString()}`);
        console.log(`   Commission: ${commissionPercent}%`);
        console.log(`   Agent Split: ${agentSplit}%`);
        console.log(`   Expected Payout: $${expectedPayout.toLocaleString()}`);
      }
      
    } else {
      console.log('⚠️ Supabase client not available');
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

// Run all agent lookup tests
async function runAgentLookupTests() {
  console.log('🚀 Starting agent lookup tests...');
  
  await testAgentLookup();
  await testRPCWithAgentLookup();
  
  console.log('\n🏁 Agent lookup tests completed!');
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.testAgentLookup = {
    runAgentLookupTests,
    testAgentLookup,
    testRPCWithAgentLookup
  };
  
  console.log('🔧 Agent lookup test functions added to window.testAgentLookup');
  console.log('📋 Run window.testAgentLookup.runAgentLookupTests() to test agent lookup');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  runAgentLookupTests();
}