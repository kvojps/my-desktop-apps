import { ArrowDownward, RemoveShoppingCart } from '@mui/icons-material';
import { StatusChip } from '@/components/StatusChip';

interface StockBadgeProps {
  stock: number;
  minStock: number;
}

/**
 * O estado do estoque é comunicado só por este chip. A quantidade ao lado fica
 * com a cor normal do texto: número vermelho + chip âmbar eram dois sinais
 * discordantes para a mesma condição.
 *
 * Estoque saudável não rende chip nenhum — a ausência é a informação, e um
 * "Em dia" verde em cada linha da tabela gastaria a cor que os outros dois
 * estados precisam para saltar.
 */
export function StockBadge({ stock, minStock }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <StatusChip
        color="error"
        icon={<RemoveShoppingCart sx={{ fontSize: 14 }} />}
        label="Sem estoque"
      />
    );
  }

  if (stock <= minStock) {
    return (
      <StatusChip
        color="warning"
        icon={<ArrowDownward sx={{ fontSize: 14 }} />}
        label="Estoque baixo"
      />
    );
  }

  return null;
}
