import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DashboardProvider, useDashboardContext } from '../DashboardContext.jsx';

describe('DashboardContext defaults', () => {
  const wrapper = ({ children }) => <DashboardProvider>{children}</DashboardProvider>;

  it('loads mock data and default state', () => {
    const { result } = renderHook(() => useDashboardContext(), { wrapper });
    expect(result.current.commissions).toHaveLength(50);
    expect(Object.keys(result.current.agentPlans)).toContain('Jessica Wong');
    expect(result.current.theme).toBe('light');
    expect(result.current.activeView).toBe('broker');
  });

  it('allows toggling theme', () => {
    const { result } = renderHook(() => useDashboardContext(), { wrapper });
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
  });

  it('switches between dashboard views', () => {
    const { result } = renderHook(() => useDashboardContext(), { wrapper });
    act(() => {
      result.current.switchView('coordinator');
    });
    expect(result.current.activeView).toBe('coordinator');
  });
});
