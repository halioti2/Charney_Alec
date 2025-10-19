# Branch Merge Conflict Prevention Checklist
## Feature Backend Integration vs New Broker View Merge

This document identifies files likely to be touched by each branch to prevent merge conflicts and plan integration strategy.

---

## 🔧 **Files Modified by Backend Integration Branch (Our Changes)**

### **Core Backend Integration Files**
- `src/context/DashboardContext.jsx` ⚠️ **HIGH RISK** - Major enhancements with polling, realtime, payment handlers
- `src/lib/supabaseService.js` - New functions for data fetching and transformation
- `src/lib/supabaseClient.js` - Client setup and configuration
- `src/main.jsx` - Added window.supabase exposure for testing

### **Netlify Functions (Backend Integration Only)**
- `netlify/functions/approve-transaction.js`
- `netlify/functions/schedule-payout.js`
- `netlify/functions/update-payout-status.js`
- `netlify/functions/process-ach-payment.js`
- `netlify/functions/create-test-transaction.js`
- `netlify/functions/process-payment.js`

### **Payment Components (Backend Integration Only)**
- `src/features/payments/components/PayoutQueue.jsx` - Real data integration, UI fixes
- `src/features/payments/components/PaymentHistory.jsx` - Filter fixes, dropdown persistence, data path corrections

### **PDF Audit Components (Backend Integration Only)**
- `src/components/PdfAuditCard.jsx` - Layout optimization, commission integration, confidence badge repositioning
- `src/components/PdfAuditCommissionDisplay.jsx` - **NEW FILE** - Commission breakdown for PDF audit

### **Test and Debug Files (Backend Integration Only)**
- `test-commission-math.js`
- `test-commission-payouts.js`
- `test-pdf-audit-commissions.js`
- `quick-math-test.js`
- `debug-payment-history.js`
- `test-auth.js`
- `test-payout-data.js`

### **Documentation (Backend Integration Only)**
- `docs/backend-implementation.md` - **EXTENSIVE** documentation of all backend work
- `docs/commission-payout-rpc-documentation.md`

---

## 🎨 **Files Likely Modified by New Broker View Branch**

### **Broker Tab Components (Broker View Changes)**
- `src/features/broker/` - **NEW** directory structure (likely)
- `src/components/BrokerDetailPanel.jsx` ⚠️ **POTENTIAL CONFLICT** - May have UI updates
- `src/pages/BrokerPage.jsx` - UI enhancements and layout changes
- `src/components/BrokerCard.jsx` - Visual improvements
- `src/components/BrokerMetrics.jsx` - New metrics display

### **Shared Components (Broker View Changes)**
- `src/components/MetricCard.jsx` - Styling updates for broker metrics
- `src/components/DataTable.jsx` - Enhanced table functionality
- `src/components/ChartComponent.jsx` - New charting for broker data

### **Styling Files (Broker View Changes)**
- `src/index.css` ⚠️ **POTENTIAL CONFLICT** - Tailwind additions for new components
- `src/styles/broker.css` - **NEW** dedicated styling
- `tailwind.config.cjs` ⚠️ **POTENTIAL CONFLICT** - New color schemes or utilities

---

## ⚠️ **HIGH RISK CONFLICT FILES** (Touched by Both Branches)

### **Critical Files Requiring Manual Merge**

1. **`src/context/DashboardContext.jsx`** 🚨 **HIGHEST RISK**
   - **Backend Integration**: Extensive polling, realtime subscriptions, payment handlers, data fetching
   - **Broker View**: Likely broker-specific state and data management
   - **Resolution Strategy**: Merge broker state additions with existing backend integration patterns

2. **`src/App.jsx`** ⚠️ **MEDIUM RISK**
   - **Backend Integration**: Demo auth setup, error handling
   - **Broker View**: Routing updates for new broker pages
   - **Resolution Strategy**: Combine route additions with auth setup

3. **`src/layouts/RootLayout.jsx`** ⚠️ **MEDIUM RISK**
   - **Backend Integration**: Minor navigation updates
   - **Broker View**: Likely navigation menu enhancements
   - **Resolution Strategy**: Merge navigation improvements

4. **`src/index.css`** ⚠️ **LOW-MEDIUM RISK**
   - **Backend Integration**: Minor component styling
   - **Broker View**: New component styles and theme updates
   - **Resolution Strategy**: Combine CSS additions

