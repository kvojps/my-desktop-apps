/**
 * O empacotador: dadas as peças, as chapas e a geometria do corte, devolve o
 * plano inteiro — onde cada peça cai, quanto se aproveitou, o que ficou de fora
 * e quanto material falta comprar.
 *
 * É função pura: sem React, sem Electron, sem banco, sem relógio e sem
 * aleatoriedade. A mesma entrada devolve sempre o mesmo plano, que é o que
 * permite ao usuário confiar num resultado que ele já imprimiu.
 *
 * ## O kerf, sem caso especial
 *
 * Cada peça ocupa as suas medidas acrescidas de um kerf, e o empacotamento roda
 * num retângulo que é a área útil da chapa **diminuída** de um kerf. Colocada a
 * peça, a sua origem real é a origem da célula deslocada de um kerf. Esse
 * deslocamento único produz exatamente um kerf de folga em toda fronteira —
 * entre peças vizinhas e contra a borda —, sem a borda ser tratada à parte.
 *
 * ## As tentativas
 *
 * Ordenações da lista de peças combinadas com critérios de encaixe. Vence a que
 * deixa menos material de fora; empatadas nisso, a que usa menos chapas;
 * empatadas nisso, a de maior aproveitamento.
 */
// Caminho relativo, e não `@shared/`: o alias é do `tsconfig` de cada app, e a
// suíte da raiz não o resolve — quatro apps declaram o mesmo `@shared` para
// pastas diferentes. Import de tipo sobrevive porque o transform o apaga; o de
// valor quebraria em runtime.
import { tenthsMm2ToSquareMeters } from '../units/area';
import { type FitHeuristic, type Rect, createFreeList, findFit, occupy } from './maxRects';
import type {
  CuttingPlan,
  CuttingPlanInput,
  Deficit,
  PackablePiece,
  PieceShortfall,
  Placement,
  PlannedSheet,
} from './types';

/** Cada peça de um lote, individualmente, porque é uma a uma que elas caem. */
interface PieceInstance {
  pieceId: string;
  /** Posição do lote na entrada. Desempata ordenação e reagrupa o que sobrou. */
  batchIndex: number;
  lengthTenthsMm: number;
  widthTenthsMm: number;
  /** A peça em si, que é o que o aproveitamento mede. */
  areaTenthsMm2: number;
  /** O que ela custa à chapa, já com o kerf — a área do déficit. */
  costAreaTenthsMm2: number;
}

/** Cada chapa de um lote: uma chapa de quantidade três são três chapas. */
interface SheetInstance {
  sheetId: string;
  lengthTenthsMm: number;
  widthTenthsMm: number;
  /** A chapa menos o refile dos dois lados: a base do aproveitamento. */
  usableAreaTenthsMm2: number;
  /** A área útil menos um kerf em cada eixo: onde as células cabem. */
  packableLength: number;
  packableWidth: number;
}

type PieceOrdering = 'area' | 'longestSide' | 'width' | 'length';

/** Peça grande primeiro, sempre: quem fica de fora é a menor, por construção. */
const ORDERINGS: readonly PieceOrdering[] = ['area', 'longestSide', 'width', 'length'];

const HEURISTICS: readonly FitHeuristic[] = ['shortSide', 'longSide', 'area'];

/**
 * O plano de corte do projeto. É o seam da feature: tudo o que a tela mostra e
 * o banco guarda sai daqui de uma vez, o déficit inclusive.
 */
export function packCuttingPlan(input: CuttingPlanInput): CuttingPlan {
  let best = emptyPlan();
  for (const candidate of packCuttingPlanAttempts(input)) best = candidate;
  return best;
}

/**
 * A melhor tentativa até cada ponto do caminho, uma por vez. Existe para que
 * quem roda o empacotamento possa ceder o controle entre as tentativas e deixar
 * a tela repintar — o app não tem indicador circular de progresso, e o rótulo
 * do botão é o único sinal de que há trabalho acontecendo.
 *
 * O último valor é o plano: é ele que `packCuttingPlan` devolve.
 */
