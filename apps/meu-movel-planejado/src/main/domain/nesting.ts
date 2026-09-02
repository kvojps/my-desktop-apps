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
// Caminho relativo para `../../shared`, e não o alias de pasta compartilhada de
// cada app: esse alias é do `tsconfig` de cada app, e a suíte da raiz
// (`vitest.config.ts`) não o resolve — os quatro apps o declaram para pastas
// diferentes, e não há alias de raiz possível. Import de tipo sobrevive em
// qualquer caminho porque o transform o apaga; o de valor — `fitsPackable`,
// `packableSize`, `usableSize`, `tenthsMm2ToSquareMeters` — quebraria em
// `npm run test`, e só nele (passa no `typecheck` e no build).
import { fitsPackable, packableSize, usableSize } from '../../shared/nesting/fit';
import type { Rectangle, RectangleBatch } from '../../shared/types/rectangle';
import { tenthsMm2ToSquareMeters } from '../../shared/units/area';
import { type FitHeuristic, type Rect, createFreeList, findFit, occupy } from './maxRects';

/**
 * O contrato do empacotador: o que ele recebe do projeto e o **plano de corte
 * inteiro** que ele devolve — colocações por chapa, aproveitamento, o que ficou
 * de fora e quanto material falta comprar.
 *
 * Vivia em `shared/nesting/types.ts`; dissolveu-se nas entidades de `domain/`
 * quando o empacotador passou ao main (ticket 07) — sem arquivo à parte, porque
 * `domain/` é plana e estes são o vocabulário do empacotador. Levam o sufixo
 * `Entity` como todo tipo de `domain/` (README §2.2). O prefixo `Nesting`
 * distingue o resultado cru do empacotador — que carrega `pieceId`/`sheetId` —
 * do que se **guarda**, as entidades de `domain/plan.ts` sem identidade de
 * estoque; `Packable`, o que ele **lê** do estoque.
 *
 * O déficit sai de dentro dele de propósito. Calculá-lo depois criaria um
 * segundo seam justamente sobre a conta que originou o pedido do usuário.
 *
 * Toda medida aqui é décimo de milímetro inteiro, como em todo o domínio.
 */

/**
 * A peça como o empacotador a lê: o retângulo, a quantidade e a identidade que
 * volta em cada colocação. Não é `PieceEntity` porque função pura não tem o que
 * fazer com `projectId` nem com carimbo de tempo — mas `PieceEntity` a
 * satisfaz, e o service passa o que já tem em mãos.
 */
export interface PackablePieceEntity extends RectangleBatch {
  id: string;
  label: string;
}

/** A chapa como o empacotador a lê: o retângulo disponível e quantas há dele. */
export interface PackableSheetEntity extends RectangleBatch {
  id: string;
}

/**
 * Kerf e refile entram como número, e não como `ProjectEntity`: são a geometria
 * do corte, e é só dela que o empacotamento depende.
 */
export interface CuttingPlanInputEntity {
  pieces: readonly PackablePieceEntity[];
  sheets: readonly PackableSheetEntity[];
  kerfTenthsMm: number;
  trimTenthsMm: number;
}

/**
 * Onde uma peça caiu dentro de uma chapa planejada. A origem é medida do canto
 * da **chapa**, não da área útil: é assim que o desenho a usa sem somar nada, e
 * o refile já está embutido nela.
 */
export interface NestingPlacementEntity extends Rectangle {
  pieceId: string;
  xTenthsMm: number;
  yTenthsMm: number;
  /** As medidas são as da peça, ou trocadas entre si quando ela foi girada. */
  rotated: boolean;
}

/**
 * Uma chapa do estoque já desenhada no plano. Uma chapa de quantidade três
 * produz até três chapas planejadas, todas com o mesmo `sheetId` — é a posição
 * na lista que as distingue.
 *
 * Chapa em que nada coube não vira chapa planejada: ela continua inteira na
 * parede.
 */
export interface NestingSheetEntity extends Rectangle {
  sheetId: string;
  placements: NestingPlacementEntity[];
  /**
   * Fração de 0 a 1 da área útil ocupada pelas peças em si, sem o kerf que cada
   * uma consome ao redor. A sobra é o que falta para 1.
   */
  utilization: number;
}

/**
 * Um lote de peças que ficou fora do plano: quantas instâncias ficaram, e de
 * qual peça. Serve às duas listas do glossário — não alocada e rejeitada —,
 * porque o que difere entre elas é a causa, não a forma.
 */
export interface NestingShortfallEntity extends RectangleBatch {
  pieceId: string;
  label: string;
}

/**
 * Quanto material falta comprar. Conta só peça **não alocada**: peça rejeitada
 * não cabe em chapa nenhuma do projeto, e somá-la aqui faria o app recomendar
 * uma compra que não resolveria nada.
 */
export interface NestingDeficitEntity {
  /** Área que falta, cada peça já acrescida do kerf que ela consome ao redor. */
  areaTenthsMm2: number;
  /** A mesma área em m², que é a unidade em que o marceneiro pensa a compra. */
  squareMeters: number;
  /** O maior formato do projeto, base da tradução. `null` quando não há chapa. */
  referenceSheet: Rectangle | null;
  /**
   * "Pelo menos N chapas". É **limite inferior**, e não a conta: dividir área
   * por área ignora encaixe, e o encaixe só pode piorar o número. Zero quando
   * não há déficit ou quando não há formato de chapa para comparar.
   */
  atLeastSheets: number;
}

/**
 * O plano de corte inteiro, como o empacotador o devolve. Difere de `PlanEntity`
 * de `domain/plan.ts`: as colocações e chapas daqui carregam `pieceId`/`sheetId`,
 * e é `planSnapshot` quem os descarta — "plano é snapshot, não derivação"
 * (README §2.5).
 */
