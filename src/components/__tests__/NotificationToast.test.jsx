import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationToast from '../NotificationToast.jsx';
import { DashboardProvider } from '../../context/DashboardContext.jsx';

describe('NotificationToast', () => {
  it('renders and dismisses notifications', () => {
    render(
      <DashboardProvider
        initialState={{
          commissions: [{ id: 'C1', broker: 'Agent Alpha' }],
          notification: { type: 'approve', commissionId: 'C1' },
        }}
      >
        <NotificationToast />
      </DashboardProvider>,
    );

    expect(screen.getByText(/Approved the commission/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /dismiss notification/i }));

    expect(screen.queryByText(/Approved the commission/i)).not.toBeInTheDocument();
  });
});
