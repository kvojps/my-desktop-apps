import { Chip } from '@mui/material';
import type { MouseEvent, ReactElement, ReactNode } from 'react';

interface StatusChipProps {
  label: ReactNode;
  color: 'success' | 'warning' | 'error' | 'info' | 'default';
  /**
   * O segundo canal. Cor nunca é o único discriminador de estado (§1.7), e num
   * chip pequeno o rótulo sozinho é lido tarde demais: o ícone é o que
   * diferencia "Concluído" de "Cancelado" antes da leitura.
   */
  icon?: ReactElement;
  /**
   * Quando o próprio chip é o gatilho de um menu — é o caso do status do pedido,
   * que se altera na tabela. Um `Select` de contorno completo por linha faria dez
   * molduras de input disputarem atenção com o conteúdo.
   */
  onClick?: (event: MouseEvent<HTMLElement>) => void;
  ariaLabel?: string;
  ariaHasPopup?: 'menu';
}

/**
 * Estado de um registro. É o único chip de estado do app — `Chip` cru colorido
 * por status é divergência, porque perde o ícone e o `contrastText` medido.
 */
export function StatusChip({
  label,
  color,
  icon,
  onClick,
  ariaLabel,
  ariaHasPopup,
}: StatusChipProps) {
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      icon={icon}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-haspopup={ariaHasPopup}
    />
  );
}
