import { Alert, Snackbar } from '@mui/material';
import type { SnackbarState } from '@/contexts/SnackbarContext';

interface AppSnackbarProps {
  snackbar: SnackbarState | null;
  onClose: () => void;
}

export function AppSnackbar({ snackbar, onClose }: AppSnackbarProps) {
  return (
    <Snackbar
      open={!!snackbar}
      autoHideDuration={4000}
      onClose={onClose}
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
