import type { ExportResult } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Plan } from '@shared/types/plan';
import type { PlansService } from '../services/plansService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { planToResponse } from './responses/plan.response';
import { pngBytesSchema } from './schemas/export.schema';
import { planInputSchema } from './schemas/plans.schema';
import { windowFor } from './windowFor';

/**
 * O plano de corte: o vigente do projeto, gravar o recém-gerado, imprimir e
 * exportar como PNG ou PDF. A orquestração — diálogo, disco, impressão, a
 * transação do `replaceForProject` — é toda do `plansService`; aqui ficam a
 * validação da entrada, `windowFor(event)` (o único ponto que toca o `event`) e
 * `planToResponse` na saída.
 *
 * `plans:print` e as duas exportações devolvem `boolean` / `ExportResult` —
 * `ExportResult` é união de literais de `shared/ipc/`, atravessa por atribuição —,
 * então só `plans:get` e `plans:save` passam pelo mapper.
 *
 * **`plans:save` é provisório**: o ticket 07 o troca por `plans:generate`, quando
 * o empacotador entra no main.
 */
export function registerPlansController(plans: PlansService): void {
  handle(IPC_CHANNELS.plansGet, (_event, projectId: unknown): Plan | null => {
    const plan = plans.get(parseId(projectId));
    return plan === null ? null : planToResponse(plan);
  });

  handle(IPC_CHANNELS.plansSave, (_event, projectId: unknown, data: unknown): Plan =>
    planToResponse(plans.save(parseId(projectId), parseOrThrow(planInputSchema, data))),
  );

  handle(IPC_CHANNELS.plansPrint, (event): Promise<boolean> => plans.print(windowFor(event)));

  handle(
    IPC_CHANNELS.plansExportPng,
    (event, projectId: unknown, bytes: unknown): Promise<ExportResult> =>
      plans.exportPng(windowFor(event), parseId(projectId), parseOrThrow(pngBytesSchema, bytes)),
  );

  handle(
    IPC_CHANNELS.plansExportPdf,
    (event, projectId: unknown): Promise<ExportResult> =>
      plans.exportPdf(windowFor(event), parseId(projectId)),
  );
}
