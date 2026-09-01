import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import type { PlanInput } from '@shared/types/plan';
import type {
  DeficitEntity,
  PlacementEntity,
  PlanEntity,
  PlannedSheetEntity,
  ShortfallEntity,
} from '../../../domain/plan';

/**
 * O plano de corte no banco. Um por projeto: `plans.project_id` é único, e
 * gerar de novo substitui o vigente — o app não guarda histórico de planos.
 *
 * Nenhuma escrita daqui passa por `touch` do projeto, e é a única exceção do
 * app. Gerar não altera o serviço; mover o carimbo do projeto faria todo plano
 * nascer desatualizado em relação a si mesmo, que é justamente o aviso que o
 * carimbo existe para dar.
 *
 * `replaceForProject` é o `DELETE` + os quatro `INSERT` em cascata como um verbo
 * só — é a escrita de uma árvore, não composição de domínios. A transação que a
 * envolve é de quem chama.
 *
 * As folhas da árvore — `PlannedSheetEntity`, `PlacementEntity`, `ShortfallEntity`
 * e `DeficitEntity` — moram em `domain/plan.ts` junto de `PlanEntity`. O que
 * `replaceForProject` recebe do renderer é o `PlanInput` de `@shared/types/plan`;
 * o que os `rowToX` daqui devolvem é a entidade.
 */

interface PlanRow {
  id: string;
  project_id: string;
  generated_at: string;
  project_updated_at: string;
  kerf_tenths_mm: number;
  trim_tenths_mm: number;
  utilization: number;
  deficit_area_tenths_mm2: number;
  equivalent_sheets: number;
  reference_length_tenths_mm: number | null;
  reference_width_tenths_mm: number | null;
}

interface PlannedSheetRow {
  id: string;
  length_tenths_mm: number;
  width_tenths_mm: number;
  utilization: number;
}

interface PlacementRow {
  label: string;
  length_tenths_mm: number;
  width_tenths_mm: number;
  x_tenths_mm: number;
  y_tenths_mm: number;
  rotated: number;
}

interface ShortfallRow {
  label: string;
  length_tenths_mm: number;
  width_tenths_mm: number;
  quantity: number;
}

/** As duas tabelas de peça que ficou de fora. O nome entra em SQL, então é constante. */
const UNPLACED_TABLE = 'unallocated_pieces';
const REJECTED_TABLE = 'rejected_pieces';

/** A fronteira snake_case → camelCase. Nenhuma chave do banco sai daqui. */
function rowToDeficit(row: PlanRow): DeficitEntity {
  return {
    areaTenthsMm2: row.deficit_area_tenths_mm2,
    referenceSheet:
      row.reference_length_tenths_mm === null || row.reference_width_tenths_mm === null
        ? null
        : {
            lengthTenthsMm: row.reference_length_tenths_mm,
            widthTenthsMm: row.reference_width_tenths_mm,
          },
    atLeastSheets: row.equivalent_sheets,
  };
}

function rowToPlacement(row: PlacementRow): PlacementEntity {
  return {
    label: row.label,
    lengthTenthsMm: row.length_tenths_mm,
    widthTenthsMm: row.width_tenths_mm,
    xTenthsMm: row.x_tenths_mm,
    yTenthsMm: row.y_tenths_mm,
    rotated: row.rotated === 1,
  };
}

function rowToShortfall(row: ShortfallRow): ShortfallEntity {
  return {
    label: row.label,
    lengthTenthsMm: row.length_tenths_mm,
    widthTenthsMm: row.width_tenths_mm,
    quantity: row.quantity,
  };
}

/**
 * As colocações de uma chapa e os dois lotes de fora saem na ordem de inserção
 * (`rowid`), que é a ordem em que o empacotador as produziu. O `id` é um uuid
 * sorteado e não ordena nada, e a ordem importa: é dela que sai o número de
 * cada peça na legenda do desenho.
 */
function listPlacements(db: Database.Database, plannedSheetId: string): PlacementEntity[] {
  const rows = db
    .prepare('SELECT * FROM placements WHERE planned_sheet_id = ? ORDER BY rowid')
    .all(plannedSheetId) as PlacementRow[];
  return rows.map(rowToPlacement);
}

function listShortfalls(db: Database.Database, table: string, planId: string): ShortfallEntity[] {
  const rows = db
    .prepare(`SELECT * FROM ${table} WHERE plan_id = ? ORDER BY rowid`)
    .all(planId) as ShortfallRow[];
  return rows.map(rowToShortfall);
}

function listPlannedSheets(db: Database.Database, planId: string): PlannedSheetEntity[] {
  const rows = db
    .prepare('SELECT * FROM planned_sheets WHERE plan_id = ? ORDER BY sheet_index')
    .all(planId) as PlannedSheetRow[];

  return rows.map((row) => ({
    lengthTenthsMm: row.length_tenths_mm,
    widthTenthsMm: row.width_tenths_mm,
    utilization: row.utilization,
    placements: listPlacements(db, row.id),
  }));
}

/**
 * A fronteira do plano. Diferente dos outros `rowToX` do app, este precisa do
 * `db`: o plano é uma árvore em quatro tabelas, e as folhas dela são parte do
 * mesmo objeto — não há `PlanEntity` sem as chapas planejadas.
 */
