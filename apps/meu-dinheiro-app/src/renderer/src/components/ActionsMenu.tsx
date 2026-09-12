import { Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/Button';
import { overlayRoot, placeOverlay } from '@/utils/overlay';

interface ActionsMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Rótulo do botão. Numa lista, diga de qual item são as ações. */
  ariaLabel?: string;
  /** "Excluir mês", "Excluir categoria" — quando o genérico não basta. */
  deleteLabel?: string;
}

interface Item {
  label: string;
  icon: ReactNode;
  danger?: boolean;
  run: () => void;
}

/**
 * As ações por linha no menu de três pontos.
 *
 * O menu é desenhado em portal e posicionado contra a janela: dentro da tabela
 * ele nasce numa caixa que rola, e um menu absoluto some recortado na última
 * linha. Seta, Home/End, Escape e Tab o operam sem ponteiro, e o foco volta ao
 * botão quando ele fecha (§5.5).
 */
export function ActionsMenu({
  onView,
  onEdit,
  onDelete,
  ariaLabel = 'Ações',
  deleteLabel = 'Excluir',
}: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const items: Item[] = [];
  if (onView) items.push({ label: 'Ver detalhes', icon: <Eye aria-hidden="true" />, run: onView });
  if (onEdit) items.push({ label: 'Editar', icon: <Pencil aria-hidden="true" />, run: onEdit });
  if (onDelete) {
    items.push({
      label: deleteLabel,
      icon: <Trash2 aria-hidden="true" />,
      danger: true,
      run: onDelete,
    });
  }

  useLayoutEffect(() => {
    if (!open || !menu.current || !trigger.current) return;
    placeOverlay(menu.current, trigger.current.getBoundingClientRect(), 'below-end');
    menu.current.querySelector<HTMLElement>('button')?.focus();
  }, [open]);

  // Clicar fora fecha sem escolher nada. O `pointerdown` do documento é o par
  // do Escape: um cobre o ponteiro, o outro o teclado.
  //
  // Rolar também fecha: o menu é posicionado contra a janela, então a faixa de
  // conteúdo deslizaria por baixo dele e ele apontaria para a linha errada.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menu.current?.contains(target) || trigger.current?.contains(target)) return;
      setOpen(false);
    }

    const close = () => setOpen(false);

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('scroll', close, true);
    };
  }, [open]);

  function close(returnFocus = true) {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }

  function run(item: Item) {
    close();
    item.run();
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(menu.current?.querySelectorAll('button') ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Tab') {
      // O menu não prende o foco: sair dele pelo Tab é sair dele.
      close(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      buttons[(index + step + buttons.length) % buttons.length]?.focus();
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      (event.key === 'Home' ? buttons[0] : buttons[buttons.length - 1])?.focus();
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
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
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
            className="money-menu"
            role="menu"
            aria-label={ariaLabel}
            onKeyDown={handleMenuKeyDown}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                data-danger={item.danger}
                onClick={() => run(item)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>,
          overlayRoot(trigger.current),
        )}
    </>
  );
}
