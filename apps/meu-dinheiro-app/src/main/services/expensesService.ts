import type { ReceiptPayload } from '@shared/ipc/api';
import type { ExpenseEntity } from '../domain/expense';
import type { Repositories } from '../infra/database';
import type { ReceiptsGateway } from '../infra/gateways/receipts';
import { AppError } from '../utils/errors/AppError';
import type { BankAccountsService } from './bankAccountsService';

export interface PayExpenseInput {
  paidAt?: string;
  bankAccountId?: number;
  notes?: string;
  receipt?: ReceiptPayload;
}

/**
 * As despesas de um Mês e o que acontece ao pagá-las: o débito da Conta
 * bancária, o comprovante em disco e o estorno. A composição transacional
 * (`repos.transaction`) e a conversa com os gateways moram aqui; o repositório
 * só tem verbos.
 */
export function makeExpensesService(
  repos: Repositories,
  bankAccounts: BankAccountsService,
  receipts: ReceiptsGateway,
) {
  function requireExpense(id: number): ExpenseEntity {
    const expense = repos.expenses.findById(id);
    if (!expense) throw new AppError(404, 'Despesa não encontrada');
    return expense;
  }

  return {
    listForMonth(monthId: number): ExpenseEntity[] {
      return repos.expenses.listForMonth(monthId);
    },

    create(
      monthId: number,
      data: { name: string; dueDate?: string | null; amount?: number; categoryId?: number | null },
    ): ExpenseEntity {
      if (!repos.months.exists(monthId)) throw new AppError(404, 'Mês não encontrado');
      return repos.expenses.create(monthId, data);
    },

    update(
      id: number,
      data: {
        name?: string;
        dueDate?: string | null;
        amount?: number;
        notes?: string | null;
        categoryId?: number | null;
      },
    ): ExpenseEntity {
      const updated = repos.expenses.update(id, data);
      if (!updated) throw new AppError(404, 'Despesa não encontrada');
      return updated;
    },

    delete(id: number): void {
      const existing = requireExpense(id);
      repos.expenses.delete(id);
      receipts.delete(existing.receipt);
    },

    /**
     * Confere o saldo da Conta **antes** de gravar o comprovante e só então abre
     * a transação (débito + marca paga). Saldo insuficiente → `AppError(400)`,
     * sem arquivo órfão no disco e sem despesa meio-paga (decisão 14c — corrige
     * o bug em que o comprovante era gravado antes da transação).
     */
    pay(id: number, { paidAt, bankAccountId, notes, receipt }: PayExpenseInput): ExpenseEntity {
      const existing = requireExpense(id);

      if (bankAccountId) bankAccounts.assertCanDebit(bankAccountId, existing.amount);

      let receiptFilename: string | undefined;
      if (receipt) {
        const names = repos.expenses.getForFilename(id);
        receiptFilename = receipts.save({
          monthLabel: names?.monthLabel ?? 'unknown',
          expenseName: names?.name ?? 'unknown',
          expenseId: id,
          originalName: receipt.originalName,
          mimeType: receipt.mimeType,
          buffer: Buffer.from(receipt.buffer),
        });
      }

      const paid = repos.transaction(() => {
        if (bankAccountId) bankAccounts.debit(bankAccountId, existing.amount);
        return repos.expenses.pay(id, receiptFilename, notes, paidAt, bankAccountId);
      });
      if (!paid) throw new AppError(404, 'Despesa não encontrada');
      return paid;
    },

    /** Credita a Conta de volta e apaga o comprovante. */
    unpay(id: number): ExpenseEntity {
      const existing = requireExpense(id);

      const unpaid = repos.transaction(() => {
        if (existing.bankAccountId) bankAccounts.credit(existing.bankAccountId, existing.amount);
        return repos.expenses.unpay(id);
      });
      if (!unpaid) throw new AppError(404, 'Despesa não encontrada');

      receipts.delete(existing.receipt);
      return unpaid;
    },

    openReceipt(filename: string): Promise<void> {
      return receipts.open(filename);
    },
  };
}

export type ExpensesService = ReturnType<typeof makeExpensesService>;
