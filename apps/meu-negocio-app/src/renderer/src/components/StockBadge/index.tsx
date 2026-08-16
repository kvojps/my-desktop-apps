import { ArrowDownward, RemoveShoppingCart } from '@mui/icons-material';
import { Chip } from '@mui/material';

interface StockBadgeProps {
  stock: number;
  minStock: number;
}

/**
 * O estado do estoque é comunicado só por este chip. A quantidade ao lado fica
 * com a cor normal do texto: número vermelho + chip âmbar eram dois sinais
 * discordantes para a mesma condição.
 */
export function StockBadge({ stock, minStock }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <Chip
        size="small"
        color="error"
        icon={<RemoveShoppingCart sx={{ fontSize: 14 }} />}
        label="Sem estoque"
      />
    );
  }

  if (stock <= minStock) {
    return (
      <Chip
        size="small"
        color="warning"
        icon={<ArrowDownward sx={{ fontSize: 14 }} />}
        label="Estoque baixo"
      />
    );
  }

  return null;
}
