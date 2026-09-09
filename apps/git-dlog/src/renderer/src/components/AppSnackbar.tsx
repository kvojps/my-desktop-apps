import { Alert, Snackbar } from '@mui/material';
import type { SnackbarState } from '@/contexts/SnackbarContext';

interface AppSnackbarProps {
  snackbar: SnackbarState | null;
  open: boolean;
  onClose: () => void;
  /** Avisa que a mensagem atual saiu de cena e a fila pode avançar. */
  onExited: () => void;
}

export function AppSnackbar({ snackbar, open, onClose, onExited }: AppSnackbarProps) {
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
        <Alert severity={snackbar.severity} onClose={onClose}>
          {snackbar.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );
}
