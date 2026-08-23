import { useEffect, useMemo, useState } from 'react';

/**
 * Quanto espaço um rótulo ocupa, para o desenho saber se ele cabe dentro da
 * peça.
 *
 * "Cabe" é **medido**, e não estimado por número de caracteres: a diferença
 * entre `Lateral` e `Prateleira inferior` é grande, mas a entre `1850,0` e
 * `2750,0` é zero, e uma regra por contagem erraria as duas em sentidos
 * opostos. Quando não cabe, o desenho recua para o número da peça e quem
 * traduz o número é a legenda ao lado.
 *
 * A medida sai de um nó **do DOM**, e não de um `CanvasRenderingContext2D`, por
 * causa do `fontVariantNumeric: 'tabular-nums'` que o tema aplica no `body`
 * inteiro: dígito tabular é mais largo que o proporcional, o `<text>` do SVG
 * herda a propriedade do documento e o contexto de canvas não tem onde
 * declará-la. Metade do que se mede aqui é medida de marcenaria, então errar o
 * dígito é errar quase tudo.
 *
 * O nó fica pendurado no `body` e **não declara família nenhuma**, justamente
 * para herdar de lá o mesmo que o SVG herda. Repetir a pilha de fontes aqui
 * seria a divergência que o §6 do design system nomeia — a tipografia é do
 * tema —, e teria o efeito calado de a medida continuar certa depois de o tema
 * trocar de fonte, medindo uma fonte que a tela já não usa. O tamanho, sim, é
 * declarado: 12px é escolha deste desenho, não do `body`.
 */

/** Tamanho do rótulo dentro da peça, em pixel de tela — o `caption` do tema. */
export const LABEL_FONT_PX = 12;

/** Altura de uma linha de rótulo, em pixel de tela. */
export const LABEL_LINE_PX = LABEL_FONT_PX * 1.25;

let measureNode: HTMLSpanElement | null = null;

function getMeasureNode(): HTMLSpanElement {
  if (!measureNode) {
    measureNode = document.createElement('span');
    measureNode.setAttribute('aria-hidden', 'true');
    Object.assign(measureNode.style, {
      position: 'absolute',
      top: '0',
      left: '-9999px',
      visibility: 'hidden',
      whiteSpace: 'pre',
      pointerEvents: 'none',
      fontSize: `${LABEL_FONT_PX}px`,
    });
    document.body.appendChild(measureNode);
  }
  return measureNode;
}

/** Largura do texto em pixel de tela, na fonte e no tamanho do rótulo da peça. */
export function measureTextWidth(text: string): number {
  const node = getMeasureNode();
  node.textContent = text;
  return node.getBoundingClientRect().width;
}

function useFontsReady(): boolean {
  const [ready, setReady] = useState(() => document.fonts?.status === 'loaded');

  useEffect(() => {
    if (ready || !document.fonts) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}

export interface TextMeasure {
  /** Qual geração de fonte estas medidas enxergam. */
  fontsReady: boolean;
  measureTextWidth: (text: string) => number;
}

/**
 * A Inter é empacotada e carrega de forma assíncrona, então a primeira medida
 * sai na fonte de fallback e erra — o bastante para um rótulo entrar num
 * retângulo em que ele não caberia depois.
 *
 * O medidor é entregue como **objeto cuja identidade muda quando a fonte fica
 * pronta**, e não como um `boolean` solto ao lado da função: quem memoriza o
 * desenho depende do medidor, que ele de fato usa, e a remedição sai de graça.
 */
export function useTextMeasure(): TextMeasure {
  const fontsReady = useFontsReady();
  return useMemo(() => ({ fontsReady, measureTextWidth }), [fontsReady]);
}
