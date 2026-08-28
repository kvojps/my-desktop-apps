import type { BankAccountEntity } from '../domain/bankAccount';
import type { Repositories } from '../infra/database';
import { AppError } from '../utils/errors/AppError';

/**
 * As Contas bancárias e o saldo. A regra "não dá para debitar mais do que tem"
 * mora aqui, e `expensesService`/`incomesService` chamam `debit`/`credit` por
 * aqui — quebrando o acoplamento `expenses`/`incomes` → `bankAccounts` que
 * existia entre repositórios (spec desta pasta, problema 3 e decisão 6).
 */
export function makeBankAccountsService(repos: Repositories) {
  function requireAccount(id: number): BankAccountEntity {
    const account = repos.bankAccounts.findById(id);
    if (!account) throw new AppError(404, 'Conta bancária não encontrada');
    return account;
  }

  function assertSufficientBalance(account: BankAccountEntity, amount: number): void {
    if (account.balance < amount) {
      throw new AppError(400, 'Saldo insuficiente na conta selecionada');
    }
  }

  return {
    list(): BankAccountEntity[] {
      return repos.bankAccounts.list();
    },

    create(data: { name: string; balance?: number }): BankAccountEntity {
      return repos.bankAccounts.create(data);
    },

    update(id: number, data: { name?: string; balance?: number }): BankAccountEntity {
      const updated = repos.bankAccounts.update(id, data);
      if (!updated) throw new AppError(404, 'Conta bancária não encontrada');
      return updated;
    },

    /**
     * Excluir uma Conta zera as referências em despesas e entradas e então
     * apaga a linha, tudo numa transação. Não desfaz pagamentos.
     */
    delete(id: number): void {
      const existing = repos.bankAccounts.findById(id);
      if (!existing) throw new AppError(404, 'Conta bancária não encontrada');

      repos.transaction(() => {
        repos.expenses.clearBankAccount(id);
        repos.incomes.clearBankAccount(id);
        repos.bankAccounts.delete(id);
      });
    },

    /**
     * Confere, sem mover nada, que a Conta existe e cobre o valor. O
     * `expensesService.pay()` chama isto **antes** de gravar o comprovante, para
     * um rollback por saldo não deixar arquivo órfão (decisão 14c).
     */
    assertCanDebit(id: number, amount: number): void {
      assertSufficientBalance(requireAccount(id), amount);
    },

    /** Debita. `AppError(404)` se a Conta sumiu, `AppError(400)` se o saldo não cobre. */
    debit(id: number, amount: number): void {
      assertSufficientBalance(requireAccount(id), amount);
      repos.bankAccounts.adjustBalance(id, -amount);
    },

    /**
     * Credita. Não confere existência — uma Conta apagada entre o pagamento e o
     * estorno vira um `UPDATE` sem efeito, como era em `creditBankAccount`.
     */
    credit(id: number, amount: number): void {
      repos.bankAccounts.adjustBalance(id, amount);
    },
  };
}

export type BankAccountsService = ReturnType<typeof makeBankAccountsService>;
