import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { useEffect } from 'react';
import type { SnackbarState } from '@/contexts/SnackbarContext';

interface AppSnackbarProps {
  snackbar: SnackbarState | null;
  open: boolean;
  onClose: () => void;
  /** Avisa que a mensagem atual saiu de cena e a fila pode avançar. */
  onExited: () => void;
}

export function AppSnackbar({ snackbar, open, onClose, onExited }: AppSnackbarProps) {
  useEffect(() => {
    if (!open) {
      onExited();
      return;
    }
    const timeout = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timeout);
  }, [onClose, onExited, open, snackbar?.key]);

  const icon =
    snackbar?.severity === 'success' ? (
      <CheckCircle2 aria-hidden className="orca:size-5 orca:text-success" />
    ) : snackbar?.severity === 'error' ? (
      <CircleAlert aria-hidden className="orca:size-5 orca:text-danger" />
    ) : (
      <Info aria-hidden className="orca:size-5 orca:text-primary" />
    );

  if (!open || !snackbar) return null;

  return (
    <div className="orca:fixed orca:inset-x-4 orca:bottom-4 orca:z-50 orca:flex orca:justify-center">
      <div
        role="status"
        className="orca:flex orca:max-w-[min(32rem,calc(100vw-2rem))] orca:items-start orca:gap-3 orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:px-4 orca:py-3 orca:shadow-lg"
      >
        {icon}
        <p className="orca:m-0 orca:flex-1 orca:text-sm orca:text-foreground">{snackbar.message}</p>
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={onClose}
          className="orca-link orca:leading-none orca:text-muted-foreground"
        >
          <X aria-hidden className="orca:size-4" />
        </button>
      </div>
    </div>
  );
}