5. **`package.json`** ⚠️ **LOW RISK**
   - **Backend Integration**: Supabase dependencies
   - **Broker View**: Potential new UI libraries or chart dependencies
   - **Resolution Strategy**: Merge dependency additions

---

## 🎯 **Merge Strategy & Action Plan**

### **Pre-Merge Preparation**
1. **Document Current State**: Create snapshot of DashboardContext.jsx current state
2. **Identify Integration Points**: Map where broker data will connect to existing backend patterns
3. **Test Current Functionality**: Ensure all backend integration features work before merge
4. **Backup Branch**: Create backup branch before merge attempt

### **Merge Execution Plan**
1. **Start Fresh**: Create new integration branch from main
2. **Cherry-Pick Backend**: Apply backend integration commits selectively
3. **Merge Broker View**: Integrate broker view branch 
4. **Resolve Conflicts**: Focus on DashboardContext integration
5. **Test Integration**: Verify both functionalities work together

### **Post-Merge Integration Tasks**
1. **Connect Broker Backend**: Apply backend patterns to broker components
2. **Extend DashboardContext**: Add broker-specific data fetching using existing patterns
3. **Add Broker Netlify Functions**: Create broker data endpoints
4. **Test End-to-End**: Verify all tabs work with backend integration

---

## 🔌 **Broker View Backend Integration Checklist**

### **DashboardContext Extensions Needed**
```javascript
// Add to existing DashboardContext.jsx
const [brokerData, setBrokerData] = useState([]);
const [brokerMetrics, setBrokerMetrics] = useState({});
const [isRefreshingBroker, setIsRefreshingBroker] = useState(false);

const fetchBrokerData = async () => {
  // Follow existing fetchCoordinatorData pattern
};

const refetchBrokerData = async () => {
  setIsRefreshingBroker(true);
  await fetchBrokerData();
  setIsRefreshingBroker(false);
};
```

### **New Netlify Functions Needed**
- `netlify/functions/update-broker-status.js` - Update broker status/settings
- `netlify/functions/fetch-broker-metrics.js` - Get broker performance data
- `netlify/functions/update-agent-plan.js` - Update commission plans

### **Supabase Service Extensions**
- `fetchBrokerMetrics()` - Get broker dashboard data
- `fetchAgentPlans()` - Get agent commission plans
- `transformBrokerDataForUI()` - Transform data for UI consumption

---

## 📋 **Testing Strategy Post-Merge**

### **Integration Test Checklist**
- [ ] All existing backend integration features still work
- [ ] New broker view displays correctly
- [ ] DashboardContext provides data to all tabs
- [ ] Realtime subscriptions don't interfere with broker functionality
- [ ] Payment workflows unaffected by broker changes
- [ ] PDF audit functionality preserved
- [ ] Cross-tab navigation works properly
- [ ] Polling continues to work for all data types

### **Manual Test Scenarios**
1. **Full Workflow Test**: Coordinator → PDF Audit → Payments → Broker (all tabs)
2. **Data Consistency**: Verify same transaction appears correctly across all relevant tabs
3. **Realtime Updates**: Test that updates in one tab reflect in others
4. **Error Handling**: Ensure error states work across merged functionality
5. **Performance**: Verify no degradation from multiple data sources

---

## 🚨 **Emergency Rollback Plan**

If merge creates major issues:
1. **Immediate**: Revert to pre-merge state using backup branch
2. **Incremental**: Merge components individually to isolate issues
3. **Fallback**: Keep existing backend integration, disable broker backend temporarily
4. **Recovery**: Use feature flags to enable/disable merged functionality

---

## 📝 **Notes for Broker View Backend Integration**

### **Follow Established Patterns**
- Use same hybrid architecture (direct Supabase reads, Netlify function writes)
- Implement polling for broker data similar to coordinator/payments
- Add broker data to realtime subscriptions if needed
- Use existing authentication and error handling patterns

### **Avoid Breaking Changes**
- Don't modify existing DashboardContext structure
- Add broker functionality alongside existing features
- Preserve existing component interfaces
- Maintain backward compatibility with current functionality

### **Integration Priority**
1. **Phase 1**: Get broker view displaying with static/mock data
2. **Phase 2**: Connect broker data fetching following existing patterns  
3. **Phase 3**: Add broker write operations (agent plan updates, etc.)
4. **Phase 4**: Integrate broker with realtime updates and cross-tab consistency