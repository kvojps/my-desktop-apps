import type Database from 'better-sqlite3';

interface SettingRow {
  value: string;
}

/**
 * Tabela chave-valor das configurações do app. Hoje guarda só a preferência de
 * tema, que mora no banco — e não no `localStorage` — porque o processo main
 * precisa dela antes de existir renderer (docs/design-system.md §5.1).
 */
export function getSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    SettingRow | undefined;
  return row?.value ?? null;
}

export function setSetting(db: Database.Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, value, new Date().toISOString());
}
