/**
 * Onde uma camada flutuante — dica, menu — se desenha.
 *
 * O `<dialog>` aberto ocupa a camada de topo do navegador, e nada do `body`
 * aparece por cima dele. Um portal fixo no `body` some atrás do diálogo, então
 * a camada procura primeiro o diálogo que a contém e só depois o `body`.
 */
export function overlayRoot(anchor: Element | null): HTMLElement {
  return anchor?.closest('dialog') ?? document.body;
}

/** Acima e centralizada (dica), ou abaixo e alinhada à direita (menu). */
export type Placement = 'above' | 'below-end';

/** Vão entre o gatilho e a camada. */
const GAP = 6;
/** Respiro mínimo até a borda da janela. */
const EDGE = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Põe a camada ao lado do gatilho, em coordenadas de janela.
 *
 * Posição fixa, e não absoluta: a tabela rola na horizontal e recorta o que sai
 * dela, e a dica da primeira linha ou o menu da última sairiam. Medir depois de
 * montar é o que permite virar de lado quando falta espaço — o tamanho da
 * camada depende do texto dela, e ele só existe renderizado.
 */
export function placeOverlay(element: HTMLElement, anchor: DOMRect, placement: Placement) {
  const box = element.getBoundingClientRect();
  const above = anchor.top - box.height - GAP;
  const below = anchor.bottom + GAP;

  const left =
    placement === 'above'
      ? anchor.left + anchor.width / 2 - box.width / 2
      : anchor.right - box.width;
  const fitsBelow = below + box.height <= window.innerHeight - EDGE;
  const top = placement === 'above' ? (above >= EDGE ? above : below) : fitsBelow ? below : above;

  element.style.left = `${clamp(left, EDGE, window.innerWidth - box.width - EDGE)}px`;
  element.style.top = `${clamp(top, EDGE, window.innerHeight - box.height - EDGE)}px`;
}
