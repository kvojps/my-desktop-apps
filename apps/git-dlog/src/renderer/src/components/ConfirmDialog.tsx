import { Dialog } from '@mui/material';
import { ReactNode } from 'react';
import { Button } from './Button';

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
  /** Roda após a transição de saída, quando o destino de foco já existe na tela. */
  onExited?: () => void;
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
  onExited,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => !loading && onClose()}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      PaperProps={{
        className:
          'orca:m-4 orca:w-full orca:max-w-md orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:shadow-lg',
      }}
      TransitionProps={{ onExited }}
    >
      <div className="orca:p-5">
        <h2
          id="confirm-dialog-title"
          className="orca:m-0 orca:text-base orca:font-semibold orca:text-foreground"
        >
          {title}
        </h2>
        <div
          id="confirm-dialog-message"
          className="orca:mt-2 orca:text-sm orca:text-muted-foreground"
        >
          {message}
        </div>
      </div>
      <div className="orca:flex orca:justify-end orca:gap-2 orca:border-t orca:border-border orca:px-5 orca:py-3">
        <Button variant="outline" onClick={onClose} disabled={loading} autoFocus>
          Cancelar
        </Button>
        <Button
          variant="primary"
          className={
            confirmColor === 'error'
              ? 'orca:bg-danger orca:hover:bg-danger'
              : confirmColor === 'warning'
                ? 'orca:bg-warning orca:text-on-warning orca:hover:bg-warning'
                : ''
          }
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (loadingLabel ?? `${confirmLabel}...`) : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
