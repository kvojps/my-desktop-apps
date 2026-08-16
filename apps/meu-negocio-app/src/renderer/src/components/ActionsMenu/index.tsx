import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import {
  CheckIcon,
  DeleteIcon,
  EditIcon,
  OptionsIcon,
  ReopenIcon,
  ViewIcon,
} from '@/components/Icons';

interface ActionsMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onPayment?: () => void;
  onReopen?: () => void;
  onDelete?: () => void;
}

export function ActionsMenu({ onView, onEdit, onPayment, onReopen, onDelete }: ActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  function close() {
    setAnchorEl(null);
  }

  function handle(action: () => void) {
    action();
    close();
  }

  return (
    <>
      <IconButton size="small" aria-label="Ações" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <OptionsIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={close}>
        {onView && (
          <MenuItem onClick={() => handle(onView)}>
            <ListItemIcon>
              <ViewIcon size={16} />
            </ListItemIcon>
            <ListItemText>Ver</ListItemText>
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => handle(onEdit)}>
            <ListItemIcon>
              <EditIcon size={16} />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        {onPayment && (
          <MenuItem onClick={() => handle(onPayment)}>
            <ListItemIcon>
              <CheckIcon size={16} />
            </ListItemIcon>
            <ListItemText>Registrar pagamento</ListItemText>
          </MenuItem>
        )}
        {onReopen && (
          <MenuItem onClick={() => handle(onReopen)}>
            <ListItemIcon>
              <ReopenIcon size={16} />
            </ListItemIcon>
            <ListItemText>Reabrir pedido</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => handle(onDelete)} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <DeleteIcon size={16} />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
