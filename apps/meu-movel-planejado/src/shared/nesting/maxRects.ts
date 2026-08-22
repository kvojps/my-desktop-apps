/**
 * MaxRects: a lista de retângulos livres que sustenta o empacotamento. Cada
 * colocação parte um retângulo livre nos pedaços que sobram dele, e pedaço
 * contido em outro é descartado — é isso que mantém a lista sendo o conjunto
 * dos **maiores** retângulos livres, e o que permite encaixar em qualquer
 * fresta sem restrição de guilhotina.
 *
 * O módulo não conhece unidade nem domínio: trabalha em inteiros, e o
 * empacotador é quem decide que eles são décimos de milímetro já acrescidos do
 * kerf. É implementação, e nenhum teste da feature o alcança de propósito —
 * trocar a heurística não pode quebrar teste nenhum.
 *
 * `length` corre no eixo x e `width` no eixo y, como em todo o app.
 */

export interface Rect {
  x: number;
  y: number;
  length: number;
  width: number;
}

/**
 * Os critérios de encaixe que as tentativas combinam com as ordenações de peça.
 * Todos escolhem o retângulo livre que **menos sobra** deixa; o que muda é qual
 * sobra eles olham primeiro.
 */
export type FitHeuristic = 'shortSide' | 'longSide' | 'area';

/** Onde e como a peça coube. */
export interface Fit {
  x: number;
  y: number;
  length: number;
  width: number;
  rotated: boolean;
}

/** A chapa vazia é um retângulo livre só. Área não positiva não comporta nada. */
export function createFreeList(length: number, width: number): Rect[] {
  if (length <= 0 || width <= 0) return [];
  return [{ x: 0, y: 0, length, width }];
}

/**
 * O par de sobras pelo qual a heurística ordena, ou `null` quando não cabe. O
 * segundo número é o desempate — sem ele, dois retângulos livres com a mesma
 * sobra curta seriam escolhidos pela ordem da lista, e a ordem da lista muda
 * com o histórico de cortes.
 */
function scoreFit(
  free: Rect,
  length: number,
  width: number,
  heuristic: FitHeuristic,
): [number, number] | null {
  const leftoverLength = free.length - length;
  const leftoverWidth = free.width - width;
  if (leftoverLength < 0 || leftoverWidth < 0) return null;

  const shortSide = Math.min(leftoverLength, leftoverWidth);
  const longSide = Math.max(leftoverLength, leftoverWidth);
  switch (heuristic) {
    case 'shortSide':
      return [shortSide, longSide];
    case 'longSide':
      return [longSide, shortSide];
    case 'area':
      return [free.length * free.width - length * width, shortSide];
  }
}

function isBetterScore(candidate: [number, number], best: [number, number]): boolean {
  if (candidate[0] !== best[0]) return candidate[0] < best[0];
  return candidate[1] < best[1];
}

/**
 * O melhor encaixe da peça na lista, girando-a quando isso sobra menos. Empate
 * fica com o primeiro examinado — a peça sem girar antes da girada, e o
 * retângulo livre mais antigo antes do mais novo —, que é o que torna o
 * resultado o mesmo a cada execução.
 */
export function findFit(
  free: readonly Rect[],
  length: number,
  width: number,
  heuristic: FitHeuristic,
): Fit | null {
  let best: Fit | null = null;
  let bestScore: [number, number] | null = null;

  for (const rect of free) {
    for (const rotated of [false, true]) {
      const placedLength = rotated ? width : length;
      const placedWidth = rotated ? length : width;
      const score = scoreFit(rect, placedLength, placedWidth, heuristic);
      if (score === null) continue;
      if (bestScore !== null && !isBetterScore(score, bestScore)) continue;

      best = { x: rect.x, y: rect.y, length: placedLength, width: placedWidth, rotated };
      bestScore = score;
    }
  }

  return best;
}

/** O que sobra de um retângulo livre depois de a peça ocupar parte dele. */
function split(free: Rect, used: Rect): Rect[] {
  const noOverlap =
    used.x >= free.x + free.length ||
    used.x + used.length <= free.x ||
    used.y >= free.y + free.width ||
    used.y + used.width <= free.y;
  if (noOverlap) return [free];

  const parts: Rect[] = [];
  if (used.x > free.x) {
    parts.push({ x: free.x, y: free.y, length: used.x - free.x, width: free.width });
  }
  if (used.x + used.length < free.x + free.length) {
    const x = used.x + used.length;
    parts.push({ x, y: free.y, length: free.x + free.length - x, width: free.width });
  }
  if (used.y > free.y) {
    parts.push({ x: free.x, y: free.y, length: free.length, width: used.y - free.y });
  }
  if (used.y + used.width < free.y + free.width) {
    const y = used.y + used.width;
    parts.push({ x: free.x, y, length: free.length, width: free.y + free.width - y });
  }
  return parts;
}

function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.length <= outer.x + outer.length &&
    inner.y + inner.width <= outer.y + outer.width
  );
}

/**
 * Descarta o retângulo livre contido em outro: ele não oferece nenhum encaixe
 * que o maior já não ofereça, e mantê-lo faria a lista crescer sem limite. Em
 * dois retângulos iguais sobrevive o mais antigo.
 */
function prune(rects: readonly Rect[]): Rect[] {
  return rects.filter((rect, index) =>
    rects.every((other, otherIndex) => {
      if (otherIndex === index) return true;
      if (!contains(other, rect)) return true;
      return contains(rect, other) && otherIndex > index;
    }),
  );
}

/** A lista de retângulos livres depois de a peça ocupar o seu lugar. */
export function occupy(free: readonly Rect[], used: Rect): Rect[] {
  return prune(free.flatMap((rect) => split(rect, used)));
}
