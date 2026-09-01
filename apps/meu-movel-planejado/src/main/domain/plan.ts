/**
 * O plano de corte no vocabulário do processo main: um retrato do resultado de
 * uma geração, guardado, um por projeto.
 *
 * `PlanEntity` e as suas folhas são estruturalmente idênticas a `Plan` e
 * companhia de `@shared/types/plan`; o porquê do sufixo `Entity` está em
 * `domain/project.ts`. Os nomes encurtam de propósito — a árvore já está dentro
 * de `plan.ts`, então o prefixo `Plan` de `PlanPlacement`/`PlanShortfall` só
 * repetiria o arquivo. `PlanSheet` vira `PlannedSheetEntity`, e não
 * `PlanSheetEntity`: é a "chapa planejada" do glossário, o resultado — distinta
 * da `SheetEntity` disponível de `domain/sheet.ts`, e o nome carrega essa
 * diferença.
 *
 * Nada aqui aponta para `PieceEntity` nem para `SheetEntity`: o plano copia
 * rótulo e medida. Uma peça excluída depois da geração não pode apagar a folha
 * que já está na bancada — e a identidade que o empacotador usa internamente
 * (`pieceId`, `sheetId`) não sobrevive à gravação de propósito (ticket 07).
 */

/** Uma peça no lugar em que ela cai dentro de uma chapa planejada. */
export type PlacementEntity = {
  /** O rótulo da peça na hora da geração, copiado. Vazio quando ela não tinha. */
  label: string;
  lengthTenthsMm: number;
  widthTenthsMm: number;
  xTenthsMm: number;
  yTenthsMm: number;
  /** Medidas trocadas entre si quando a peça foi girada. */
  rotated: boolean;
};

/** Uma chapa do estoque já desenhada no plano. */
export type PlannedSheetEntity = {
  lengthTenthsMm: number;
  widthTenthsMm: number;
  placements: PlacementEntity[];
  /** Fração de 0 a 1 da área útil ocupada pelas peças. */
  utilization: number;
};

/**
 * Um lote de peças que ficou fora do plano. Serve às duas listas do glossário —
 * não alocada e rejeitada —, porque o que difere entre elas é a causa, não a
 * forma.
 */
export type ShortfallEntity = {
  label: string;
  lengthTenthsMm: number;
  widthTenthsMm: number;
  quantity: number;
};

/** Quanto material falta comprar. Conta só peça não alocada (`CONTEXT.md`). */
export type DeficitEntity = {
  /** Área que falta, cada peça já acrescida do kerf que ela consome ao redor. */
  areaTenthsMm2: number;
  /** O maior formato do projeto, usado na tradução. `null` quando não havia chapa. */
  referenceSheet: { lengthTenthsMm: number; widthTenthsMm: number } | null;
  /** "Pelo menos N chapas": limite inferior, porque a conta por área ignora encaixe. */
  atLeastSheets: number;
};

export type PlanEntity = {
  id: string;
  projectId: string;
  /** Quando este plano foi gerado — a data que a tela mostra e que o papel carrega. */
  generatedAt: string;
  /** O carimbo do projeto de que este plano saiu. */
  projectUpdatedAt: string;
  kerfTenthsMm: number;
  trimTenthsMm: number;
  utilization: number;
  sheets: PlannedSheetEntity[];
  /** Caberia, mas o estoque acabou. */
  unplaced: ShortfallEntity[];
  /** Não cabe em chapa nenhuma do projeto. */
  rejected: ShortfallEntity[];
  deficit: DeficitEntity;
};
