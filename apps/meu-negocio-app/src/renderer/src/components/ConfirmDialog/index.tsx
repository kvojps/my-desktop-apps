import { Button, Stack, Typography } from '@mui/material';
import { AlertTriangleIcon, CheckIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  children: React.ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button onClick={onCancel} color="inherit">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} color={danger ? 'error' : 'primary'} variant="contained">
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Stack sx={{ color: danger ? 'error.main' : 'success.main', pt: 0.25 }}>
          {danger ? <AlertTriangleIcon size={20} /> : <CheckIcon size={20} />}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {children}
        </Typography>
      </Stack>
    </Modal>
  );
}
