import { describe, it, beforeEach, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardHeader from '../DashboardHeader.jsx';
import { DashboardProvider } from '../../context/DashboardContext.jsx';

const renderHeader = () =>
  render(
    <DashboardProvider>
      <DashboardHeader />
    </DashboardProvider>,
  );

describe('DashboardHeader', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('shows the mock user name', () => {
    renderHeader();
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
  });

  it('toggles theme and updates html class list', () => {
    renderHeader();
    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(toggleButton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(toggleButton);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('switches between broker and coordinator views', () => {
    renderHeader();
    const brokerButton = screen.getByRole('button', { name: /broker/i });
    const coordinatorButton = screen.getByRole('button', { name: /coordinator/i });

    expect(coordinatorButton.className).not.toContain('active');

    fireEvent.click(coordinatorButton);
    expect(coordinatorButton.className).toContain('active');
    expect(brokerButton.className).not.toContain('active');
  });
});
