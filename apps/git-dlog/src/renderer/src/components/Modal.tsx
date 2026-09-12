import { type ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  /** Presente quando o conteúdo é um formulário: submete no Enter (docs/design-system.md §5.5). */
  onSubmit?: () => void;
  disableClose?: boolean;
  onExited?: () => void;
}

/**
 * Formulário e detalhe (docs/design-system.md §3.1) — no lugar de `Dialog`
 * cru. `ConfirmDialog` é a exceção deliberada, para confirmação destrutiva.
 * O elemento nativo preserva foco preso, devolve-o ao fechar e aceita `Esc`.
 */
export function Modal({
  open,
  title,
  children,
  actions,
  onClose,
  onSubmit,
  disableClose = false,
  onExited,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      className="orca-dialog orca:w-[min(32rem,calc(100vw-2rem))] orca:max-w-none orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:shadow-lg"
      onCancel={(event) => {
        if (disableClose) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClose={onExited}
      onClick={(event) => {
        if (!disableClose && event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit?.();
        }}
      >
        <div className="orca:p-5">
          <h2 id="modal-title" className="orca:m-0 orca:text-base orca:font-semibold">
            {title}
          </h2>
          <div className="orca:mt-4">{children}</div>
        </div>
        {actions && (
          <div className="orca:flex orca:justify-end orca:gap-2 orca:border-t orca:border-border orca:px-5 orca:py-3">
            {actions}
          </div>
        )}
      </form>
    </dialog>
  );
}
