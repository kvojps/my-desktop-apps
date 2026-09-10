import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { ReactNode } from 'react';

/**
 * `Dialog` cru de propósito, e não `Modal`: a §3 lista os dois como primitivas
 * separadas. Uma confirmação não quer o X de fechar nem os `dividers` do Modal —
 * ela tem duas saídas, e as duas são botões do rodapé.
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  loadingLabel?: string;
  confirmColor?: 'error' | 'warning' | 'primary';
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Excluir',
  loadingLabel,
  confirmColor = 'error',
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={() => !loading && onClose()}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={loading}>
          {loading ? (loadingLabel ?? `${confirmLabel}...`) : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
