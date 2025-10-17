// Quick agent check script - copy to browser console to run
console.log('🔍 Checking available agents...');

// Run this in browser console with app loaded
async function checkAgents() {
  try {
    const { data: agents, error } = await window.supabase
      .from('agents')
      .select('id, full_name, email')
      .limit(10);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('📋 Available agents:');
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.full_name} (ID: ${agent.id}) - ${agent.email}`);
    });
    
    if (agents.length > 0) {
      console.log(`\n✅ Found ${agents.length} agents. First agent ID: ${agents[0].id}`);
      console.log(`Copy this ID for updating test transactions: "${agents[0].id}"`);
      return agents[0].id;
    } else {
      console.log('❌ No agents found');
    }
  } catch (error) {
    console.error('❌ Error checking agents:', error);
  }
}

checkAgents();