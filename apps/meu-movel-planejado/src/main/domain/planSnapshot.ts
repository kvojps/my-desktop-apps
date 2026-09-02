/**
 * A passagem do resultado do empacotador para o plano que se grava.
 *
 * O que ela faz de essencial é **esquecer**: `pieceId` e `sheetId` não
 * atravessam, e no lugar do primeiro vai o rótulo copiado da peça. É a
 * tradução em código de "plano é snapshot, não derivação" — uma peça excluída
 * amanhã não pode apagar a folha que já foi impressa e levada à bancada.
 *
 * Pura, e em `domain/` pelo mesmo motivo do empacotador: é regra do domínio, e
 * é ela que decide o que o plano deixa de saber. Não tem React nem Electron
 * dentro.
 */
import type { CuttingPlanEntity, CuttingPlanInputEntity, NestingShortfallEntity } from './nesting';
import type { PlacementEntity, PlanInput, ShortfallEntity } from './plan';

/**
 * O plano pronto para gravar. Recebe também a entrada do empacotamento porque
 * é dela que saem os rótulos e a geometria do corte, e o carimbo de alteração
 * do projeto **de que este plano saiu** — não o de agora.
 */
export function toPlanInput(
  input: CuttingPlanInputEntity,
  plan: CuttingPlanEntity,
  projectUpdatedAt: string,
): PlanInput {
  const labels = new Map(input.pieces.map((piece) => [piece.id, piece.label]));

  return {
    projectUpdatedAt,
    kerfTenthsMm: input.kerfTenthsMm,
    trimTenthsMm: input.trimTenthsMm,
    utilization: plan.utilization,
    sheets: plan.sheets.map((sheet) => ({
      lengthTenthsMm: sheet.lengthTenthsMm,
      widthTenthsMm: sheet.widthTenthsMm,
      utilization: sheet.utilization,
      placements: sheet.placements.map((placement): PlacementEntity => ({
        // Peça que já não existe no projeto continua sem rótulo, e não com um
        // texto de erro: o desenho mostra a medida quando o rótulo é vazio.
        label: labels.get(placement.pieceId) ?? '',
        lengthTenthsMm: placement.lengthTenthsMm,
        widthTenthsMm: placement.widthTenthsMm,
        xTenthsMm: placement.xTenthsMm,
        yTenthsMm: placement.yTenthsMm,
        rotated: placement.rotated,
      })),
    })),
    unplaced: plan.unplaced.map(toShortfall),
    rejected: plan.rejected.map(toShortfall),
    deficit: {
      areaTenthsMm2: plan.deficit.areaTenthsMm2,
      referenceSheet: plan.deficit.referenceSheet,
      // `squareMeters` fica de fora: é a mesma área noutra unidade, e a tela já
      // sabe converter. Guardar as duas seria guardar a mesma verdade duas
      // vezes, com uma delas livre para envelhecer.
      atLeastSheets: plan.deficit.atLeastSheets,
    },
  };
}

/** O lote de fora sem o `pieceId`, que é a identidade que o snapshot descarta. */
function toShortfall(piece: NestingShortfallEntity): ShortfallEntity {
  return {
    label: piece.label,
    lengthTenthsMm: piece.lengthTenthsMm,
    widthTenthsMm: piece.widthTenthsMm,
    quantity: piece.quantity,
  };
}
