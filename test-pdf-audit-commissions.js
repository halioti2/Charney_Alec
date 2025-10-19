// Quick test for PDF Audit Commission Display
// Run in browser console: testPdfAuditCommissions()

window.testPdfAuditCommissions = function() {
  console.log("🧮 Testing PDF Audit Commission Calculations");
  
  // Test data similar to what would come from the form
  const testFormData = {
    final_broker_agent_name: "Jessica Wong",
    final_sale_price: "500000",
    final_listing_commission_percent: "3.0", 
    final_agent_split_percent: "75"
  };

  console.log("📋 Test Form Data:", testFormData);
  
  // Expected calculations:
  const salePrice = 500000;
  const commissionRate = 3.0;
  const expectedGCI = salePrice * (commissionRate / 100); // 500000 * 0.03 = 15000
  
  console.log("💰 Expected GCI:", expectedGCI);
  console.log("🎯 Agent Split:", testFormData.final_agent_split_percent + "%");
  
  // Agent plans should be available from DashboardContext
  if (window.React && window.useDashboardContext) {
    console.log("✅ React and context available for testing");
  } else {
    console.log("⚠️  Need to test from within the application");
  }
  
  console.log("🔧 To test:");
  console.log("1. Open PDF audit modal");
  console.log("2. Enter test values:");
  console.log("   - Agent: Jessica Wong");
  console.log("   - Sale Price: 500000");
  console.log("   - Commission %: 3.0");
  console.log("   - Agent Split %: 75");
  console.log("3. Verify commission breakdown updates");
  
  return testFormData;
};

console.log("📝 PDF Audit commission test loaded. Run: testPdfAuditCommissions()");