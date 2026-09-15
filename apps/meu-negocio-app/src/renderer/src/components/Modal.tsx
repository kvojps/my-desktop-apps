import { X } from 'lucide-react';
import { type BaseSyntheticEvent, type ReactNode, useEffect, useId, useRef } from 'react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Largura em CSS. */
  maxWidth?: string;
  /**
   * Torna o papel do diálogo um `<form>`, o que faz o Enter submeter e permite
   * `type="submit"` no botão do rodapé. Sem isto não há como envolver conteúdo
   * e rodapé no mesmo formulário, porque eles moram em slots diferentes.
   *
   * A assinatura é a do `handleSubmit` do react-hook-form, que é quem sempre
   * ocupa esta prop.
   */
  onSubmit?: (event?: BaseSyntheticEvent) => unknown;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = '540px',
  onSubmit,
}: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      opener.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      element.showModal();
      element
        .querySelector<HTMLElement>(
          '.negocio-dialog-body input:not([type="hidden"]), .negocio-dialog-body select, .negocio-dialog-body textarea, .negocio-dialog-body button, .negocio-dialog-footer button',
        )
        ?.focus();
    }
    if (!open && element.open) element.close();
    return () => {
      if (element.open) element.close();
      opener.current?.focus();
    };
  }, [open]);
  const content = (
    <>
      <div className="negocio-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" aria-label="Fechar" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </Button>
      </div>
      <div className="negocio-dialog-body">{children}</div>
      {footer && <div className="negocio-dialog-footer">{footer}</div>}
    </>
  );
  return (
    <dialog
      ref={dialog}
      className="negocio-dialog"
      aria-labelledby={titleId}
      style={{ width: `min(${maxWidth}, calc(100vw - 48px))` }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {onSubmit ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(event);
          }}
        >
          {content}
        </form>
      ) : (
        content
      )}
    </dialog>
  );
}
