import clsx from 'clsx';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Icon } from '@/components/icons';

interface ToastInput {
  title: string;
  description?: string;
  variant?: 'success' | 'error';
}
interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<{ show: (t: ToastInput) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

const DURATION = 6000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const show = useCallback((t: ToastInput) => {
    setToasts((list) => [...list, { ...t, id: nextId.current++ }]);
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[var(--toast-bottom,1rem)] z-[100] flex flex-col items-center gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(DURATION);

  // Fecha sozinho após 6s; pausa (e retoma de onde parou) com mouse ou foco sobre o toast.
  useEffect(() => {
    if (paused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(onDismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, onDismiss]);

  const error = toast.variant === 'error';
  return (
    <div
      className="toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-fg shadow-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span
        className={clsx(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
          error ? 'bg-danger text-white' : 'bg-primary text-on-primary',
        )}
      >
        <Icon name={error ? 'info' : 'check'} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-fg-muted">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar aviso"
        className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-muted"
      >
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}
