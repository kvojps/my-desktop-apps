import { X } from 'lucide-react';
import { type BaseSyntheticEvent, type ReactNode, useEffect, useId, useRef } from 'react';
import { Button } from '@/components/Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Largura máxima em CSS, quando o formulário pede mais do que o padrão. */
  maxWidth?: string;
  /**
   * Torna o corpo do diálogo um `<form>`, o que faz o Enter submeter e permite
   * `type="submit"` no botão do rodapé. Sem isto não há como envolver conteúdo
   * e rodapé no mesmo formulário, porque eles moram em linhas diferentes.
   *
   * A assinatura é a do `handleSubmit` do react-hook-form, que é quem sempre
   * ocupa esta prop.
   */
  onSubmit?: (event?: BaseSyntheticEvent) => unknown;
}

/**
 * Formulário e detalhe (§3.1) — no lugar de um diálogo montado à mão.
 * `ConfirmDialog` é a exceção deliberada, para confirmação destrutiva.
 *
 * O elemento nativo é o que dá de graça o que a §5.5 exige: foco preso
 * enquanto aberto, foco devolvido ao gatilho ao fechar e Escape. O que ele
 * **não** dá é o primeiro foco onde interessa — sozinho ele para no primeiro
 * focável do DOM, que aqui é o X do cabeçalho —, então o primeiro campo do
 * corpo é focado explicitamente ao abrir.
 */
export function Modal({ open, onClose, title, children, footer, maxWidth, onSubmit }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;

    if (open && !element.open) {
      element.showModal();
      focusFirstField(element);
    }
    if (!open && element.open) element.close();
  }, [open]);

  const content = (
    <>
      <div className="money-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <Button variant="ghost" aria-label="Fechar" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </Button>
      </div>
      <div className="money-dialog-body">{children}</div>
      {footer && <div className="money-dialog-footer">{footer}</div>}
    </>
  );

  return (
    <dialog
      ref={dialog}
      className="money-dialog"
      aria-labelledby={titleId}
      style={maxWidth ? { width: `min(${maxWidth}, calc(100vw - 48px))` } : undefined}
      // O Escape fecha o diálogo por conta do navegador; sem isto o estado da
      // tela continuaria achando que ele está aberto e ele não reabriria.
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

const FIELD_SELECTOR = 'input:not([type="hidden"]), select, textarea, button, [href]';

/**
 * O primeiro campo do corpo, ou o que houver de focável depois dele. Quem abre
 * um formulário quer digitar, não fechar.
 */
function focusFirstField(element: HTMLDialogElement) {
  const body = element.querySelector('.money-dialog-body');
  const first =
    body?.querySelector<HTMLElement>(FIELD_SELECTOR) ??
    element.querySelector<HTMLElement>('.money-dialog-footer button');
  first?.focus();
}
