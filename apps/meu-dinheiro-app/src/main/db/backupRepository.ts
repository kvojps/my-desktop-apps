import { ZipArchive } from 'archiver';
import Database from 'better-sqlite3';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { AppError } from '../errors/AppError';

export function getExportData(db: Database.Database) {
  return {
    version: 1,
    exported_at: new Date().toISOString(),
    categories: db.prepare('SELECT * FROM categories').all(),
    default_expenses: db.prepare('SELECT * FROM default_expenses').all(),
    default_incomes: db.prepare('SELECT * FROM default_incomes').all(),
    bank_accounts: db.prepare('SELECT * FROM bank_accounts').all(),
    months: db.prepare('SELECT * FROM months ORDER BY year, month').all(),
    expenses: db.prepare('SELECT * FROM expenses ORDER BY month_id').all(),
    incomes: db.prepare('SELECT * FROM incomes ORDER BY month_id').all(),
  };
}

export async function exportToZipFile(
  db: Database.Database,
  uploadsDir: string,
  filePath: string,
): Promise<void> {
  const data = getExportData(db);

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(filePath);
    const archive = new ZipArchive({ zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err: Error) => reject(err));
    archive.pipe(output);

    archive.append(JSON.stringify(data, null, 2), { name: 'data.json' });
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }

    archive.finalize();
  });
}

export async function importFromZipFile(
  db: Database.Database,
  uploadsDir: string,
  filePath: string,
): Promise<void> {
  const tempDir = path.join(app.getPath('temp'), 'meu-dinheiro-import-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const directory = await unzipper.Open.file(filePath);
    await directory.extract({ path: tempDir });

    const dataPath = path.join(tempDir, 'data.json');
    if (!fs.existsSync(dataPath)) {
      throw new AppError(400, 'data.json não encontrado no ZIP');
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Backups exportados antes da renomeação "contas" -> "despesas" usam as chaves antigas.
    const expenses = data.expenses ?? data.accounts;
    const defaultExpenses = data.default_expenses ?? data.default_accounts ?? [];
    // Backups anteriores à criação das contas bancárias não têm essa chave.
    const bankAccounts = data.bank_accounts ?? [];
    // Backups anteriores à criação de entradas não têm essas chaves.
    const incomes = data.incomes ?? [];
    const defaultIncomes = data.default_incomes ?? [];
    // Backups anteriores à criação de categorias não têm essa chave.
    const categories = data.categories ?? [];

    if (!data.version || !data.months || !expenses) {
      throw new AppError(400, 'Formato de dados inválido');
    }

    db.pragma('foreign_keys = OFF');
    try {
      const run = db.transaction(() => {
        db.exec('DELETE FROM expenses');
        db.exec('DELETE FROM incomes');
        db.exec('DELETE FROM default_expenses');
        db.exec('DELETE FROM default_incomes');
        db.exec('DELETE FROM bank_accounts');
        db.exec('DELETE FROM months');
        db.exec('DELETE FROM categories');

        const insertCategory = db.prepare(
          'INSERT INTO categories (id, name, color) VALUES (?, ?, ?)',
        );
        for (const cat of categories) {
          insertCategory.run(cat.id, cat.name, cat.color);
        }

        const insertDefault = db.prepare(
          'INSERT INTO default_expenses (name, due_day, amount, category_id) VALUES (?, ?, ?, ?)',
        );
        for (const exp of defaultExpenses) {
          insertDefault.run(exp.name, exp.due_day, exp.amount, exp.category_id ?? null);
        }

        const insertDefaultIncome = db.prepare(
          'INSERT INTO default_incomes (name, expected_day, amount, bank_account_id) VALUES (?, ?, ?, ?)',
        );
        for (const inc of defaultIncomes) {
          insertDefaultIncome.run(
            inc.name,
            inc.expected_day,
            inc.amount,
            inc.bank_account_id ?? null,
          );
        }

        const insertBankAccount = db.prepare(
          'INSERT INTO bank_accounts (id, name, balance) VALUES (?, ?, ?)',
        );
        for (const acc of bankAccounts) {
          insertBankAccount.run(acc.id, acc.name, acc.balance);
        }

        const insertMonth = db.prepare(
          'INSERT INTO months (id, label, year, month) VALUES (?, ?, ?, ?)',
        );
        for (const m of data.months) {
          insertMonth.run(m.id, m.label, m.year, m.month);
        }

        const insertExpense = db.prepare(
          `INSERT INTO expenses (id, month_id, name, due_date, amount, is_paid, paid_at, receipt, notes, bank_account_id, category_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const e of expenses) {
          insertExpense.run(
            e.id,
            e.month_id,
            e.name,
            e.due_date,
            e.amount,
            e.is_paid,
            e.paid_at,
            e.receipt,
            e.notes,
            e.bank_account_id ?? null,
            e.category_id ?? null,
          );
        }

        const insertIncome = db.prepare(
          `INSERT INTO incomes (id, month_id, name, expected_date, amount, is_received, received_at, notes, bank_account_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const i of incomes) {
          insertIncome.run(
            i.id,
            i.month_id,
            i.name,
            i.expected_date,
            i.amount,
            i.is_received,
            i.received_at,
            i.notes,
            i.bank_account_id ?? null,
          );
        }
      });

      run();
    } finally {
      db.pragma('foreign_keys = ON');
    }

    const uploadsSource = path.join(tempDir, 'uploads');
    if (fs.existsSync(uploadsSource)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      const files = fs.readdirSync(uploadsSource);
      for (const file of files) {
        fs.copyFileSync(path.join(uploadsSource, file), path.join(uploadsDir, file));
      }
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
