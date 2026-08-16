import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface DeleteMonthDialogProps {
  open: boolean;
  monthLabel: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteMonthDialog({
  open,
  monthLabel,
  deleting,
  onClose,
  onConfirm,
}: DeleteMonthDialogProps) {
  return (
    <Dialog open={open} onClose={() => !deleting && onClose()}>
      <DialogTitle>Excluir mês?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Tem certeza que deseja excluir <strong>{monthLabel}</strong>? Todas as despesas e
          pagamentos serão removidos.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>
          Cancelar
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={deleting}>
          {deleting ? 'Excluindo...' : 'Excluir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
