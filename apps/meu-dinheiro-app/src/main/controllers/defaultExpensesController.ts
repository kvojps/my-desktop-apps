import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { DefaultExpense } from '@shared/types/expense';
import type { DefaultExpensesService } from '../services/defaultExpensesService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { defaultExpenseToResponse } from './responses/defaultExpense.response';
import {
  createDefaultExpenseSchema,
  updateDefaultExpenseSchema,
} from './schemas/defaultExpenses.schema';

/**
 * As Despesas padrão — o modelo do que se repete todo Mês. `create` propaga uma
 * cópia para dentro de todo Mês já existente; a cascata e a transação são do
 * `defaultExpensesService`. Aqui ficam `parseOrThrow` / `parseId` na entrada e
 * `defaultExpenseToResponse` na saída.
 */
export function registerDefaultExpensesController(defaultExpenses: DefaultExpensesService): void {
  handle(IPC_CHANNELS.defaultExpensesList, (): DefaultExpense[] =>
    defaultExpenses.list().map(defaultExpenseToResponse),
  );

  handle(IPC_CHANNELS.defaultExpensesCreate, (_event, data: unknown): DefaultExpense =>
    defaultExpenseToResponse(defaultExpenses.create(parseOrThrow(createDefaultExpenseSchema, data))),
  );

  handle(IPC_CHANNELS.defaultExpensesUpdate, (_event, id: unknown, data: unknown): DefaultExpense =>
    defaultExpenseToResponse(
      defaultExpenses.update(parseId(id), parseOrThrow(updateDefaultExpenseSchema, data)),
    ),
  );

  handle(IPC_CHANNELS.defaultExpensesDelete, (_event, id: unknown): { message: string } => {
    defaultExpenses.delete(parseId(id));
    return { message: 'Default expense deleted' };
  });
}
