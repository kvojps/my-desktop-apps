import { type ReactNode, useEffect, useId, useRef } from 'react';
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
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const messageId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      opener.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
      cancel.current?.focus();
    }
    if (!open && element.open) element.close();
    return () => {
      if (element.open) element.close();
      opener.current?.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="negocio-dialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onClose();
      }}
      onClick={(event) => {
        if (!loading && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="negocio-dialog-header">
        <h2 id={titleId}>{title}</h2>
      </div>
      <div className="negocio-dialog-body">
        <p id={messageId} className="negocio-dialog-message">
          {message}
        </p>
      </div>
      <div className="negocio-dialog-footer">
        <Button ref={cancel} onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          tone={confirmColor === 'error' ? 'danger' : 'neutral'}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? (loadingLabel ?? `${confirmLabel}...`) : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
