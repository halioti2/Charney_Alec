import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  createAgentPlans,
  createMockCommissions,
  createMockStockData,
  calculateCommission,
  createMockUser,
} from '../lib/dashboardData.js';

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
