import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { DefaultExpense } from '@shared/types/expense';
import type { DefaultExpensesService } from '../services/defaultExpensesService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import {
  createDefaultExpenseSchema,
  updateDefaultExpenseSchema,
} from './schemas/defaultExpenses.schema';

/**
 * As Despesas padrão — o modelo do que se repete todo Mês. `create` propaga uma
 * cópia para dentro de todo Mês já existente; a cascata e a transação são do
 * `defaultExpensesService`. Aqui ficam só `parseOrThrow` / `parseId` na
 * entrada. `DefaultExpense` (`@shared/types/expense`) atravessa direto — sem
 * mapper de saída (ADR-0005).
 */
export function registerDefaultExpensesController(defaultExpenses: DefaultExpensesService): void {
  handle(IPC_CHANNELS.defaultExpensesList, (): DefaultExpense[] => defaultExpenses.list());

  handle(IPC_CHANNELS.defaultExpensesCreate, (_event, data: unknown): DefaultExpense =>
    defaultExpenses.create(parseOrThrow(createDefaultExpenseSchema, data)),
  );

  handle(IPC_CHANNELS.defaultExpensesUpdate, (_event, id: unknown, data: unknown): DefaultExpense =>
    defaultExpenses.update(parseId(id), parseOrThrow(updateDefaultExpenseSchema, data)),
  );

  handle(IPC_CHANNELS.defaultExpensesDelete, (_event, id: unknown): { message: string } => {
    defaultExpenses.delete(parseId(id));
    return { message: 'Default expense deleted' };
  });
}