export function* packCuttingPlanAttempts(input: CuttingPlanInput): Generator<CuttingPlan> {
  const sheets = expandSheets(input);
  const { placeable, rejected } = classifyPieces(input, sheets);

  // A primeira tentativa vira a melhor sem passar pela comparação: o plano
  // vazio tem déficit zero, e comparar contra ele elegeria o nada sempre que
  // alguma peça ficasse de fora.
  let best = emptyPlan();
  let first = true;
  for (const ordering of ORDERINGS) {
    const ordered = [...placeable].sort(comparePieces(ordering));
    for (const heuristic of HEURISTICS) {
      const candidate = buildPlan(input, sheets, ordered, rejected, heuristic);
      if (first || isBetterPlan(candidate, best)) best = candidate;
      first = false;
      yield best;
    }
  }
}

function emptyPlan(): CuttingPlan {
  return {
    sheets: [],
    utilization: 0,
    unplaced: [],
    rejected: [],
    deficit: { areaTenthsMm2: 0, squareMeters: 0, referenceSheet: null, atLeastSheets: 0 },
  };
}

/**
 * As chapas do estoque, uma a uma e da menor para a maior: o retalho entra
 * antes da chapa inteira, para que a chapa nova sobreviva ao serviço. O
 * desempate é o lado mais longo e, depois dele, a ordem de cadastro — sem isso,
 * dois formatos de mesma área trocariam de lugar entre execuções.
 */
function expandSheets(input: CuttingPlanInput): SheetInstance[] {
  const { kerfTenthsMm, trimTenthsMm } = input;
  const formats = input.sheets.map((sheet) => {
    const usableLength = sheet.lengthTenthsMm - 2 * trimTenthsMm;
    const usableWidth = sheet.widthTenthsMm - 2 * trimTenthsMm;
    return {
      sheetId: sheet.id,
      quantity: sheet.quantity,
      lengthTenthsMm: sheet.lengthTenthsMm,
      widthTenthsMm: sheet.widthTenthsMm,
      usableAreaTenthsMm2: Math.max(0, usableLength) * Math.max(0, usableWidth),
      packableLength: usableLength - kerfTenthsMm,
      packableWidth: usableWidth - kerfTenthsMm,
    };
  });

  const ordered = formats
    .map((format, index) => ({ format, index }))
    .sort((a, b) => {
      const areaA = a.format.lengthTenthsMm * a.format.widthTenthsMm;
      const areaB = b.format.lengthTenthsMm * b.format.widthTenthsMm;
      if (areaA !== areaB) return areaA - areaB;
      const longA = Math.max(a.format.lengthTenthsMm, a.format.widthTenthsMm);
      const longB = Math.max(b.format.lengthTenthsMm, b.format.widthTenthsMm);
      if (longA !== longB) return longA - longB;
      return a.index - b.index;
    });

  const instances: SheetInstance[] = [];
  for (const { format } of ordered) {
    const { quantity, ...instance } = format;
    for (let copy = 0; copy < quantity; copy += 1) instances.push(instance);
  }
  return instances;
}

/**
 * Separa a peça que cabe em alguma chapa do projeto da que não cabe em nenhuma.
 * A segunda é **rejeitada**: comprar mais chapa não a faria caber, e contá-la
 * como falta de estoque recomendaria uma compra inútil.
 *
 * Projeto sem chapa nenhuma não rejeita nada. Não há com o que comparar a peça,
 * e comprar chapa resolve — que é a definição de peça não alocada.
 */
function classifyPieces(
  input: CuttingPlanInput,
  sheets: readonly SheetInstance[],
): { placeable: PieceInstance[]; rejected: PieceShortfall[] } {
  const { kerfTenthsMm } = input;
  const placeable: PieceInstance[] = [];
  const rejected: PieceShortfall[] = [];

  input.pieces.forEach((piece, batchIndex) => {
    if (sheets.length > 0 && !fitsAnySheet(piece, sheets, kerfTenthsMm)) {
      rejected.push(toShortfall(piece, piece.quantity));
      return;
    }
    for (let copy = 0; copy < piece.quantity; copy += 1) {
      placeable.push({
        pieceId: piece.id,
        batchIndex,
        lengthTenthsMm: piece.lengthTenthsMm,
        widthTenthsMm: piece.widthTenthsMm,
        areaTenthsMm2: piece.lengthTenthsMm * piece.widthTenthsMm,
        costAreaTenthsMm2:
          (piece.lengthTenthsMm + kerfTenthsMm) * (piece.widthTenthsMm + kerfTenthsMm),
      });
    }
  });

  return { placeable, rejected };
}

