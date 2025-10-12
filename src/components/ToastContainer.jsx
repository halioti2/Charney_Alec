import { useEffect } from 'react';
import { useToast } from '../context/ToastContext.jsx';

const TOAST_TIMEOUT = 4000;

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => dismissToast(toast.id), toast.duration ?? TOAST_TIMEOUT),
    );
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, dismissToast]);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-md bg-charney-black/90 px-4 py-3 text-white shadow-lg"
        >
          <div className="flex-1 text-sm leading-5">{toast.message}</div>
          <button
            type="button"
            className="text-lg font-bold leading-none opacity-70 hover:opacity-100"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
