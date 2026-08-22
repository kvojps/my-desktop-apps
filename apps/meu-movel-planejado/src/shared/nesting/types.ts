/**
 * O contrato do empacotador: o que ele recebe do projeto e o **plano de corte
 * inteiro** que ele devolve — colocações por chapa, aproveitamento, o que ficou
 * de fora e quanto material falta comprar.
 *
 * O déficit sai de dentro dele de propósito. Calculá-lo depois criaria um
 * segundo seam justamente sobre a conta que originou o pedido do usuário.
 *
 * Toda medida aqui é décimo de milímetro inteiro, como em todo o domínio.
 */
import type { Rectangle, RectangleBatch } from '../types/rectangle';

/**
 * A peça como o empacotador a lê: o retângulo, a quantidade e a identidade que
 * volta em cada colocação. Não é `Piece` porque função pura não tem o que fazer
 * com `projectId` nem com carimbo de tempo — mas `Piece` a satisfaz, e a tela
 * passa o que já tem em mãos.
 */
export interface PackablePiece extends RectangleBatch {
  id: string;
  label: string;
}

/** A chapa como o empacotador a lê: o retângulo disponível e quantas há dele. */
export interface PackableSheet extends RectangleBatch {
  id: string;
}

/**
 * Kerf e refile entram como número, e não como `Project`: são a geometria do
 * corte, e é só dela que o empacotamento depende.
 */
export interface CuttingPlanInput {
  pieces: readonly PackablePiece[];
  sheets: readonly PackableSheet[];
  kerfTenthsMm: number;
  trimTenthsMm: number;
}

/**
 * Onde uma peça caiu dentro de uma chapa planejada. A origem é medida do canto
 * da **chapa**, não da área útil: é assim que o desenho a usa sem somar nada, e
 * o refile já está embutido nela.
 */
export interface Placement extends Rectangle {
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
export interface PlannedSheet extends Rectangle {
  sheetId: string;
  placements: Placement[];
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
export interface PieceShortfall extends RectangleBatch {
  pieceId: string;
  label: string;
}

/**
 * Quanto material falta comprar. Conta só peça **não alocada**: peça rejeitada
 * não cabe em chapa nenhuma do projeto, e somá-la aqui faria o app recomendar
 * uma compra que não resolveria nada.
 */
export interface Deficit {
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

/** O plano de corte inteiro — tudo o que o usuário vai ver do resultado. */
export interface CuttingPlan {
  sheets: PlannedSheet[];
  /** Aproveitamento do plano: as peças colocadas sobre a área útil das chapas usadas. */
  utilization: number;
  /** Caberia, mas o estoque acabou. Resolve-se comprando chapa. */
  unplaced: PieceShortfall[];
  /** Não cabe em chapa nenhuma do projeto. Comprar chapa não resolve. */
  rejected: PieceShortfall[];
  deficit: Deficit;
}
