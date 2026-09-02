import type {
  Plan,
  PlanDeficit,
  PlanPlacement,
  PlanSheet,
  PlanShortfall,
} from '@shared/types/plan';
import type {
  DeficitEntity,
  PlacementEntity,
  PlanEntity,
  PlannedSheetEntity,
  ShortfallEntity,
} from '../../domain/plan';

/**
 * `entity → response` do plano de corte (README §2.5, a travessia da saída do
 * controller). São **cinco** mappers, um por nó da árvore, porque o plano é uma
 * árvore de quatro níveis — projeto → chapa planejada → colocação, mais os dois
 * lotes de fora e o déficit. É o maior item isolado do ticket 06, análogo ao
 * `RepoScanResult` do `git-dlog`.
 *
 * Cada nó da árvore que tem entidade própria em `domain/plan.ts` ganha o seu
 * mapper; `referenceSheet`, um par de medidas anônimo dentro do déficit, atravessa
 * inline no `deficitToResponse` — dar-lhe função seria nomear uma forma que o
 * domínio não nomeia. Nada aqui é união de literais, que atravessaria por
 * atribuição. `PlanEntity` e as suas folhas são idênticas a `Plan` e companhia
 * hoje, e é por isso que os mappers precisam existir: sem eles um campo novo em
 * qualquer nó vazaria para o renderer sem decisão. `ShortfallEntity` serve
 * `unplaced` e `rejected` — o que difere entre as duas listas é a causa, não a
 * forma —, então `shortfallToResponse` é chamado para as duas.
 */

export function placementToResponse(entity: PlacementEntity): PlanPlacement {
  return {
    label: entity.label,
    lengthTenthsMm: entity.lengthTenthsMm,
    widthTenthsMm: entity.widthTenthsMm,
    xTenthsMm: entity.xTenthsMm,
    yTenthsMm: entity.yTenthsMm,
    rotated: entity.rotated,
  };
}

export function plannedSheetToResponse(entity: PlannedSheetEntity): PlanSheet {
  return {
    lengthTenthsMm: entity.lengthTenthsMm,
    widthTenthsMm: entity.widthTenthsMm,
    utilization: entity.utilization,
    placements: entity.placements.map(placementToResponse),
  };
}

export function shortfallToResponse(entity: ShortfallEntity): PlanShortfall {
  return {
    label: entity.label,
    lengthTenthsMm: entity.lengthTenthsMm,
    widthTenthsMm: entity.widthTenthsMm,
    quantity: entity.quantity,
  };
}

export function deficitToResponse(entity: DeficitEntity): PlanDeficit {
  return {
    areaTenthsMm2: entity.areaTenthsMm2,
    referenceSheet:
      entity.referenceSheet === null
        ? null
        : {
            lengthTenthsMm: entity.referenceSheet.lengthTenthsMm,
            widthTenthsMm: entity.referenceSheet.widthTenthsMm,
          },
    atLeastSheets: entity.atLeastSheets,
  };
}

export function planToResponse(entity: PlanEntity): Plan {
  return {
    id: entity.id,
    projectId: entity.projectId,
    generatedAt: entity.generatedAt,
    projectUpdatedAt: entity.projectUpdatedAt,
    kerfTenthsMm: entity.kerfTenthsMm,
    trimTenthsMm: entity.trimTenthsMm,
    utilization: entity.utilization,
    sheets: entity.sheets.map(plannedSheetToResponse),
    unplaced: entity.unplaced.map(shortfallToResponse),
    rejected: entity.rejected.map(shortfallToResponse),
    deficit: deficitToResponse(entity.deficit),
  };
}
