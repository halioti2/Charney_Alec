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

  const subscribeToTransactionUpdates = useCallback(() => {
    // Clean up existing subscriptions
    realtimeSubscriptions.forEach(sub => sub.unsubscribe());

    const transactionSub = subscribeToTransactions(() => {
      // Refresh data when transactions change
      console.log('Realtime: Transaction update detected, refetching...');
      refetchCoordinatorData();
    });

    const evidenceSub = subscribeToCommissionEvidences(() => {
      // Refresh data when commission evidences change
      console.log('Realtime: Evidence update detected, refetching...');
      refetchCoordinatorData();
    });

    setRealtimeSubscriptions([transactionSub, evidenceSub]);

    return () => {
      transactionSub.unsubscribe();
      evidenceSub.unsubscribe();
    };
  }, [refetchCoordinatorData]); // Remove realtimeSubscriptions dependency

  // Initial data fetch and subscription setup
  useEffect(() => {
    let currentSubscriptions = [];

    const setupData = async () => {
      // Initial fetch
      await refetchCoordinatorData();

      // Setup subscriptions
      const transactionSub = subscribeToTransactions(() => {
        console.log('Realtime: Transaction update detected, refetching...');
        refetchCoordinatorData();
      });

      const evidenceSub = subscribeToCommissionEvidences(() => {
        console.log('Realtime: Evidence update detected, refetching...');
        refetchCoordinatorData();
      });

      currentSubscriptions = [transactionSub, evidenceSub];
      setRealtimeSubscriptions(currentSubscriptions);
    };

    setupData();
    
    return () => {
      currentSubscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []); // Empty dependency array for initial setup only

  // Polling for coordinator data (30-60s backup)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (!isRefreshing) {
        refetchCoordinatorData();
      }
    }, 45000); // Poll every 45 seconds

    return () => clearInterval(pollInterval);
  }, [isRefreshing, refetchCoordinatorData]);

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
