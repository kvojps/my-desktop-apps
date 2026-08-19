import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
  /** Presente quando o conteúdo é um formulário: submete no Enter (docs/design-system.md §5.5). */
  onSubmit?: () => void;
}

/**
 * Formulário e detalhe (docs/design-system.md §3.1) — no lugar de `Dialog`
 * cru. `ConfirmDialog` é a exceção deliberada, para confirmação destrutiva.
 * Foco preso e devolvido ao fechar, e fecha no `Esc`, são o default do MUI
 * `Dialog`.
 */
export function Modal({ open, title, children, actions, onClose, onSubmit }: ModalProps) {
  const content = (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      {actions && <DialogActions>{actions}</DialogActions>}
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {onSubmit ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {content}
        </form>
      ) : (
        content
      )}
    </Dialog>
  );
}
