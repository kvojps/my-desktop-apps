import Database from 'better-sqlite3';
import type { BankAccountEntity } from '../../../domain/bankAccount';
import { AppError } from '../../../utils/errors/AppError';

/** Colunas cruas da tabela; o banco continua em snake_case. */
export interface BankAccountRow {
  id: number;
  name: string;
  balance: number;
  created_at: string;
}

export function rowToBankAccount(row: BankAccountRow): BankAccountEntity {
  return {
    id: row.id,
    name: row.name,
    balance: row.balance,
    createdAt: row.created_at,
  };
}

function selectBankAccountRow(db: Database.Database, id: number): BankAccountRow | undefined {
  return db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(id) as
    BankAccountRow | undefined;
}

/**
 * Débito/crédito de conta seguem como funções de módulo com seus próprios
 * throws de regra (saldo insuficiente, conta ausente no débito): são chamadas
 * de dentro de `expensesRepository`/`incomesRepository`, e a migração para
 * `bankAccountsService.debit` — que quebra esse acoplamento entre repositórios —
 * é o ticket 05. Ver `../spec.md`, problema 3 e decisão 6.
 */
export function debitBankAccount(db: Database.Database, id: number, amount: number) {
  const account = selectBankAccountRow(db, id);
  if (!account) {
    throw new AppError(404, 'Conta bancária não encontrada');
  }
  if (account.balance < amount) {
    throw new AppError(400, 'Saldo insuficiente na conta selecionada');
  }
  db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?').run(amount, id);
}

export function creditBankAccount(db: Database.Database, id: number, amount: number) {
  db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?').run(amount, id);
}

export function makeBankAccountsRepository(db: Database.Database) {
  function findById(id: number): BankAccountEntity | null {
    const row = selectBankAccountRow(db, id);
    return row ? rowToBankAccount(row) : null;
  }

  return {
    list(): BankAccountEntity[] {
      const rows = db
        .prepare('SELECT * FROM bank_accounts ORDER BY name')
        .all() as BankAccountRow[];
      return rows.map(rowToBankAccount);
    },

    findById,

    create(data: { name: string; balance?: number }): BankAccountEntity {
      const result = db
        .prepare('INSERT INTO bank_accounts (name, balance) VALUES (?, ?)')
        .run(data.name, data.balance || 0);
      const created = findById(result.lastInsertRowid as number);
      if (!created) throw new Error('Bank account not found after insert');
      return created;
    },

    update(id: number, data: { name?: string; balance?: number }): BankAccountEntity | null {
      const existing = selectBankAccountRow(db, id);
      if (!existing) return null;

      db.prepare('UPDATE bank_accounts SET name = ?, balance = ? WHERE id = ?').run(
        data.name ?? existing.name,
        data.balance !== undefined ? data.balance : existing.balance,
        id,
      );

      return findById(id);
    },

    /**
     * O NULL das referências (`expenses`/`incomes`) ainda roda aqui, dentro do
     * `db.transaction` do próprio verbo — a composição dessa transação pelo
     * service, via `repos.expenses.clearBankAccount` / `repos.incomes.clearBankAccount`,
     * é o ticket 05. Devolve a conta que existia, ou `null` — sem decidir 404.
     */
    delete(id: number): BankAccountEntity | null {
      const existing = selectBankAccountRow(db, id);
      if (!existing) return null;

      const run = db.transaction(() => {
        db.prepare('UPDATE expenses SET bank_account_id = NULL WHERE bank_account_id = ?').run(id);
        db.prepare('UPDATE incomes SET bank_account_id = NULL WHERE bank_account_id = ?').run(id);
        db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(id);
      });
      run();

      return rowToBankAccount(existing);
    },
  };
}

export type BankAccountsRepository = ReturnType<typeof makeBankAccountsRepository>;
