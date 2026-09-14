import { Check, Edit, Eye, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useMenuPopup } from '@/hooks/useMenuPopup';
import { Button } from './Button';

interface ActionsMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onPayment?: () => void;
  onReopen?: () => void;
  onDelete?: () => void;
  /** Rótulo do botão. Numa lista, diga de qual item são as ações. */
  ariaLabel?: string;
  /** "Excluir pedido", "Excluir produto" — quando o genérico não basta. */
  deleteLabel?: string;
}

export function ActionsMenu({
  onView,
  onEdit,
  onPayment,
  onReopen,
  onDelete,
  ariaLabel = 'Ações',
  deleteLabel = 'Excluir',
}: ActionsMenuProps) {
  const { isOpen, setIsOpen, close, trigger, menu, menuId, handleKeyDown, portalTarget } =
    useMenuPopup();

  function run(action: () => void) {
    close();
    action();
  }

  return (
    <>
      <Button
        ref={trigger}
        variant="ghost"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={(event: MouseEvent<HTMLElement>) => {
          // A linha inteira costuma ser clicável; sem isto, abrir o menu
          // abriria também o detalhe do item.
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
      >
        <MoreVertical size={18} aria-hidden="true" />
      </Button>
      {isOpen &&
        createPortal(
          <div
            ref={menu}
            id={menuId}
            className="negocio-menu"
            role="menu"
            aria-label={ariaLabel}
            onKeyDown={handleKeyDown}
          >
            {onView && (
              <button type="button" role="menuitem" onClick={() => run(onView)}>
                <Eye aria-hidden="true" />
                Ver
              </button>
            )}
            {onEdit && (
              <button type="button" role="menuitem" onClick={() => run(onEdit)}>
                <Edit aria-hidden="true" />
                Editar
              </button>
            )}
            {onPayment && (
              <button type="button" role="menuitem" onClick={() => run(onPayment)}>
                <Check aria-hidden="true" />
                Registrar pagamento
              </button>
            )}
            {onReopen && (
              <button type="button" role="menuitem" onClick={() => run(onReopen)}>
                <RotateCcw aria-hidden="true" />
                Reabrir pedido
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                role="menuitem"
                data-danger="true"
                onClick={() => run(onDelete)}
              >
                <Trash2 aria-hidden="true" />
                {deleteLabel}
              </button>
            )}
          </div>,
          portalTarget(),
        )}
    </>
  );
}
