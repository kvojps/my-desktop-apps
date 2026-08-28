import Database from 'better-sqlite3';
import type { BankAccountEntity } from '../../../domain/bankAccount';

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
    | BankAccountRow
    | undefined;
}

export function makeBankAccountsRepository(db: Database.Database) {
  function findById(id: number): BankAccountEntity | null {
    const row = selectBankAccountRow(db, id);
    return row ? rowToBankAccount(row) : null;
  }

  return {
    list(): BankAccountEntity[] {
      const rows = db.prepare('SELECT * FROM bank_accounts ORDER BY name').all() as BankAccountRow[];
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
     * Move o saldo por um delta (negativo debita, positivo credita). A regra de
     * saldo insuficiente e "conta não encontrada" mora no `bankAccountsService`,
     * que é quem chama — daqui é só o `UPDATE`.
     */
    adjustBalance(id: number, delta: number): void {
      db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?').run(delta, id);
    },

    /**
     * Apaga a Conta. O NULL das referências em `expenses`/`incomes` e a
     * atomicidade são compostos pelo `bankAccountsService` (spec desta pasta,
     * decisão 7). Devolve `null` — sem decidir 404. Excluir não desfaz pagamentos.
     */
    delete(id: number): BankAccountEntity | null {
      const existing = selectBankAccountRow(db, id);
      if (!existing) return null;

      db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(id);
      return rowToBankAccount(existing);
    },
  };
}

export type BankAccountsRepository = ReturnType<typeof makeBankAccountsRepository>;
