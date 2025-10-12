import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToastContainer from '../ToastContainer.jsx';
import { ToastProvider, useToast } from '../../context/ToastContext.jsx';

function TriggerButton({ message }) {
  const { pushToast } = useToast();
  return (
    <button type="button" onClick={() => pushToast({ message })}>
      Push Toast
    </button>
  );
}

describe('ToastContainer', () => {
  it('renders pushed toasts and allows dismissal', () => {
    render(
      <ToastProvider>
        <TriggerButton message="Test toast" />
        <ToastContainer />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText(/Push Toast/i));
    expect(screen.getByText(/Test toast/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Dismiss notification/i));
    expect(screen.queryByText(/Test toast/i)).not.toBeInTheDocument();
  });
});
