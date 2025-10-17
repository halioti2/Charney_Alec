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
    activeView: initialActiveView = 'broker',
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
      console.log('Fetching transactions from Supabase...');
      const rawTransactions = await fetchTransactions();
      console.log('Raw transactions:', rawTransactions);
      const transformedTransactions = transformTransactionsForUI(rawTransactions);
      console.log('Transformed transactions:', transformedTransactions);
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
      console.log('Fetching payment data from Supabase...');
      
      // Fetch commission payouts
      const rawPayouts = await fetchCommissionPayouts();
      const transformedPayouts = transformPayoutsForUI(rawPayouts);
      
      // Filter for different payment queues
      const paymentQueueData = transformedPayouts.filter(
        p => p.status === 'ready' && p.payout_amount > 0
      );
      
      const paymentHistoryData = transformedPayouts.filter(
        p => p.status === 'paid' || p.status === 'scheduled'
      );
      
      console.log('Raw payouts from Supabase:', rawPayouts);
      console.log('Transformed payouts:', transformedPayouts);
      console.log('Filtered payment queue data:', paymentQueueData);
      console.log('Filtered payment history data:', paymentHistoryData);
      
      setPaymentData(paymentQueueData);
      setPaymentHistory(paymentHistoryData);
      
      console.log('Payment queue data:', paymentQueueData);
      console.log('Payment history data:', paymentHistoryData);
    } catch (error) {
      console.error('Failed to refresh payment data:', error);
    } finally {
      setIsRefreshingPayments(false);
    }
  }, []);

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
    let currentSubscriptions = [];

    const setupData = async () => {
      console.log('Setting up initial data and subscriptions...');
      // Initial fetch for both coordinator and payments data
      await refetchCoordinatorData();
      await refetchPaymentData();

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
  }, [refetchCoordinatorData, refetchPaymentData]); // Include both dependencies

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
    }),
    [
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
