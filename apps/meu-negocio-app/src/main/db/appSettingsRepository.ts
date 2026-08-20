import Database from 'better-sqlite3';

/**
 * Chave/valor interno do app — preferências que não são dados do negócio e não
 * têm tela própria. Não é exposto por IPC como repositório: quem precisa de uma
 * chave daqui expõe um canal para ela, como o `theme:get`/`theme:set`.
 */
export function getAppSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as
    { value: string } | undefined;
  return row?.value ?? null;
}

export function setAppSetting(db: Database.Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, value);
}
