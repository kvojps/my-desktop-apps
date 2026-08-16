import { Check, ExpandMore } from '@mui/icons-material';
import { Box, Chip, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { useState } from 'react';
import type { OrderStatus } from '@shared/types/order';
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABELS } from '@shared/types/order';

const STATUS_OPTIONS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

interface OrderStatusSelectProps {
  value: OrderStatus;
  onChange: (next: OrderStatus) => void;
}

/**
 * O status era um `Select` de contorno completo dentro da célula: numa página
 * de dez linhas, dez molduras de input disputavam atenção com o conteúdo. Aqui
 * o próprio chip — que já carrega a cor do estado — é o gatilho do menu.
 */
export function OrderStatusSelect({ value, onChange }: OrderStatusSelectProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  function handleSelect(next: OrderStatus) {
    setAnchorEl(null);
    if (next !== value) onChange(next);
  }

  return (
    <>
      <Chip
        size="small"
        color={ORDER_STATUS_COLOR[value]}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-haspopup="menu"
        aria-label={`Status: ${ORDER_STATUS_LABELS[value]}. Clique para alterar`}
        label={
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
            {ORDER_STATUS_LABELS[value]}
            <ExpandMore sx={{ fontSize: 16, mr: -0.5 }} />
          </Box>
        }
      />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {STATUS_OPTIONS.map((status) => (
          <MenuItem key={status} selected={status === value} onClick={() => handleSelect(status)}>
            <ListItemIcon>{status === value && <Check fontSize="small" />}</ListItemIcon>
            <ListItemText>{ORDER_STATUS_LABELS[status]}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
