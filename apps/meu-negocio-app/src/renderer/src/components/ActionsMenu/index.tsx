import { Check, DeleteOutline, Edit, MoreVert, Replay, Visibility } from '@mui/icons-material';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';

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
        <MoreVert />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={close}>
        {onView && (
          <MenuItem onClick={() => handle(onView)}>
            <ListItemIcon>
              <Visibility sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText>Ver</ListItemText>
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem onClick={() => handle(onEdit)}>
            <ListItemIcon>
              <Edit sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        {onPayment && (
          <MenuItem onClick={() => handle(onPayment)}>
            <ListItemIcon>
              <Check sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText>Registrar pagamento</ListItemText>
          </MenuItem>
        )}
        {onReopen && (
          <MenuItem onClick={() => handle(onReopen)}>
            <ListItemIcon>
              <Replay sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText>Reabrir pedido</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => handle(onDelete)} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <DeleteOutline sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
