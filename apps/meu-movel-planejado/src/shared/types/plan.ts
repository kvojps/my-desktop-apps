import type { Rectangle, RectangleBatch } from './rectangle';

/**
 * O plano de corte como ele é **guardado**: um retrato do resultado de uma
 * geração, um por projeto.
 *
 * Snapshot, não derivação. Gerar é uma ação com custo e com resultado escolhido
 * entre tentativas; recalcular a cada abertura desperdiçaria esforço e, pior,
 * poderia devolver um plano diferente daquele que já foi impresso e levado à
 * máquina.
 *
 * É por isso que nada aqui aponta para `Piece` nem para `Sheet`: o plano copia
 * rótulo e medida. Uma peça excluída depois da geração não pode apagar a folha
 * que já está na bancada — e a identidade que o empacotador usa internamente
 * (`pieceId`, `sheetId`) não sobrevive à gravação de propósito.
 */

/**
 * Uma peça no lugar em que ela cai dentro de uma chapa planejada. A origem é
 * medida do canto da **chapa**, não da área útil: é assim que o desenho a usa
 * sem somar nada, e o refile já está embutido nela.
 */
export interface PlanPlacement extends Rectangle {
  /** O rótulo da peça na hora da geração, copiado. Vazio quando ela não tinha. */
  label: string;
  xTenthsMm: number;
  yTenthsMm: number;
  /**
   * As medidas são as da peça, ou trocadas entre si quando ela foi girada — é
   * este campo que permite recuperar a medida original a partir do desenho.
   */
  rotated: boolean;
}

/**
 * Uma chapa do estoque já desenhada no plano. Uma chapa de quantidade três
 * produz até três chapas planejadas; é a posição na lista que as distingue,
 * porque o vínculo com a chapa do estoque não sobrevive ao snapshot.
 */
export interface PlanSheet extends Rectangle {
  placements: PlanPlacement[];
  /** Fração de 0 a 1 da área útil ocupada pelas peças. A sobra é o que falta para 1. */
  utilization: number;
}

/**
 * Um lote de peças que ficou fora do plano. Serve às duas listas do glossário —
 * não alocada e rejeitada —, porque o que difere entre elas é a causa, não a
 * forma.
 */
export interface PlanShortfall extends RectangleBatch {
  label: string;
}

/** Quanto material falta comprar. Conta só peça não alocada (`CONTEXT.md`). */
export interface PlanDeficit {
  /** Área que falta, cada peça já acrescida do kerf que ela consome ao redor. */
  areaTenthsMm2: number;
  /** O formato usado na tradução — o maior do projeto. `null` quando não havia chapa. */
  referenceSheet: Rectangle | null;
  /** "Pelo menos N chapas": limite inferior, porque a conta por área ignora encaixe. */
  atLeastSheets: number;
}

/**
 * O plano de corte como o main o devolve — o retrato guardado de uma geração,
 * um por projeto.
 *
 * Os dois carimbos: `generatedAt` é o relógio do main na hora de gravar;
 * `projectUpdatedAt` é o do projeto **de que este plano saiu**, e é a comparação
 * dele com o carimbo atual do projeto que diz se o papel na bancada ficou para
 * trás (`planOutdated`).
 *
 * O que o renderer manda para **gerar** é só o id do projeto: o empacotamento e
 * a montagem do plano são do main (ticket 07). Não há mais um `PlanInput` de
 * contrato — o tipo do plano pronto para gravar vive em `main/domain/plan.ts`.
 */
export interface Plan {
  id: string;
  projectId: string;
  /** Quando este plano foi gerado — a data que a tela mostra e que o papel carrega. */
  generatedAt: string;
  projectUpdatedAt: string;
  kerfTenthsMm: number;
  trimTenthsMm: number;
  /** Aproveitamento do plano: as peças colocadas sobre a área útil das chapas usadas. */
  utilization: number;
  sheets: PlanSheet[];
  /** Caberia, mas o estoque acabou. Resolve-se comprando chapa. */
  unplaced: PlanShortfall[];
  /** Não cabe em chapa nenhuma do projeto. Comprar chapa não resolve. */
  rejected: PlanShortfall[];
  deficit: PlanDeficit;
}
