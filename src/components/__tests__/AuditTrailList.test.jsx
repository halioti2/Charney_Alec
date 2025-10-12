import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AuditTrailList from '../AuditTrailList.jsx';

const events = [
  { id: '1', category: 'Approval', actor_name: 'Coordinator', created_at: '2024-09-01T10:00:00Z', action: 'Approved by Coordinator.' },
  { id: '2', category: 'Approval', actor_name: 'Broker', created_at: '2024-09-01T12:00:00Z', action: 'Final approval by Broker.' },
  { id: '3', category: 'Communication', actor_name: 'Coordinator', created_at: '2024-08-31T09:00:00Z', action: "Requested 'Wire_Instructions.pdf'." },
];

describe('AuditTrailList', () => {
  it('groups events by category and renders actor/action', () => {
    render(<AuditTrailList events={events} defaultCollapsed={false} showToggle={false} />);
    expect(screen.getAllByText(/^Approval$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Final approval by Broker/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Coordinator/).length).toBeGreaterThan(0);
  });

  it('allows collapsing and expanding categories', () => {
    render(<AuditTrailList events={events} defaultCollapsed showToggle />);
    const approvalButton = screen.getByRole('button', { name: /^Approval/i });
    expect(approvalButton).toBeTruthy();
    expect(approvalButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(approvalButton);
    expect(approvalButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Final approval by Broker/i)).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<AuditTrailList events={[]} />);
    expect(screen.getByText(/No audit events recorded yet/i)).toBeInTheDocument();
  });

  it('renders panel variant with arrow toggle', () => {
    render(<AuditTrailList events={events} defaultCollapsed variant="panel" />);
    const heading = screen.getByRole('button', { name: /approval/i });
    expect(heading).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(heading);
    expect(heading).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Final approval by Broker/i)).toBeInTheDocument();
  });
});
