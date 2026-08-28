import type { ReceiptPayload } from '@shared/ipc/api';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { Expense } from '@shared/types/expense';
import type { ExpensesService } from '../services/expensesService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { expenseToResponse } from './responses/expense.response';
import { createExpenseSchema, payExpenseSchema, updateExpenseSchema } from './schemas/expenses.schema';
import { receiptFilenameSchema } from './schemas/receipts.schema';

/**
 * As Despesas de um Mês e o pagamento: débito da Conta, comprovante em disco e
 * estorno. Toda a composição transacional é do `expensesService`; aqui ficam
 * `parseOrThrow` / `parseId` na entrada e `expenseToResponse` na saída.
 *
 * `receipts:open` não tem controller próprio — o comprovante é recurso do
 * domínio de Despesas (spec, decisão 10). O `filename` cru do renderer passa a
 * ser conferido pelo `receiptFilenameSchema` antes de chegar ao `shell.openPath`.
 */
export function registerExpensesController(expenses: ExpensesService): void {
  handle(IPC_CHANNELS.expensesListForMonth, (_event, monthId: unknown): Expense[] =>
    expenses.listForMonth(parseId(monthId)).map(expenseToResponse),
  );

  handle(IPC_CHANNELS.expensesCreate, (_event, monthId: unknown, data: unknown): Expense =>
    expenseToResponse(expenses.create(parseId(monthId), parseOrThrow(createExpenseSchema, data))),
  );

  handle(IPC_CHANNELS.expensesUpdate, (_event, id: unknown, data: unknown): Expense =>
    expenseToResponse(expenses.update(parseId(id), parseOrThrow(updateExpenseSchema, data))),
  );

  handle(IPC_CHANNELS.expensesDelete, (_event, id: unknown): { message: string } => {
    expenses.delete(parseId(id));
    return { message: 'Expense deleted' };
  });

  handle(
    IPC_CHANNELS.expensesPay,
    (
      _event,
      id: unknown,
      payload: { receipt?: ReceiptPayload; notes?: string; paidAt?: string; bankAccountId?: number },
    ): Expense => {
      const body = parseOrThrow(payExpenseSchema, {
        notes: payload?.notes,
        paidAt: payload?.paidAt,
        bankAccountId: payload?.bankAccountId,
      });
      return expenseToResponse(
        expenses.pay(parseId(id), {
          paidAt: body.paidAt,
          bankAccountId: body.bankAccountId,
          notes: body.notes,
          receipt: payload?.receipt,
        }),
      );
    },
  );

  handle(IPC_CHANNELS.expensesUnpay, (_event, id: unknown): Expense =>
    expenseToResponse(expenses.unpay(parseId(id))),
  );

  handle(IPC_CHANNELS.receiptsOpen, (_event, filename: unknown): Promise<void> =>
    expenses.openReceipt(parseOrThrow(receiptFilenameSchema, filename)),
  );
}
