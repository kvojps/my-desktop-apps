import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { overlayRoot, placeOverlay } from '@/utils/overlay';

interface TooltipProps {
  /** O texto da dica. Ela explica o que está ao lado, nunca o substitui. */
  title: string;
  /**
   * O gatilho vira alvo de foco e o ponteiro vira interrogação. É para a dica
   * que carrega informação que não está em lugar nenhum da tela — a conta de
   * uma previsão —, porque essa não pode existir só para quem tem mouse.
   */
  help?: boolean;
  /**
   * O texto já está no nome acessível de quem está dentro — o `aria-label` de
   * um marcador de estado, por exemplo. A dica então é só desenho, e repetir o
   * texto num `aria-describedby` faria o leitor de tela anunciá-lo duas vezes.
   */
  redundant?: boolean;
  children: ReactNode;
}

/**
 * Dica sobre um elemento da tela.
 *
 * Ela aparece no ponteiro **e** no teclado (`focus`): uma dica que só o mouse
 * alcança é informação escondida de quem navega por Tab. Quando ela é a única
 * fonte do texto, ele fica sempre no DOM e é apontado por `aria-describedby`,
 * de modo que o leitor de tela o anuncie sem depender de hover nenhum.
 *
 * A bolha é desenhada em portal e com posição fixa, e é isso que a deixa
 * funcionar dentro da tabela: a faixa que rola na horizontal recorta o que sai
 * dela, e a dica da primeira linha saía. Antes esse caso caía no `title`
 * nativo, que o sistema desenha por fora da página mas o teclado não alcança.
 */
export function Tooltip({ title, help, redundant, children }: TooltipProps) {
  const id = useId();
  const trigger = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (!open || !bubble.current || !trigger.current) return;
    placeOverlay(bubble.current, trigger.current.getBoundingClientRect(), 'above');
  }, [open, title]);

  const hide = useCallback(() => setOpen(false), []);

  // A bolha é medida contra a janela; rolar a faixa de conteúdo a deixaria
  // apontando para o lugar de onde o gatilho saiu.
  useEffect(() => {
    if (!open) return;
    document.addEventListener('scroll', hide, true);
    return () => document.removeEventListener('scroll', hide, true);
  }, [open, hide]);

  return (
    <span
      className="money-tip"
      ref={trigger}
      data-help={!!help}
      tabIndex={help ? 0 : undefined}
      aria-describedby={redundant ? undefined : id}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={hide}
      onFocus={() => setOpen(true)}
      onBlur={hide}
    >
      {children}
      {!redundant && (
        <span id={id} className="money-visually-hidden">
          {title}
        </span>
      )}
      {open &&
        createPortal(
          <span ref={bubble} className="money-tip-bubble" aria-hidden="true">
            {title}
          </span>,
          overlayRoot(trigger.current),
        )}
    </span>
  );
}
