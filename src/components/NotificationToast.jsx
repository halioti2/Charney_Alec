import { useEffect } from 'react';
import { useDashboardContext } from '../context/DashboardContext.jsx';

const TOAST_TIMEOUT = 4000;

function buildMessage(notification, commission) {
  const agentLabel = commission?.broker ?? 'the agent';
  switch (notification.type) {
    case 'approve':
      return `Approved the commission for ${agentLabel}.`;
    case 'request-info':
      return `Requested additional information from ${agentLabel}.`;
    case 'flag':
      return `Flagged ${agentLabel}'s commission for review.`;
    default:
      return notification.message ?? 'Action completed.';
  }
}

export default function NotificationToast() {
  const { notification, setNotification, commissions } = useDashboardContext();

  useEffect(() => {
    if (!notification) return undefined;
    const timeout = setTimeout(() => setNotification(null), TOAST_TIMEOUT);
    return () => clearTimeout(timeout);
  }, [notification, setNotification]);

  if (!notification) return null;

  const commission = commissions.find((entry) => entry.id === notification.commissionId);
  const message = buildMessage(notification, commission);

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex max-w-sm animate-fade-in items-start gap-3 rounded-md bg-charney-black/90 px-4 py-3 text-white shadow-lg">
      <div className="pointer-events-auto flex-1 text-sm leading-5">{message}</div>
      <button
        type="button"
        className="pointer-events-auto text-lg font-bold leading-none opacity-70 hover:opacity-100"
        onClick={() => setNotification(null)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
