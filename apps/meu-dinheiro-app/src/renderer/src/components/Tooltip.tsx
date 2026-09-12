import { type ReactNode, useId } from 'react';

interface TooltipProps {
  /** O texto da dica. Ela explica o que está ao lado, nunca o substitui. */
  title: string;
  /**
   * O gatilho vira alvo de foco e o ponteiro vira interrogação. É para a dica
   * que carrega informação que não está em lugar nenhum da tela — a conta de
   * uma previsão —, porque essa não pode existir só para quem tem mouse.
   */
  help?: boolean;
  children: ReactNode;
}

/**
 * Dica sobre um elemento da tela.
 *
 * Ela aparece no ponteiro **e** no teclado (`:focus-within`): uma dica que só
 * o mouse alcança é informação escondida de quem navega por Tab. O texto fica
 * sempre no DOM com `role="tooltip"` e é apontado por `aria-describedby`, de
 * modo que o leitor de tela o anuncia sem depender de hover nenhum.
 *
 * Ela não serve dentro da tabela: a faixa de rolagem horizontal recorta o que
 * sai da própria caixa, e a dica da primeira linha sairia. Lá a dica é o
 * `title` nativo, que o sistema desenha por fora da página.
 */
export function Tooltip({ title, help, children }: TooltipProps) {
  const id = useId();

  return (
    <span
      className="money-tip"
      data-help={!!help}
      tabIndex={help ? 0 : undefined}
      aria-describedby={id}
    >
      {children}
      <span role="tooltip" id={id}>
        {title}
      </span>
    </span>
  );
}
