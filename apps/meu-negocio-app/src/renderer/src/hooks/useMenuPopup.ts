import { type KeyboardEvent, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

/**
 * O comportamento comum dos menus suspensos do app — o de ações da linha e o de
 * status do pedido. Os dois abrem a partir de um botão, desenham fora do fluxo,
 * andam pelas setas e devolvem o foco ao fechar; o que muda entre eles é só o
 * gatilho e a lista.
 *
 * O menu é posicionado na janela (`position: fixed`) porque ele nasce dentro de
 * uma célula com `overflow`, e ali um menu absoluto seria cortado.
 */
export function useMenuPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function close(returnFocus = true) {
    setIsOpen(false);
    if (returnFocus) trigger.current?.focus();
  }

  useLayoutEffect(() => {
    if (!isOpen || !menu.current || !trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    menu.current.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - menu.current.offsetHeight - 8)}px`;
    menu.current.style.left = `${Math.max(8, rect.right - menu.current.offsetWidth)}px`;
    menu.current.querySelector<HTMLButtonElement>('button')?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) close();
    };
    // Rolar a lista deixaria o menu parado sobre outra linha: ele fecha em vez
    // de acompanhar, porque a posição é medida uma vez, na abertura.
    const closeOnScroll = () => close();
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [isOpen]);

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

  /**
   * O menu nasce dentro do diálogo quando há um aberto: um `<dialog>` modal fica
   * na camada superior, e um portal no `body` cairia atrás dela.
   */
  function portalTarget(): Element {
    return document.querySelector('dialog[open]') ?? document.body;
  }

  return { isOpen, setIsOpen, close, trigger, menu, menuId, handleKeyDown, portalTarget };
}
