import { Check, Edit, Eye, MoreVertical, RotateCcw, Trash2 } from 'lucide-react';
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
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
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }

  function run(action: () => void) {
    close();
    action();
  }

  useLayoutEffect(() => {
    if (!open || !menu.current || !trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    menu.current.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - menu.current.offsetHeight - 8)}px`;
    menu.current.style.left = `${Math.max(8, rect.right - menu.current.offsetWidth)}px`;
    menu.current.querySelector<HTMLButtonElement>('button')?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) close();
    };
    const closeOnScroll = () => close();
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [open]);
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(menu.current?.querySelectorAll('button') ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') close(false);
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      buttons[
        (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
      ]?.focus();
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      buttons[event.key === 'Home' ? 0 : buttons.length - 1]?.focus();
    }
  }

  return (
    <>
      <Button
        ref={trigger}
        variant="ghost"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(event: MouseEvent<HTMLElement>) => {
          // A linha inteira costuma ser clicável; sem isto, abrir o menu
          // abriria também o detalhe do item.
          event.stopPropagation();
          setOpen((current) => !current);
        }}
      >
        <MoreVertical size={18} aria-hidden="true" />
      </Button>
      {open &&
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
          document.querySelector('dialog[open]') ?? document.body,
        )}
    </>
  );
}
