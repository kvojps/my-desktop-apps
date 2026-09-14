import type { MouseEvent, ReactElement, ReactNode, Ref } from 'react';

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
  ariaExpanded?: boolean;
  ariaControls?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Estado de um registro. É o único chip de estado do app — uma cápsula colorida
 * escrita à mão é divergência, porque perde o ícone e o par de contraste medido
 * do rótulo sobre o preenchimento (§1.8).
 */
export function StatusChip({
  label,
  color,
  icon,
  onClick,
  ariaLabel,
  ariaHasPopup,
  ariaExpanded,
  ariaControls,
  ref,
}: StatusChipProps) {
  const content = (
    <>
      {icon}
      <span>{label}</span>
    </>
  );

  // Chip clicável é um botão de verdade, e não um `span` com `onClick`: é o que
  // o traz para a ordem de tabulação e faz Enter/Espaço funcionarem (§5.5).
  if (onClick) {
    return (
      <button
        ref={ref}
        type="button"
        className="negocio-chip"
        data-color={color}
        onClick={onClick}
        aria-label={ariaLabel}
        aria-haspopup={ariaHasPopup}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
      >
        {content}
      </button>
    );
  }

  return (
    <span className="negocio-chip" data-color={color} aria-label={ariaLabel}>
      {content}
    </span>
  );
}
