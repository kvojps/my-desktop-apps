/**
 * Acima e centralizada (dica de um valor), à direita e centralizada na
 * vertical (lateral recolhida), ou abaixo e alinhada à direita do gatilho
 * (menu e popover).
 */
export type OverlayPlacement = 'above' | 'right' | 'below-end';

export interface Box {
  width: number;
  height: number;
}

/** O retângulo do gatilho em coordenadas de janela — o que `getBoundingClientRect` devolve. */
export interface AnchorRect extends Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Vão entre o gatilho e a camada. */
const GAP = 6;
/** Respiro mínimo até a borda da janela. */
const EDGE = 8;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Onde uma camada flutuante fica em relação ao gatilho, em coordenadas de
 * janela. Pura: recebe as medidas e devolve a posição, para a conta de virar
 * de lado e de não sair da tela ser testável sem DOM.
 *
 * `above` vira para baixo quando não há espaço em cima; `below-end` vira para
 * cima quando não há espaço embaixo; `right` vira para a esquerda quando não
 * há espaço à direita. Em todos a posição final é presa dentro da janela com
 * um respiro de borda.
 */
export function resolveOverlayPosition(
  anchor: AnchorRect,
  layer: Box,
  viewport: Box,
  placement: OverlayPlacement,
): { left: number; top: number } {
  let left: number;
  let top: number;
  if (placement === 'above') {
    left = anchor.left + anchor.width / 2 - layer.width / 2;
    const above = anchor.top - layer.height - GAP;
    top = above >= EDGE ? above : anchor.bottom + GAP;
  } else if (placement === 'below-end') {
    left = anchor.right - layer.width;
    const below = anchor.bottom + GAP;
    const fitsBelow = below + layer.height <= viewport.height - EDGE;
    top = fitsBelow ? below : anchor.top - layer.height - GAP;
  } else {
    top = anchor.top + anchor.height / 2 - layer.height / 2;
    const right = anchor.right + GAP;
    const fitsRight = right + layer.width <= viewport.width - EDGE;
    left = fitsRight ? right : anchor.left - layer.width - GAP;
  }
  return {
    left: clamp(left, EDGE, viewport.width - layer.width - EDGE),
    top: clamp(top, EDGE, viewport.height - layer.height - EDGE),
  };
}

/**
 * Põe a camada ao lado do gatilho, medindo a camada já renderizada: o tamanho
 * dela depende do texto, e ele só existe montado. Posição fixa, e não
 * absoluta, porque a camada pode nascer dentro de uma faixa com `overflow` —
 * a tabela rola na horizontal e recortaria o que sai dela.
 */
export function placeOverlay(element: HTMLElement, anchor: DOMRect, placement: OverlayPlacement) {
  const box = element.getBoundingClientRect();
  const { left, top } = resolveOverlayPosition(
    anchor,
    box,
    { width: window.innerWidth, height: window.innerHeight },
    placement,
  );
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
}
