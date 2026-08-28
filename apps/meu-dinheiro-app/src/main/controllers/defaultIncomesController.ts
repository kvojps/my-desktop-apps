import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { DefaultIncome } from '@shared/types/income';
import type { DefaultIncomesService } from '../services/defaultIncomesService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { defaultIncomeToResponse } from './responses/defaultIncome.response';
import {
  createDefaultIncomeSchema,
  updateDefaultIncomeSchema,
} from './schemas/defaultIncomes.schema';

/**
 * As Entradas padrão — o modelo do que se repete todo Mês. `create` propaga uma
 * cópia para dentro de todo Mês já existente; a cascata e a transação são do
 * `defaultIncomesService`. Aqui ficam `parseOrThrow` / `parseId` na entrada e
 * `defaultIncomeToResponse` na saída.
 */
export function registerDefaultIncomesController(defaultIncomes: DefaultIncomesService): void {
  handle(IPC_CHANNELS.defaultIncomesList, (): DefaultIncome[] =>
    defaultIncomes.list().map(defaultIncomeToResponse),
  );

  handle(IPC_CHANNELS.defaultIncomesCreate, (_event, data: unknown): DefaultIncome =>
    defaultIncomeToResponse(defaultIncomes.create(parseOrThrow(createDefaultIncomeSchema, data))),
  );

  handle(IPC_CHANNELS.defaultIncomesUpdate, (_event, id: unknown, data: unknown): DefaultIncome =>
    defaultIncomeToResponse(
      defaultIncomes.update(parseId(id), parseOrThrow(updateDefaultIncomeSchema, data)),
    ),
  );

  handle(IPC_CHANNELS.defaultIncomesDelete, (_event, id: unknown): { message: string } => {
    defaultIncomes.delete(parseId(id));
    return { message: 'Default income deleted' };
  });
}
