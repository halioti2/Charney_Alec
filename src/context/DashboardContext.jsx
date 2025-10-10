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
    panelAgent: initialPanelAgent = null,
    notification: initialNotification = null,
    user: initialUser,
  } = initialState;

  const [commissions, setCommissions] = useState(() => initialCommissions ?? createMockCommissions());
  const [agentPlans, setAgentPlans] = useState(() => initialAgentPlans ?? createAgentPlans());
  const [marketData, setMarketData] = useState(() => initialMarketData ?? createMockStockData());
  const [theme, setTheme] = useState(() => initialTheme ?? getInitialTheme());
  const [activeView, setActiveView] = useState(initialActiveView);
  const [activeCommissionId, setActiveCommissionId] = useState(initialActiveCommissionId);
  const [panelAgent, setPanelAgent] = useState(initialPanelAgent);
  const [notification, setNotification] = useState(initialNotification);
  const [user] = useState(() => initialUser ?? createMockUser());

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
      panelAgent,
      setPanelAgent,
      notification,
      setNotification,
      user,
      calculateCommission,
      toggleTheme,
    }),
    [
      commissions,
      agentPlans,
      marketData,
      theme,
      activeView,
      activeCommissionId,
      panelAgent,
      notification,
      user,
      toggleTheme,
      switchView,
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
