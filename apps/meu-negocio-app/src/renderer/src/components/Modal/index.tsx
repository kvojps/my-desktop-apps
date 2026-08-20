import { Close } from '@mui/icons-material';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import type { BaseSyntheticEvent, ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Largura em CSS, não breakpoint do MUI. */
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
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      slotProps={{
        paper: onSubmit ? { component: 'form', onSubmit, sx: { maxWidth } } : { sx: { maxWidth } },
      }}
    >
      <DialogTitle
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
      >
        {title}
        <IconButton onClick={onClose} aria-label="Fechar" size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {footer && <DialogActions>{footer}</DialogActions>}
    </Dialog>
  );
}
