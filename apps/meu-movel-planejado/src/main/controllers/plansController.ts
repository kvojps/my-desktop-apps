import type { ExportResult } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Plan } from '@shared/types/plan';
import type { PlansService } from '../services/plansService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { pngBytesSchema } from './schemas/export.schema';
import { windowFor } from './windowFor';

/**
 * O plano de corte: o vigente do projeto, gerar um novo, imprimir e exportar
 * como PNG ou PDF. A orquestração — empacotamento, diálogo, disco, impressão, a
 * transação do `replaceForProject` — é toda do `plansService`; aqui ficam só a
 * validação da entrada e `windowFor(event)` (o único ponto que toca o `event`).
 * `plans:get` e `plans:generate` devolvem o `Plan` do service sem mapper: a
 * árvore do main e a de `@shared/types/plan` colapsaram numa só.
 *
 * `plans:print` e as duas exportações devolvem `boolean` / `ExportResult` —
 * `ExportResult` é união de literais de `shared/ipc/`, atravessa por atribuição.
 *
 * `plans:generate` recebe só um id: o que o renderer mandava empacotado agora o
 * main monta, e `parseId` dá conta da fronteira de confiança (ticket 07).
 */
export function registerPlansController(plans: PlansService): void {
  handle(IPC_CHANNELS.plansGet, (_event, projectId: unknown): Plan | null =>
    plans.get(parseId(projectId)),
  );

  handle(IPC_CHANNELS.plansGenerate, (_event, projectId: unknown): Plan =>
    plans.generate(parseId(projectId)),
  );

  handle(IPC_CHANNELS.plansPrint, (event): Promise<boolean> => plans.print(windowFor(event)));

  handle(
    IPC_CHANNELS.plansExportPng,
    (event, projectId: unknown, bytes: unknown): Promise<ExportResult> =>
      plans.exportPng(windowFor(event), parseId(projectId), parseOrThrow(pngBytesSchema, bytes)),
  );

  handle(IPC_CHANNELS.plansExportPdf, (event, projectId: unknown): Promise<ExportResult> =>
    plans.exportPdf(windowFor(event), parseId(projectId)),
  );
}
