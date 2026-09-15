import { type KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { placeOverlay } from '@/utils/overlay';

/**
 * O menu ou o popover nasce dentro do diálogo quando há um aberto: um `<dialog>`
 * modal fica na camada superior, e um portal no `body` cairia atrás dela.
 */
export function popupPortalTarget(): Element {
  return document.querySelector('dialog[open]') ?? document.body;
}

interface AnchoredPopupOptions {
  /** O que recebe o foco quando a camada abre. */
  focusSelector: string;
}

/**
 * A camada suspensa ancorada num gatilho — o menu de ações da linha, o menu de
 * status e o popover de período. Todos abrem a partir de um botão, são
 * posicionados na janela e somem quando o usuário clica fora ou rola a página.
 *
 * A posição é `fixed` porque a camada nasce dentro de uma célula com `overflow`,
 * onde uma camada absoluta seria cortada — e é medida uma vez, na abertura, o
 * que é a razão de rolar fechar em vez de acompanhar. A conta é a mesma da
 * dica (`utils/overlay.ts`), abaixo e alinhada à direita do gatilho.
 */
export function useAnchoredPopup({ focusSelector }: AnchoredPopupOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const popupId = useId();

  function close(returnFocus = true) {
    setIsOpen(false);
    if (returnFocus) trigger.current?.focus();
  }

  useLayoutEffect(() => {
    if (!isOpen || !popup.current || !trigger.current) return;
    placeOverlay(popup.current, trigger.current.getBoundingClientRect(), 'below-end');
    popup.current.querySelector<HTMLElement>(focusSelector)?.focus();
    // `focusSelector` é constante por chamada; incluí-lo só reabriria a conta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Fechamento que o usuário não pediu pelo teclado: devolve o foco só se ele
    // ainda estava dentro da camada. Puxá-lo de volta sempre roubaria o foco de
    // onde o usuário acabou de clicar, e faria a página rolar de volta até o
    // gatilho que ela tinha acabado de deixar para trás.
    const dismiss = () => {
      setIsOpen(false);
      if (popup.current?.contains(document.activeElement)) trigger.current?.focus();
    };
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popup.current?.contains(target) && !trigger.current?.contains(target)) dismiss();
    };
    const closeOnScroll = () => dismiss();
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [isOpen]);

  return { isOpen, setIsOpen, close, trigger, popup, popupId };
}

/**
 * A camada acima com a navegação de um menu: setas circulam pelos itens, `Home`
 * e `End` vão às pontas, `Esc` fecha devolvendo o foco e `Tab` fecha deixando o
 * foco seguir adiante.
 */
export function useMenuPopup() {
  const popupState = useAnchoredPopup({ focusSelector: 'button' });
  const { close, popup } = popupState;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(popup.current?.querySelectorAll('button') ?? []);
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

  return { ...popupState, handleKeyDown };
}