function rowToPlan(db: Database.Database, row: PlanRow): PlanEntity {
  return {
    id: row.id,
    projectId: row.project_id,
    generatedAt: row.generated_at,
    projectUpdatedAt: row.project_updated_at,
    kerfTenthsMm: row.kerf_tenths_mm,
    trimTenthsMm: row.trim_tenths_mm,
    utilization: row.utilization,
    sheets: listPlannedSheets(db, row.id),
    unplaced: listShortfalls(db, UNPLACED_TABLE, row.id),
    rejected: listShortfalls(db, REJECTED_TABLE, row.id),
    deficit: rowToDeficit(row),
  };
}

function insertShortfalls(
  db: Database.Database,
  table: string,
  planId: string,
  pieces: readonly ShortfallEntity[],
): void {
  const statement = db.prepare(
    `INSERT INTO ${table} (id, plan_id, label, length_tenths_mm, width_tenths_mm, quantity)
     VALUES (@id, @planId, @label, @lengthTenthsMm, @widthTenthsMm, @quantity)`,
  );
  for (const piece of pieces) statement.run({ id: randomUUID(), planId, ...piece });
}

export function makePlansRepository(db: Database.Database) {
  return {
    /**
     * O plano vigente do projeto. `null`, e não 404, porque projeto sem plano é
     * o estado normal de todo projeto recém-criado: a tela mostra o estado vazio
     * com a saída de voltar e gerar, e não um erro.
     */
    findByProject(projectId: string): PlanEntity | null {
      const row = db.prepare('SELECT * FROM plans WHERE project_id = ?').get(projectId) as
        | PlanRow
        | undefined;
      return row ? rowToPlan(db, row) : null;
    },

    /**
     * Grava o plano recém-gerado, substituindo o vigente. O `DELETE` leva as
     * chapas planejadas, as colocações e os dois lotes de fora por
     * `ON DELETE CASCADE`.
     *
     * Não abre transação e não confere se o projeto existe: quem chama envolve
     * tudo numa `repos.transaction` — de modo que uma falha no meio devolva o
     * plano anterior intacto, melhor o papel de ontem do que nenhum — e decide o
     * 404.
     */
    replaceForProject(projectId: string, input: PlanInput): PlanEntity {
      const plan: PlanEntity = {
        id: randomUUID(),
        projectId,
        generatedAt: new Date().toISOString(),
        ...input,
      };

      db.prepare('DELETE FROM plans WHERE project_id = ?').run(projectId);

      db.prepare(
        `INSERT INTO plans (id, project_id, generated_at, project_updated_at, kerf_tenths_mm,
                            trim_tenths_mm, utilization, deficit_area_tenths_mm2, equivalent_sheets,
                            reference_length_tenths_mm, reference_width_tenths_mm)
         VALUES (@id, @projectId, @generatedAt, @projectUpdatedAt, @kerfTenthsMm, @trimTenthsMm,
                 @utilization, @deficitAreaTenthsMm2, @equivalentSheets, @referenceLength,
                 @referenceWidth)`,
      ).run({
        id: plan.id,
        projectId,
        generatedAt: plan.generatedAt,
        projectUpdatedAt: plan.projectUpdatedAt,
        kerfTenthsMm: plan.kerfTenthsMm,
        trimTenthsMm: plan.trimTenthsMm,
        utilization: plan.utilization,
        deficitAreaTenthsMm2: plan.deficit.areaTenthsMm2,
        equivalentSheets: plan.deficit.atLeastSheets,
        referenceLength: plan.deficit.referenceSheet?.lengthTenthsMm ?? null,
        referenceWidth: plan.deficit.referenceSheet?.widthTenthsMm ?? null,
      });

      const insertSheet = db.prepare(
        `INSERT INTO planned_sheets (id, plan_id, sheet_index, length_tenths_mm, width_tenths_mm,
                                     utilization)
         VALUES (@id, @planId, @sheetIndex, @lengthTenthsMm, @widthTenthsMm, @utilization)`,
      );
      const insertPlacement = db.prepare(
        `INSERT INTO placements (id, planned_sheet_id, label, length_tenths_mm, width_tenths_mm,
                                 x_tenths_mm, y_tenths_mm, rotated)
         VALUES (@id, @plannedSheetId, @label, @lengthTenthsMm, @widthTenthsMm, @xTenthsMm,
                 @yTenthsMm, @rotated)`,
      );

      plan.sheets.forEach((sheet, sheetIndex) => {
        const plannedSheetId = randomUUID();
        insertSheet.run({
          id: plannedSheetId,
          planId: plan.id,
          sheetIndex,
          lengthTenthsMm: sheet.lengthTenthsMm,
          widthTenthsMm: sheet.widthTenthsMm,
          utilization: sheet.utilization,
        });

        for (const placement of sheet.placements) {
          insertPlacement.run({
            id: randomUUID(),
            plannedSheetId,
            label: placement.label,
            lengthTenthsMm: placement.lengthTenthsMm,
            widthTenthsMm: placement.widthTenthsMm,
            xTenthsMm: placement.xTenthsMm,
            yTenthsMm: placement.yTenthsMm,
            // O SQLite não tem booleano; a volta acontece no `rowToPlacement`.
            rotated: placement.rotated ? 1 : 0,
          });
        }
      });

      insertShortfalls(db, UNPLACED_TABLE, plan.id, plan.unplaced);
      insertShortfalls(db, REJECTED_TABLE, plan.id, plan.rejected);

      return plan;
    },
  };
}

export type PlansRepository = ReturnType<typeof makePlansRepository>;
