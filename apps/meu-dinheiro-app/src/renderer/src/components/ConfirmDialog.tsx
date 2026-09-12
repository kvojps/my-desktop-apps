import { type ReactNode, useEffect, useId, useRef } from 'react';
import { Button } from '@/components/Button';

/**
 * Confirmação destrutiva. É a exceção deliberada ao `Modal` (§3.1): ela não
 * tem X de fechar nem formulário — tem duas saídas, as duas no rodapé — e
 * precisa **bloquear o fechamento** enquanto a ação corre, inclusive o Escape
 * e o clique fora.
 */
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  loadingLabel?: string;
  confirmTone?: 'danger' | 'neutral';
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
  confirmTone = 'danger',
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  // Ids por instância: a tela do Mês monta cinco confirmações ao mesmo tempo, e
  // com id literal o nome acessível de todas elas resolveria para a primeira do
  // documento — qualquer confirmação se anunciaria como "Excluir mês".
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;

    if (open && !element.open) {
      element.showModal();
      // Numa confirmação destrutiva o primeiro foco é a saída, não a ação.
      cancel.current?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="money-dialog"
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
      <div className="money-dialog-header">
        <h2 id={titleId}>{title}</h2>
      </div>
      <div className="money-dialog-body">
        <p id={messageId} className="money-dialog-message">
          {message}
        </p>
      </div>
      <div className="money-dialog-footer">
        <Button ref={cancel} onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" data-tone={confirmTone} onClick={onConfirm} disabled={loading}>
          {loading ? (loadingLabel ?? `${confirmLabel}...`) : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
