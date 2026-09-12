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
      ? 'ui:bg-danger ui:hover:bg-danger'
      : confirmColor === 'warning'
        ? 'ui:bg-warning ui:text-on-warning ui:hover:bg-warning'
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
      className="ui-dialog ui:w-[min(32rem,calc(100vw-2rem))] ui:max-w-none ui:rounded-lg ui:border ui:border-border ui:bg-paper ui:shadow-lg"
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
      <div className="ui:p-5">
        <h2 id="confirm-dialog-title" className="ui:m-0 ui:text-base ui:font-semibold">
          {title}
        </h2>
        <div
          id="confirm-dialog-message"
          className="ui:mt-2 ui:text-sm ui:text-muted-foreground"
        >
          {message}
        </div>
      </div>
      <div className="ui:flex ui:justify-end ui:gap-2 ui:border-t ui:border-border ui:px-5 ui:py-3">
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
