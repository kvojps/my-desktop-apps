import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Month, MonthDetail } from '@shared/types/month';
import type { MonthsService } from '../services/monthsService';
import type { SetupService } from '../services/setupService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { monthDetailToResponse, monthToResponse } from './responses/month.response';
import { createMonthSchema, createMonthsBatchSchema } from './schemas/months.schema';
import { setupSchema } from './schemas/setup.schema';

/**
 * O Mês e o seu ciclo de vida. O fluxo — Competência, rollover Dez→Jan, cópia
 * dos padrões, idempotência do Mês corrente — é todo do `monthsService`; aqui
 * ficam as duas pontas da fronteira: `parseOrThrow` / `parseId` na entrada e
 * `monthToResponse` na saída.
 *
 * `setup:run` mora aqui, e não num `setupController` de um handler só: a
 * configuração inicial é "cria todo Mês da Competência escolhida até a corrente"
 * — o mesmo domínio, um verbo a mais. Precedente do canal único de `settings`
 * dividindo arquivo com o domínio vizinho no `git-dlog` (README §2.2). O
 * `setupService` entra por parâmetro à parte porque é fábrica própria.
 */
export function registerMonthsController(months: MonthsService, setup: SetupService): void {
  handle(IPC_CHANNELS.monthsList, (): Month[] => months.list().map(monthToResponse));

  handle(IPC_CHANNELS.monthsGet, (_event, id: unknown): MonthDetail =>
    monthDetailToResponse(months.getDetail(parseId(id))),
  );

  handle(IPC_CHANNELS.monthsCreate, (_event, year: unknown, month: unknown): Month => {
    const body = parseOrThrow(createMonthSchema, { year, month });
    return monthToResponse(
      body.year && body.month ? months.create(body.year, body.month) : months.createNext(),
    );
  });

  handle(
    IPC_CHANNELS.monthsCreateBatch,
    (
      _event,
      fromYear: unknown,
      fromMonth: unknown,
      toYear: unknown,
      toMonth: unknown,
    ): { created: Month[]; errors: string[] } => {
      const body = parseOrThrow(createMonthsBatchSchema, { fromYear, fromMonth, toYear, toMonth });
      const result = months.createBatch(body.fromYear, body.fromMonth, body.toYear, body.toMonth);
      return { created: result.created.map(monthToResponse), errors: result.errors };
    },
  );

  handle(IPC_CHANNELS.monthsDelete, (_event, id: unknown): { message: string } => {
    months.delete(parseId(id));
    return { message: 'Month deleted' };
  });

  handle(
    IPC_CHANNELS.setupRun,
    (_event, initialMonth: unknown, initialYear: unknown): { months: Month[] } => {
      const body = parseOrThrow(setupSchema, { initialMonth, initialYear });
      return { months: setup.run(body.initialYear, body.initialMonth).map(monthToResponse) };
    },
  );
}
