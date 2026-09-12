import { ReactNode, useEffect, useRef } from 'react';
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
  /** Roda depois que o navegador restaura o foco ao controle de origem. */
  onExited?: () => void;
}

/** Confirmação destrutiva independente: bloqueia fechamento enquanto age. */
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmClass =
    confirmColor === 'error'
      ? 'orca:bg-danger orca:hover:bg-danger'
      : confirmColor === 'warning'
        ? 'orca:bg-warning orca:text-on-warning orca:hover:bg-warning'
        : '';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      className="orca-dialog orca:w-[min(32rem,calc(100vw-2rem))] orca:max-w-none orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:shadow-lg"
      onCancel={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClose={onExited}
      onClick={(event) => {
        if (!loading && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="orca:p-5">
        <h2 id="confirm-dialog-title" className="orca:m-0 orca:text-base orca:font-semibold">
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
        <Button variant="primary" className={confirmClass} onClick={onConfirm} disabled={loading}>
          {loading ? (loadingLabel ?? `${confirmLabel}...`) : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
