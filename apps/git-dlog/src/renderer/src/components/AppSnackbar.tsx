import { Snackbar } from '@mui/material';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import type { SnackbarState } from '@/contexts/SnackbarContext';

interface AppSnackbarProps {
  snackbar: SnackbarState | null;
  open: boolean;
  onClose: () => void;
  /** Avisa que a mensagem atual saiu de cena e a fila pode avançar. */
  onExited: () => void;
}

export function AppSnackbar({ snackbar, open, onClose, onExited }: AppSnackbarProps) {
  const icon =
    snackbar?.severity === 'success' ? (
      <CheckCircle2 aria-hidden className="orca:size-5 orca:text-success" />
    ) : snackbar?.severity === 'error' ? (
      <CircleAlert aria-hidden className="orca:size-5 orca:text-danger" />
    ) : (
      <Info aria-hidden className="orca:size-5 orca:text-primary" />
    );

  return (
    <Snackbar
      // A key reinicia o timer a cada mensagem: sem ela, a segunda da fila
      // herdaria o tempo já corrido da primeira.
      key={snackbar?.key}
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      TransitionProps={{ onExited }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {snackbar ? (
        <div
          role="status"
          className="orca:flex orca:max-w-[min(32rem,calc(100vw-2rem))] orca:items-start orca:gap-3 orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:px-4 orca:py-3 orca:shadow-lg"
        >
          {icon}
          <p className="orca:m-0 orca:flex-1 orca:text-sm orca:text-foreground">
            {snackbar.message}
          </p>
          <button
            type="button"
            aria-label="Fechar aviso"
            onClick={onClose}
            className="orca-link orca:leading-none orca:text-muted-foreground"
          >
            <X aria-hidden className="orca:size-4" />
          </button>
        </div>
      ) : undefined}
    </Snackbar>
  );
}
