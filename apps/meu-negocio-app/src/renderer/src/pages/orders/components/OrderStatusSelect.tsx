import { Check, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { OrderStatus } from '@shared/types/order';
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABELS } from '@shared/types/order';
import { StatusChip } from '@/components/StatusChip';
import { ORDER_STATUS_ICON } from '@/components/StatusChip/statusIcons';
import { useMenuPopup } from '@/hooks/useMenuPopup';

const STATUS_OPTIONS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

interface OrderStatusSelectProps {
  value: OrderStatus;
  onChange: (next: OrderStatus) => void;
}

/**
 * O status era um `Select` de contorno completo dentro da célula: numa página
 * de dez linhas, dez molduras de input disputavam atenção com o conteúdo. Aqui
 * o próprio chip — que já carrega a cor e o ícone do estado — é o gatilho do
 * menu, e é o mesmo `StatusChip` que o resto do app usa.
 */
export function OrderStatusSelect({ value, onChange }: OrderStatusSelectProps) {
  const { isOpen, setIsOpen, close, trigger, menu, menuId, handleKeyDown, portalTarget } =
    useMenuPopup();

  function handleSelect(next: OrderStatus) {
    close();
    if (next !== value) onChange(next);
  }

  return (
    <>
      <StatusChip
        ref={trigger}
        color={ORDER_STATUS_COLOR[value]}
        icon={ORDER_STATUS_ICON[value]}
        onClick={(event) => {
          // A linha da tabela é clicável: sem isto, mudar o status abriria
          // também o detalhe do pedido.
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        ariaHasPopup="menu"
        ariaExpanded={isOpen}
        ariaControls={isOpen ? menuId : undefined}
        ariaLabel={`Status: ${ORDER_STATUS_LABELS[value]}. Clique para alterar`}
        label={
          <>
            {ORDER_STATUS_LABELS[value]}
            <ChevronDown aria-hidden="true" />
          </>
        }
      />
      {isOpen &&
        createPortal(
          <div
            ref={menu}
            id={menuId}
            className="negocio-menu"
            role="menu"
            aria-label="Alterar status do pedido"
            onKeyDown={handleKeyDown}
          >
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                role="menuitemradio"
                aria-checked={status === value}
                onClick={() => handleSelect(status)}
              >
                {/* O lugar da marca é fixo, com ou sem marca: sem isso o rótulo
                    do item escolhido ficaria deslocado dos outros. */}
                <span className="negocio-menu-mark">
                  {status === value && <Check aria-hidden="true" />}
                </span>
                {ORDER_STATUS_LABELS[status]}
              </button>
            ))}
          </div>,
          portalTarget(),
        )}
    </>
  );
}