function fitsAnySheet(
  piece: PackablePiece,
  sheets: readonly SheetInstance[],
  kerfTenthsMm: number,
): boolean {
  const length = piece.lengthTenthsMm + kerfTenthsMm;
  const width = piece.widthTenthsMm + kerfTenthsMm;
  return sheets.some(
    (sheet) =>
      (length <= sheet.packableLength && width <= sheet.packableWidth) ||
      (width <= sheet.packableLength && length <= sheet.packableWidth),
  );
}

function comparePieces(ordering: PieceOrdering): (a: PieceInstance, b: PieceInstance) => number {
  const key = (piece: PieceInstance): number => {
    switch (ordering) {
      case 'area':
        return piece.areaTenthsMm2;
      case 'longestSide':
        return Math.max(piece.lengthTenthsMm, piece.widthTenthsMm);
      case 'width':
        return piece.widthTenthsMm;
      case 'length':
        return piece.lengthTenthsMm;
    }
  };
  return (a, b) => key(b) - key(a) || a.batchIndex - b.batchIndex;
}

/** Uma tentativa inteira: as chapas na ordem de consumo, até acabarem as peças. */
function buildPlan(
  input: CuttingPlanInput,
  sheets: readonly SheetInstance[],
  ordered: readonly PieceInstance[],
  rejected: readonly PieceShortfall[],
  heuristic: FitHeuristic,
): CuttingPlan {
  const planned: PlannedSheet[] = [];
  let remaining: readonly PieceInstance[] = ordered;
  let placedArea = 0;
  let usableArea = 0;

  for (const sheet of sheets) {
    if (remaining.length === 0) break;
    const filled = fillSheet(sheet, remaining, input, heuristic);
    // Chapa em que nada coube não vira chapa planejada: ela continua inteira,
    // e a sua área útil não entra no aproveitamento do plano.
    if (filled.placements.length > 0) {
      planned.push({
        sheetId: sheet.sheetId,
        lengthTenthsMm: sheet.lengthTenthsMm,
        widthTenthsMm: sheet.widthTenthsMm,
        placements: filled.placements,
        utilization: ratio(filled.placedAreaTenthsMm2, sheet.usableAreaTenthsMm2),
      });
      placedArea += filled.placedAreaTenthsMm2;
      usableArea += sheet.usableAreaTenthsMm2;
    }
    remaining = filled.leftovers;
  }

  return {
    sheets: planned,
    utilization: ratio(placedArea, usableArea),
    unplaced: groupShortfall(remaining, input.pieces),
    rejected: [...rejected],
    deficit: computeDeficit(remaining, sheets),
  };
}

/**
 * Uma chapa, do vazio até onde der. As peças entram na ordem da tentativa; a
 * que não couber segue para a chapa seguinte.
 */
function fillSheet(
  sheet: SheetInstance,
  pieces: readonly PieceInstance[],
  input: CuttingPlanInput,
  heuristic: FitHeuristic,
): { placements: Placement[]; leftovers: PieceInstance[]; placedAreaTenthsMm2: number } {
  const { kerfTenthsMm, trimTenthsMm } = input;
  let free: Rect[] = createFreeList(sheet.packableLength, sheet.packableWidth);
  const placements: Placement[] = [];
  const leftovers: PieceInstance[] = [];
  let placedAreaTenthsMm2 = 0;

  for (const piece of pieces) {
    const fit =
      free.length === 0
        ? null
        : findFit(
            free,
            piece.lengthTenthsMm + kerfTenthsMm,
            piece.widthTenthsMm + kerfTenthsMm,
            heuristic,
          );
    if (fit === null) {
      leftovers.push(piece);
      continue;
    }

    placements.push({
      pieceId: piece.pieceId,
      // A célula começa no canto da área de empacotamento; a peça começa um
      // kerf adiante dela, e é esse deslocamento que abre a folga contra a
      // borda e contra a vizinha de trás.
      xTenthsMm: trimTenthsMm + fit.x + kerfTenthsMm,
      yTenthsMm: trimTenthsMm + fit.y + kerfTenthsMm,
      lengthTenthsMm: fit.length - kerfTenthsMm,
      widthTenthsMm: fit.width - kerfTenthsMm,
      rotated: fit.rotated,
    });
    placedAreaTenthsMm2 += piece.areaTenthsMm2;
    free = occupy(free, fit);
  }

  return { placements, leftovers, placedAreaTenthsMm2 };
}

