import type Database from 'better-sqlite3';
import type { CompanySettings } from '@shared/types/settings';

const DEFAULT_SETTINGS: CompanySettings = {
  name: '',
  cnpj: '',
  phone: '',
  address: '',
};

/**
 * Tabela chave-valor de linha única: não há entidade a listar nem id a
 * buscar, então o contrato `list`/`findById`/… não tem o que nomear aqui —
 * mesmo precedente do `settingsRepository` do `git-dlog`.
 */
export function makeSettingsRepository(db: Database.Database) {
  return {
    getSettings(): CompanySettings {
      const row = db
        .prepare('SELECT name, cnpj, phone, address FROM settings WHERE id = 1')
        .get() as CompanySettings | undefined;
      return row ?? DEFAULT_SETTINGS;
    },

    updateSettings(data: CompanySettings): CompanySettings {
      db.prepare(
        `INSERT INTO settings (id, name, cnpj, phone, address)
         VALUES (1, @name, @cnpj, @phone, @address)
         ON CONFLICT (id) DO UPDATE SET name = @name, cnpj = @cnpj, phone = @phone, address = @address`,
      ).run(data);
      return data;
    },
  };
}

export type SettingsRepository = ReturnType<typeof makeSettingsRepository>;