export interface CuttingPlanEntity {
  sheets: NestingSheetEntity[];
  /** Aproveitamento do plano: as peças colocadas sobre a área útil das chapas usadas. */
  utilization: number;
  /** Caberia, mas o estoque acabou. Resolve-se comprando chapa. */
  unplaced: NestingShortfallEntity[];
  /** Não cabe em chapa nenhuma do projeto. Comprar chapa não resolve. */
  rejected: NestingShortfallEntity[];
  deficit: NestingDeficitEntity;
}

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
  /** A área útil menos um kerf em cada eixo: onde as células cabem (`fit.ts`). */
  packable: Rectangle;
}

type PieceOrdering = 'area' | 'longestSide' | 'width' | 'length';

/** Peça grande primeiro, sempre: quem fica de fora é a menor, por construção. */
const ORDERINGS: readonly PieceOrdering[] = ['area', 'longestSide', 'width', 'length'];

const HEURISTICS: readonly FitHeuristic[] = ['shortSide', 'longSide', 'area'];

/**
 * O plano de corte do projeto. É o seam da feature: tudo o que a tela mostra e
 * o banco guarda sai daqui de uma vez, o déficit inclusive.
 *
 * O laço das doze tentativas (quatro ordenações × três heurísticas) roda inteiro
 * aqui dentro. No renderer ele era um gerador que cedia o controle entre uma
 * tentativa e outra para o rótulo do botão repintar; no main não há tela a quem
 * ceder, e a medição do ticket 01 (`< 500 ms` no pior caso realista) diz que não
 * precisa — o que atravessa o IPC é um plano só (ADR-0003).
 */
export function packCuttingPlan(input: CuttingPlanInputEntity): CuttingPlanEntity {
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
    }
  }
  return best;
}

function emptyPlan(): CuttingPlanEntity {
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
function expandSheets(input: CuttingPlanInputEntity): SheetInstance[] {
  const formats = input.sheets.map((sheet) => {
    const usable = usableSize(sheet, input.trimTenthsMm);
    return {
      sheetId: sheet.id,
      quantity: sheet.quantity,
      lengthTenthsMm: sheet.lengthTenthsMm,
      widthTenthsMm: sheet.widthTenthsMm,
      usableAreaTenthsMm2: usable.lengthTenthsMm * usable.widthTenthsMm,
      packable: packableSize(sheet, input),
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
  input: CuttingPlanInputEntity,
  sheets: readonly SheetInstance[],
): { placeable: PieceInstance[]; rejected: NestingShortfallEntity[] } {
  const { kerfTenthsMm } = input;
  const placeable: PieceInstance[] = [];
  const rejected: NestingShortfallEntity[] = [];

  input.pieces.forEach((piece, batchIndex) => {
    if (sheets.length > 0 && !fitsSomeInstance(piece, sheets, kerfTenthsMm)) {
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

/**
 * A régua da rejeição, aplicada às chapas já expandidas. É a mesma de
 * `fitsAnySheet`, que o cadastro consulta — o que muda é só que aqui o
 * retângulo de empacotamento já foi calculado uma vez para todas as peças.
 */
function fitsSomeInstance(
  piece: PackablePieceEntity,
  sheets: readonly SheetInstance[],
  kerfTenthsMm: number,
): boolean {
  return sheets.some((sheet) => fitsPackable(piece, sheet.packable, kerfTenthsMm));
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
  input: CuttingPlanInputEntity,
  sheets: readonly SheetInstance[],
  ordered: readonly PieceInstance[],
  rejected: readonly NestingShortfallEntity[],
  heuristic: FitHeuristic,
): CuttingPlanEntity {
  const planned: NestingSheetEntity[] = [];
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
  input: CuttingPlanInputEntity,
  heuristic: FitHeuristic,
): {
  placements: NestingPlacementEntity[];
  leftovers: PieceInstance[];
  placedAreaTenthsMm2: number;
} {
  const { kerfTenthsMm, trimTenthsMm } = input;
  let free: Rect[] = createFreeList(sheet.packable.lengthTenthsMm, sheet.packable.widthTenthsMm);
  const placements: NestingPlacementEntity[] = [];
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
): NestingDeficitEntity {
  const areaTenthsMm2 = unplaced.reduce((total, piece) => total + piece.costAreaTenthsMm2, 0);
  const reference = largestFormat(sheets);
  const referenceArea = reference === null ? 0 : packableArea(reference);

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
    if (sheet.packable.lengthTenthsMm <= 0 || sheet.packable.widthTenthsMm <= 0) continue;
    if (largest === null || packableArea(sheet) > packableArea(largest)) largest = sheet;
  }
  return largest;
}

/** A área em que o formato de fato empacota — o divisor da chapa equivalente. */
function packableArea(sheet: SheetInstance): number {
  return sheet.packable.lengthTenthsMm * sheet.packable.widthTenthsMm;
}

/** As instâncias que sobraram, de volta a lotes, na ordem de cadastro. */
function groupShortfall(
  instances: readonly PieceInstance[],
  pieces: readonly PackablePieceEntity[],
): NestingShortfallEntity[] {
  const counts = new Map<number, number>();
  for (const instance of instances) {
    counts.set(instance.batchIndex, (counts.get(instance.batchIndex) ?? 0) + 1);
  }
  return [...counts.keys()]
    .sort((a, b) => a - b)
    .map((batchIndex) => toShortfall(pieces[batchIndex], counts.get(batchIndex) ?? 0));
}

function toShortfall(piece: PackablePieceEntity, quantity: number): NestingShortfallEntity {
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
function isBetterPlan(candidate: CuttingPlanEntity, best: CuttingPlanEntity): boolean {
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
