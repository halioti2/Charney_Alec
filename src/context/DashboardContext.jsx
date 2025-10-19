import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  createAgentPlans,
  createMockCommissions,
  createMockStockData,
  calculateCommission,
  createMockUser,
} from '../lib/dashboardData.js';
import {
  fetchTransactions,
  transformTransactionsForUI,
  subscribeToTransactions,
  subscribeToCommissionEvidences,
  fetchCommissionPayouts,
  transformPayoutsForUI,
} from '../lib/supabaseService.js';
import { supabase } from '../lib/supabaseClient.js';

const DashboardContext = createContext(undefined);

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem('charney-theme') || 'light';
};

export function DashboardProvider({ children, initialState = {} }) {
  const {
    commissions: initialCommissions,
    agentPlans: initialAgentPlans,
    marketData: initialMarketData,
    theme: initialTheme,
    activeView: initialActiveView = 'coordinator',
    activeCommissionId: initialActiveCommissionId = null,
    modalFocus: initialModalFocus = 'full',
    panelAgent: initialPanelAgent = null,
    user: initialUser,
    isPdfAuditVisible: initialIsPdfAuditVisible = false,
    currentAuditId: initialCurrentAuditId = null,
  } = initialState;

  const [commissions, setCommissions] = useState(() => initialCommissions ?? createMockCommissions());
  const [agentPlans, setAgentPlans] = useState(() => initialAgentPlans ?? createAgentPlans());
  const [marketData, setMarketData] = useState(() => initialMarketData ?? createMockStockData());
  const [theme, setTheme] = useState(() => initialTheme ?? getInitialTheme());
  const [activeView, setActiveView] = useState(initialActiveView);
  const [activeCommissionId, setActiveCommissionId] = useState(initialActiveCommissionId);
  const [modalFocus, setModalFocus] = useState(initialModalFocus);
  const [panelAgent, setPanelAgent] = useState(initialPanelAgent);
  const [user] = useState(() => initialUser ?? createMockUser());
  const [isPdfAuditVisible, setIsPdfAuditVisible] = useState(initialIsPdfAuditVisible);
  const [currentAuditId, setCurrentAuditId] = useState(initialCurrentAuditId);

  // Stage 1: Coordinator Tab Backend Integration
  const [transactions, setTransactions] = useState([]);
  const [coordinatorData, setCoordinatorData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [realtimeSubscriptions, setRealtimeSubscriptions] = useState([]);

  // Stage 2: Payments Tab Backend Integration
  const [paymentData, setPaymentData] = useState([]);
  const [paymentTransactions, setPaymentTransactions] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isRefreshingPayments, setIsRefreshingPayments] = useState(false);
  
  // Track initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Monitor authentication state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        console.log('Authentication confirmed, user logged in');
      } else {
        console.log('No active session detected');
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, !!session);
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('charney-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const switchView = useCallback((view) => {
    setActiveView(view);
  }, []);

  const showPdfAudit = useCallback((commissionId) => {
    setCurrentAuditId(commissionId);
    setIsPdfAuditVisible(true);
  }, []);

  const hidePdfAudit = useCallback(() => {
    setIsPdfAuditVisible(false);
    setCurrentAuditId(null);
  }, []);

  // Stage 1: Coordinator Tab Methods
  const refetchCoordinatorData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      console.log('Fetching coordinator data...');
      const rawTransactions = await fetchTransactions();
      const transformedTransactions = transformTransactionsForUI(rawTransactions);
      console.log('Setting coordinator state with', transformedTransactions.length, 'transactions');
      setTransactions(transformedTransactions);
      setCoordinatorData({ lastUpdated: new Date().toISOString() });
    } catch (error) {
      console.error('Failed to refresh coordinator data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Stage 2: Payments Tab Methods
  const refetchPaymentData = useCallback(async () => {
    setIsRefreshingPayments(true);
    try {
      console.log('Fetching payment data...');
      
      // Fetch commission payouts
      const rawPayouts = await fetchCommissionPayouts();
      const transformedPayouts = transformPayoutsForUI(rawPayouts);
      
      // Filter for different payment queues
      const paymentQueueData = transformedPayouts.filter(
        p => p.status === 'ready' && p.payout_amount > 0
      );
      
      // Payment history shows all payouts for comprehensive view
      const paymentHistoryData = transformedPayouts.filter(
        p => p.payout_amount > 0 // All payouts with valid amounts
      );
      
      console.log('Setting payment state - Queue:', paymentQueueData.length, 'items, History:', paymentHistoryData.length, 'items');
      setPaymentData(paymentQueueData);
      setPaymentHistory(paymentHistoryData);
      
    } catch (error) {
      console.error('Failed to refresh payment data:', error);
    } finally {
      setIsRefreshingPayments(false);
    }
  }, []);

  // Payment Operation Handlers (Hybrid Model - Call Netlify Functions)
  const schedulePayouts = useCallback(async (payoutIds, options = {}) => {
    try {
      console.log('Scheduling payouts via Netlify function:', payoutIds);
      
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session found');
      }
      
      const response = await fetch('/.netlify/functions/schedule-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payout_ids: payoutIds, // Send as array for bulk processing
          scheduled_date: options.scheduledDate || (() => {
            // Create date in local timezone to avoid UTC conversion issues
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })(), // Default to today in local timezone
          payment_method: options.paymentMethod || 'manual', // Default to manual
          auto_ach: options.achEnabled || false,
          provider_details: options.providerDetails || null
        })
      });

      if (!response.ok) {
        let errorMessage = 'Failed to schedule payouts';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Payouts scheduled successfully:', result);

      // Refresh payment data to show updated status
      await refetchPaymentData();
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to schedule payouts:', error);
      return { success: false, error: error.message };
    }
  }, [refetchPaymentData]);

  const processPayment = useCallback(async (payoutId, paymentMethod) => {
    try {
      console.log('Processing payment via Netlify function:', { payoutId, paymentMethod });
      
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session found');
      }
      
      const functionName = paymentMethod === 'ach' ? 'process-ach-payment' : 'process-payment';
      
      const response = await fetch(`/.netlify/functions/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payout_id: payoutId,
          payment_method: paymentMethod
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process payment');
      }

      const result = await response.json();
      console.log('Payment processed successfully:', result);

      // Refresh payment data to show updated status
      await refetchPaymentData();
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to process payment:', error);
      return { success: false, error: error.message };
    }
  }, [refetchPaymentData]);

  const updatePayoutStatus = useCallback(async (payoutId, status, metadata = {}) => {
    try {
      console.log('Updating payout status via Netlify function:', { payoutId, status, metadata });
      
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authentication session found');
      }
      
      const response = await fetch('/.netlify/functions/update-payout-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          payout_id: payoutId,
          status,
          metadata
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update payout status');
      }

      const result = await response.json();
      console.log('Payout status updated successfully:', result);

      // Refresh payment data to show updated status
      await refetchPaymentData();
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to update payout status:', error);
      return { success: false, error: error.message };
    }
  }, [refetchPaymentData]);

  const subscribeToPaymentUpdates = useCallback(() => {
    // Payment updates will come through same transaction subscriptions
    // as payments are part of transaction lifecycle
    console.log('Payment updates will be handled by existing transaction subscriptions');
  }, []);

  const subscribeToTransactionUpdates = useCallback(() => {
    // Clean up existing subscriptions
    realtimeSubscriptions.forEach(sub => sub.unsubscribe());

    const transactionSub = subscribeToTransactions(() => {
      // Refresh data when transactions change
      console.log('Realtime: Transaction update detected, refetching coordinator and payment data...');
      refetchCoordinatorData();
      refetchPaymentData(); // Also refresh payment data when transactions change
    });

    const evidenceSub = subscribeToCommissionEvidences(() => {
      // Refresh data when commission evidences change
      console.log('Realtime: Evidence update detected, refetching coordinator data...');
      refetchCoordinatorData();
    });

    setRealtimeSubscriptions([transactionSub, evidenceSub]);

    return () => {
      transactionSub.unsubscribe();
      evidenceSub.unsubscribe();
    };
  }, [refetchCoordinatorData, refetchPaymentData]); // Add refetchPaymentData dependency

  // Initial data fetch and subscription setup
  useEffect(() => {
    // Only proceed if user is authenticated
    if (!isAuthenticated) {
      console.log('Waiting for authentication before setting up data...');
      return;
    }

    let currentSubscriptions = [];

    const setupData = async () => {
      console.log('Setting up initial data and subscriptions...');
      
      // Longer delay to ensure authentication is fully settled
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        // Initial fetch for both coordinator and payments data
        await refetchCoordinatorData();
        await refetchPaymentData();
        
        // Mark as initialized after both data fetches complete
        setIsInitialized(true);
        console.log('Initial data loading completed');
        
      } catch (error) {
        console.error('Error in setupData:', error);
      }

      // Setup subscriptions (shared for both coordinator and payments)
      const transactionSub = subscribeToTransactions(() => {
        console.log('Realtime: Transaction update detected, refetching both datasets...');
        refetchCoordinatorData();
        refetchPaymentData(); // Also refresh payment data
      });

      const evidenceSub = subscribeToCommissionEvidences(() => {
        console.log('Realtime: Evidence update detected, refetching coordinator data...');
        refetchCoordinatorData();
      });

      currentSubscriptions = [transactionSub, evidenceSub];
      setRealtimeSubscriptions(currentSubscriptions);
    };

    setupData();
    
    return () => {
      currentSubscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [isAuthenticated, refetchCoordinatorData, refetchPaymentData]); // Add isAuthenticated dependency

  // Polling for coordinator data (30-60s backup)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!isRefreshing) {
        console.log('Polling interval: Refreshing coordinator data...');
        refetchCoordinatorData();
      }
    }, 45000); // Poll every 45 seconds

    return () => clearInterval(pollInterval);
  }, [isRefreshing, refetchCoordinatorData]);

  // Polling for payment data (more frequent to catch payout changes)
  useEffect(() => {
    const paymentPollInterval = setInterval(() => {
      if (!isRefreshingPayments) {
        console.log('Polling interval: Refreshing payment data...');
        refetchPaymentData();
      }
    }, 30000); // Poll every 30 seconds for payments

    return () => clearInterval(paymentPollInterval);
  }, [isRefreshingPayments, refetchPaymentData]);

  const contextValue = useMemo(
    () => ({
      commissions,
      setCommissions,
      agentPlans,
      setAgentPlans,
      marketData,
      setMarketData,
      theme,
      setTheme,
      activeView,
      setActiveView,
      switchView,
      activeCommissionId,
      setActiveCommissionId,
      modalFocus,
      setModalFocus,
      panelAgent,
      setPanelAgent,
      user,
      calculateCommission,
      toggleTheme,
      // PDF Audit state
      isPdfAuditVisible,
      currentAuditId,
      showPdfAudit,
      hidePdfAudit,
      // Initialization tracking
      isInitialized,
      isAuthenticated,
      // Stage 1: Coordinator Backend Integration
      transactions,
      coordinatorData,
      isRefreshing,
      refetchCoordinatorData,
      subscribeToTransactionUpdates,
      // Stage 2: Payments Backend Integration
      paymentData,
      paymentTransactions,
      paymentHistory,
      isRefreshingPayments,
      refetchPaymentData,
      subscribeToPaymentUpdates,
      // Payment Operation Handlers (Hybrid Model)
      schedulePayouts,
      processPayment,
      updatePayoutStatus,
    }),
    [
      // Initialization tracking
      isInitialized,
      isAuthenticated,
      commissions,
      agentPlans,
      marketData,
      theme,
      activeView,
      activeCommissionId,
      modalFocus,
      panelAgent,
      user,
      toggleTheme,
      switchView,
      isPdfAuditVisible,
      currentAuditId,
      showPdfAudit,
      hidePdfAudit,
      // Stage 1 dependencies
      transactions,
      coordinatorData,
      isRefreshing,
      refetchCoordinatorData,
      subscribeToTransactionUpdates,
      // Stage 2 dependencies
      paymentData,
      paymentTransactions,
      paymentHistory,
      isRefreshingPayments,
      refetchPaymentData,
      subscribeToPaymentUpdates,
      // Payment operation handlers
      schedulePayouts,
      processPayment,
      updatePayoutStatus,
    ],
  );

  return <DashboardContext.Provider value={contextValue}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
