import Database from 'better-sqlite3';
import { AppError } from '../errors/AppError';

export interface BankAccountRow {
  id: number;
  name: string;
  balance: number;
  created_at: string;
}

export function listBankAccounts(db: Database.Database) {
  return db.prepare('SELECT * FROM bank_accounts ORDER BY name').all() as BankAccountRow[];
}

export function getBankAccountById(db: Database.Database, id: number): BankAccountRow {
  const existing = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(id) as
    BankAccountRow | undefined;
  if (!existing) {
    throw new AppError(404, 'Bank account not found');
  }
  return existing;
}

export function createBankAccount(
  db: Database.Database,
  data: { name: string; balance?: number },
): BankAccountRow {
  const result = db
    .prepare('INSERT INTO bank_accounts (name, balance) VALUES (?, ?)')
    .run(data.name, data.balance || 0);
  return getBankAccountById(db, result.lastInsertRowid as number);
}

export function updateBankAccount(
  db: Database.Database,
  id: number,
  data: { name?: string; balance?: number },
): BankAccountRow {
  const existing = getBankAccountById(db, id);

  db.prepare('UPDATE bank_accounts SET name = ?, balance = ? WHERE id = ?').run(
    data.name ?? existing.name,
    data.balance !== undefined ? data.balance : existing.balance,
    id,
  );

  return getBankAccountById(db, id);
}

export function deleteBankAccount(db: Database.Database, id: number) {
  getBankAccountById(db, id);
  const run = db.transaction(() => {
    db.prepare('UPDATE expenses SET bank_account_id = NULL WHERE bank_account_id = ?').run(id);
    db.prepare('UPDATE incomes SET bank_account_id = NULL WHERE bank_account_id = ?').run(id);
    db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(id);
  });
  run();
}

export function debitBankAccount(db: Database.Database, id: number, amount: number) {
  const account = getBankAccountById(db, id);
  if (account.balance < amount) {
    throw new AppError(400, 'Saldo insuficiente na conta selecionada');
  }
  db.prepare('UPDATE bank_accounts SET balance = balance - ? WHERE id = ?').run(amount, id);
}

export function creditBankAccount(db: Database.Database, id: number, amount: number) {
  db.prepare('UPDATE bank_accounts SET balance = balance + ? WHERE id = ?').run(amount, id);
}
