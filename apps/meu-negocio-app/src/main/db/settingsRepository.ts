import type Database from 'better-sqlite3';
import type { CompanySettings } from '@shared/types/settings';

const DEFAULT_SETTINGS: CompanySettings = {
  name: '',
  cnpj: '',
  phone: '',
  address: '',
};

export function getSettings(db: Database.Database): CompanySettings {
  const row = db.prepare('SELECT name, cnpj, phone, address FROM settings WHERE id = 1').get() as
    CompanySettings | undefined;
  return row ?? DEFAULT_SETTINGS;
}

export function updateSettings(db: Database.Database, data: CompanySettings): CompanySettings {
  db.prepare(
    `INSERT INTO settings (id, name, cnpj, phone, address)
     VALUES (1, @name, @cnpj, @phone, @address)
     ON CONFLICT (id) DO UPDATE SET name = @name, cnpj = @cnpj, phone = @phone, address = @address`,
  ).run(data);
  return data;
}
