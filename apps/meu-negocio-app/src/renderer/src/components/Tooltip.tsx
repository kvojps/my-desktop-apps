import {
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type Ref,
  cloneElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { popupPortalTarget } from '@/hooks/useAnchoredPopup';
import { type OverlayPlacement, placeOverlay } from '@/utils/overlay';

/** O que a dica precisa do gatilho: um lugar para o ref e os eventos de ponteiro, foco e teclado. */
interface TriggerProps {
  ref?: Ref<HTMLElement>;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
}

interface TooltipProps {
  /**
   * O texto da dica. Vazio desliga a dica sem desmontar o gatilho — é assim
   * que a lateral a mostra só recolhida, sem perder o foco de quem acabou de
   * recolhê-la.
   */
  title: string;
  /** Acima do gatilho por padrão; à direita para os itens da lateral recolhida. */
  placement?: OverlayPlacement;
  /** O gatilho: um elemento único, focável, que aceita ref e os eventos de ponteiro e foco. */
  children: ReactElement<TriggerProps>;
}

/**
 * Dica sobre um controle da tela, visível no ponteiro **e** no foco: uma dica
 * que só o mouse alcança é informação escondida de quem navega por Tab, e o
 * `title` nativo é exatamente isso. Escape a fecha sem tirar o foco.
 *
 * Ela é só desenho, nunca a única fonte do texto: quem a usa já carrega o mesmo
 * texto no nome acessível do gatilho (`aria-label`), então o leitor de tela
 * não precisa dela e ela não entra em `aria-describedby` — repetir o nome faria
 * anunciá-lo duas vezes.
 *
 * Os eventos e o ref vão no próprio gatilho, sem elemento em volta: um `span`
 * a mais quebraria o `>` do grupo de alternância e a coluna da lateral. A bolha
 * sai em portal, com posição fixa, para escapar de qualquer faixa com
 * `overflow` — e nasce dentro do diálogo aberto quando há um, porque a camada
 * superior dele cobre o `body`.
 */
export function Tooltip({ title, placement = 'above', children }: TooltipProps) {
  const trigger = useRef<HTMLElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const visible = open && title !== '';

  useLayoutEffect(() => {
    if (!visible || !bubble.current || !trigger.current) return;
    placeOverlay(bubble.current, trigger.current.getBoundingClientRect(), placement);
  }, [visible, title, placement]);

  const hide = useCallback(() => setOpen(false), []);

  // A bolha é medida contra a janela; rolar a faixa de conteúdo a deixaria
  // apontando para o lugar de onde o gatilho saiu.
  useEffect(() => {
    if (!visible) return;
    document.addEventListener('scroll', hide, true);
    return () => document.removeEventListener('scroll', hide, true);
  }, [visible, hide]);

  const {
    ref: childRef,
    onPointerEnter,
    onPointerLeave,
    onFocus,
    onBlur,
    onKeyDown,
  } = children.props;

  const clone = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      trigger.current = node;
      if (typeof childRef === 'function') childRef(node);
      else if (childRef) childRef.current = node;
    },
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      onPointerEnter?.(event);
      setOpen(true);
    },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      onPointerLeave?.(event);
      hide();
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      onFocus?.(event);
      setOpen(true);
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      onBlur?.(event);
      hide();
    },
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event);
      // Só quando há bolha: o Escape a fecha e para aí, sem cancelar também o
      // diálogo ou o menu em volta — uma camada por tecla.
      if (event.key === 'Escape' && visible) {
        event.preventDefault();
        event.stopPropagation();
        hide();
      }
    },
  });

  return (
    <>
      {clone}
      {visible &&
        createPortal(
          <span ref={bubble} className="negocio-tip-bubble" aria-hidden="true">
            {title}
          </span>,
          popupPortalTarget(),
        )}
    </>
  );
}
