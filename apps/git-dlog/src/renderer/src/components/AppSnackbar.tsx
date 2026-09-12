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
      <CheckCircle2 aria-hidden className="ui:size-5 ui:text-success" />
    ) : snackbar?.severity === 'error' ? (
      <CircleAlert aria-hidden className="ui:size-5 ui:text-danger" />
    ) : (
      <Info aria-hidden className="ui:size-5 ui:text-primary" />
    );

  if (!open || !snackbar) return null;

  return (
    <div className="ui:fixed ui:inset-x-4 ui:bottom-4 ui:z-50 ui:flex ui:justify-center">
      <div
        role="status"
        className="ui:flex ui:max-w-[min(32rem,calc(100vw-2rem))] ui:items-start ui:gap-3 ui:rounded-lg ui:border ui:border-border ui:bg-paper ui:px-4 ui:py-3 ui:shadow-lg"
      >
        {icon}
        <p className="ui:m-0 ui:flex-1 ui:text-sm ui:text-foreground">{snackbar.message}</p>
        <button
          type="button"
          aria-label="Fechar aviso"
          onClick={onClose}
          className="ui-link ui:leading-none ui:text-muted-foreground"
        >
          <X aria-hidden className="ui:size-4" />
        </button>
      </div>
    </div>
  );
}