/**
 * Quanto material falta comprar, em área e traduzido em chapas do maior formato
 * do projeto. A tradução é **limite inferior**: dividir área por área ignora o
 * encaixe, e o encaixe só piora o número — por isso a tela diz "pelo menos".
 */
function computeDeficit(
  unplaced: readonly PieceInstance[],
  sheets: readonly SheetInstance[],
): Deficit {
  const areaTenthsMm2 = unplaced.reduce((total, piece) => total + piece.costAreaTenthsMm2, 0);
  const reference = largestFormat(sheets);
  const referenceArea = reference === null ? 0 : reference.packableLength * reference.packableWidth;

  return {
    areaTenthsMm2,
    squareMeters: tenthsMm2ToSquareMeters(areaTenthsMm2),
    referenceSheet:
      reference === null
        ? null
        : { lengthTenthsMm: reference.lengthTenthsMm, widthTenthsMm: reference.widthTenthsMm },
    atLeastSheets:
      areaTenthsMm2 === 0 || referenceArea === 0 ? 0 : Math.ceil(areaTenthsMm2 / referenceArea),
  };
}

/** O formato que mais peça comporta. `null` quando nenhum comporta alguma. */
function largestFormat(sheets: readonly SheetInstance[]): SheetInstance | null {
  let largest: SheetInstance | null = null;
  for (const sheet of sheets) {
    const area = sheet.packableLength * sheet.packableWidth;
    if (sheet.packableLength <= 0 || sheet.packableWidth <= 0) continue;
    if (largest === null || area > largest.packableLength * largest.packableWidth) largest = sheet;
  }
  return largest;
}

/** As instâncias que sobraram, de volta a lotes, na ordem de cadastro. */
function groupShortfall(
  instances: readonly PieceInstance[],
  pieces: readonly PackablePiece[],
): PieceShortfall[] {
  const counts = new Map<number, number>();
  for (const instance of instances) {
    counts.set(instance.batchIndex, (counts.get(instance.batchIndex) ?? 0) + 1);
  }
  return [...counts.keys()]
    .sort((a, b) => a - b)
    .map((batchIndex) => toShortfall(pieces[batchIndex], counts.get(batchIndex) ?? 0));
}

function toShortfall(piece: PackablePiece, quantity: number): PieceShortfall {
  return {
    pieceId: piece.id,
    label: piece.label,
    lengthTenthsMm: piece.lengthTenthsMm,
    widthTenthsMm: piece.widthTenthsMm,
    quantity,
  };
}

/**
 * Menos material de fora primeiro — é o número que originou o pedido do
 * usuário. Empatadas nisso, menos chapas usadas; empatadas nisso, maior
 * aproveitamento.
 */
function isBetterPlan(candidate: CuttingPlan, best: CuttingPlan): boolean {
  if (candidate.deficit.areaTenthsMm2 !== best.deficit.areaTenthsMm2) {
    return candidate.deficit.areaTenthsMm2 < best.deficit.areaTenthsMm2;
  }
  if (candidate.sheets.length !== best.sheets.length) {
    return candidate.sheets.length < best.sheets.length;
  }
  return candidate.utilization > best.utilization;
}

/** Aproveitamento sem plano é zero, não `NaN`: chapa nenhuma, nada aproveitado. */
function ratio(part: number, whole: number): number {
  return whole === 0 ? 0 : part / whole;
}
