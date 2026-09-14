import { ArrowDown, PackageX } from 'lucide-react';
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
    return <StatusChip color="error" icon={<PackageX aria-hidden="true" />} label="Sem estoque" />;
  }

  if (stock <= minStock) {
    return (
      <StatusChip color="warning" icon={<ArrowDown aria-hidden="true" />} label="Estoque baixo" />
    );
  }

  return null;
}
