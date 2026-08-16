import { Alert, Stack } from '@mui/material';
import type { ToastItem } from '@/contexts/ToastContext';

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <Stack
      spacing={1}
      role="status"
      aria-live="polite"
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      {toasts.map((toast) => (
        <Alert
          key={toast.id}
          severity={toast.variant}
          onClick={() => onDismiss(toast.id)}
          variant="filled"
          sx={{ cursor: 'pointer', minWidth: 280 }}
        >
          {toast.message}
        </Alert>
      ))}
    </Stack>
  );
}
