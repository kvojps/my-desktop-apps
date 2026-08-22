import { DeleteOutline, Edit, MoreVert } from '@mui/icons-material';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { MouseEvent, useState } from 'react';

interface ActionsMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  /** Rótulo do botão. Numa lista, diga de qual item são as ações. */
  ariaLabel?: string;
  /** "Editar projeto", "Editar peça" — quando o genérico não basta. */
  editLabel?: string;
  deleteLabel?: string;
}

export function ActionsMenu({
  onEdit,
  onDelete,
  ariaLabel = 'Ações',
  editLabel = 'Editar',
  deleteLabel = 'Excluir',
}: ActionsMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  function close() {
    setAnchorEl(null);
  }

  function run(action: () => void) {
    action();
    close();
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label={ariaLabel}
        onClick={(event: MouseEvent<HTMLElement>) => {
          // A linha inteira costuma ser clicável; sem isto, abrir o menu
          // abriria também o detalhe do item.
          event.stopPropagation();
          setAnchorEl(event.currentTarget);
        }}
      >
        <MoreVert />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={close} onClick={(e) => e.stopPropagation()}>
        {onEdit && (
          <MenuItem onClick={() => run(onEdit)}>
            <ListItemIcon>
              <Edit sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText>{editLabel}</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => run(onDelete)} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <DeleteOutline sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText>{deleteLabel}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
