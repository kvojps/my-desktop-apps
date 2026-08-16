import { Close } from '@mui/icons-material';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, footer, maxWidth = '540px' }: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      slotProps={{ paper: { sx: { maxWidth } } }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
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
