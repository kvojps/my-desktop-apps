import type { IncomeEntity } from '../domain/income';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';
import type { BankAccountsService } from './bankAccountsService';

export interface ReceiveIncomeInput {
  notes?: string;
  receivedAt?: string;
  bankAccountId?: number;
}

/**
 * As entradas de um Mês e o crédito/estorno da Conta bancária ao marcá-las
 * recebidas. A composição transacional mora aqui; o repositório só tem verbos.
 */
export function makeIncomesService(repos: Repositories, bankAccounts: BankAccountsService) {
  function requireIncome(id: number): IncomeEntity {
    const income = repos.incomes.findById(id);
    if (!income) throw new AppError(404, 'Entrada não encontrada');
    return income;
  }

  return {
    listForMonth(monthId: number): IncomeEntity[] {
      return repos.incomes.listForMonth(monthId);
    },

    create(
      monthId: number,
      data: {
        name: string;
        expectedDate?: string | null;
        amount?: number;
        bankAccountId?: number | null;
      },
    ): IncomeEntity {
      if (!repos.months.exists(monthId)) throw new AppError(404, 'Mês não encontrado');
      return repos.incomes.create(monthId, data);
    },

    update(
      id: number,
      data: {
        name?: string;
        expectedDate?: string | null;
        amount?: number;
        notes?: string | null;
        bankAccountId?: number | null;
      },
    ): IncomeEntity {
      const updated = repos.incomes.update(id, data);
      if (!updated) throw new AppError(404, 'Entrada não encontrada');
      return updated;
    },

    delete(id: number): void {
      requireIncome(id);
      repos.incomes.delete(id);
    },

    /** Marca recebida e credita a Conta, na mesma transação. */
    receive(id: number, { notes, receivedAt, bankAccountId }: ReceiveIncomeInput): IncomeEntity {
      const existing = requireIncome(id);

      const received = repos.transaction(() => {
        if (bankAccountId) bankAccounts.credit(bankAccountId, existing.amount);
        return repos.incomes.receive(id, notes, receivedAt, bankAccountId);
      });
      if (!received) throw new AppError(404, 'Entrada não encontrada');
      return received;
    },

    /**
     * Desmarca o recebimento e debita de volta a Conta — `AppError(400)` se o
     * saldo já não cobre. Preserva o `bankAccountId`: ali a Conta descreve para
     * onde a entrada costuma cair, é a sugestão do próximo recebimento.
     */
    unreceive(id: number): IncomeEntity {
      const existing = requireIncome(id);

      const unreceived = repos.transaction(() => {
        if (existing.bankAccountId) bankAccounts.debit(existing.bankAccountId, existing.amount);
        return repos.incomes.unreceive(id);
      });
      if (!unreceived) throw new AppError(404, 'Entrada não encontrada');
      return unreceived;
    },
  };
}

export type IncomesService = ReturnType<typeof makeIncomesService>;
