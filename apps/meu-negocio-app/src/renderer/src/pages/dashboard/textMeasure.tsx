import { useEffect, useMemo, useState } from 'react';

/**
 * O Recharts não mede o texto que ele mesmo desenha: nem o tick do eixo de
 * categoria, nem o `LabelList` na ponta da barra (§7). Quem quiser um eixo que
 * caiba no rótulo mais largo, ou uma margem direita que caiba no valor mais
 * largo, precisa medir por fora.
 *
 * Vive num módulo ao lado do `chartTheme` porque os dois gráficos de barra
 * horizontal do dashboard precisam da mesma medida: cada cópia é uma chance de
 * uma delas ficar para trás na próxima mudança de tipografia.
 */

export const TICK_LEFT_PADDING = 4;
export const TICK_BAR_GAP = 8;

/** Folga entre a ponta da barra e o valor escrito pelo `LabelList`. */
export const LABEL_BAR_GAP = 8;

/**
 * Sobra para o arredondamento do Recharts, que posiciona a barra em coordenada
 * fracionária: a margem reservada é exatamente a largura do texto, então sem
 * folga o último dígito encosta na borda do SVG e é cortado.
 */
const LABEL_SLACK = 4;

/**
 * A medida sai de um nó **do DOM**, e não de um `CanvasRenderingContext2D`, por
 * causa do `fontVariantNumeric: 'tabular-nums'` que o tema aplica no `body`
 * inteiro (§2): dígito tabular é mais largo que o proporcional, o `<text>` do
 * SVG herda a propriedade e o contexto de canvas não tem onde declará-la. Pela
 * mesma razão o peso do texto não entra na conta — em dígito tabular o avanço é
 * o mesmo em 400 e em 600.
 *
 * O nó fica pendurado no `body` justamente para herdar de lá o mesmo que o SVG
 * herda; declarar a fonte nele e esquecer a variante numérica traria o erro de
 * volta por outro caminho.
 */
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
      fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
      fontSize: '12px',
    });
    document.body.appendChild(measureNode);
  }
  return measureNode;
}

export function measureTextWidth(text: string): number {
  const node = getMeasureNode();
  node.textContent = text;
  return node.getBoundingClientRect().width;
}

/** Largura do `YAxis` de categoria: cabe o rótulo mais largo e a folga da barra. */
function getYAxisWidth(labels: string[]): number {
  if (labels.length === 0) return 0;
  const maxTextWidth = Math.max(...labels.map(measureTextWidth));
  return Math.ceil(TICK_LEFT_PADDING + maxTextWidth + TICK_BAR_GAP);
}

/** Margem direita do gráfico: cabe o valor mais largo escrito na ponta da barra. */
function getLabelMargin(labels: string[]): number {
  if (labels.length === 0) return 0;
  const maxTextWidth = Math.max(...labels.map(measureTextWidth));
  return Math.ceil(LABEL_BAR_GAP + maxTextWidth + LABEL_SLACK);
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
  getYAxisWidth: (labels: string[]) => number;
  getLabelMargin: (labels: string[]) => number;
}

/**
 * A Inter é empacotada e carrega de forma assíncrona, então o primeiro render
 * mede na fonte de fallback e erra — no caso medido, ~8% para menos, o bastante
 * para cortar o último dígito de "R$ 8.400,00".
 *
 * O medidor é entregue como **objeto cuja identidade muda quando a fonte fica
 * pronta**, e não como um `boolean` solto ao lado das funções: quem memoriza uma
 * largura depende do medidor, que ele de fato usa, e a remedição sai de graça.
 * O `boolean` solto obrigava a listar nas dependências um valor que não aparece
 * no corpo do `useMemo` — que é exatamente o que o `exhaustive-deps` acusa, e
 * ele estaria certo em acusar: dependência que ninguém lê é dependência que o
 * próximo a mexer apaga.
 *
 * Só uma remedição, e nenhum salto de layout visível: o gráfico entra junto com
 * a fonte, não depois dela.
 */
export function useTextMeasure(): TextMeasure {
  const fontsReady = useFontsReady();
  return useMemo(() => ({ fontsReady, getYAxisWidth, getLabelMargin }), [fontsReady]);
}

export function renderLeftAlignedTick(
  props: { y?: number | string; payload?: { value: string } },
  fill: string,
) {
  const { y, payload } = props;
  return (
    <text x={TICK_LEFT_PADDING} y={y} dy={4} textAnchor="start" fontSize={12} fill={fill}>
      {payload?.value}
    </text>
  );
}
