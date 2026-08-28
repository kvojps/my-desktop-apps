import Database from 'better-sqlite3';

/** Chave/valor interno do app - não é exposto por IPC. */
export function getAppSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as
    { value: string } | undefined;
  return row?.value ?? null;
}

export function setAppSetting(db: Database.Database, key: string, value: string) {
  db.prepare(
    `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, value);
}

export function deleteAppSetting(db: Database.Database, key: string) {
  db.prepare('DELETE FROM app_settings WHERE key = ?').run(key);
}

/**
 * Tabela chave-valor: sem entidade a listar nem id a buscar, mantém verbos
 * próprios em vez do contrato `list`/`findById`/`create`/`update`/`delete`
 * (precedente registrado no ticket 05 do `git-dlog` e no 03 do `meu-negocio-app`).
 *
 * As três funções livres acima continuam exportadas porque os helpers de módulo
 * do `monthsRepository` (`ensureCurrentMonthExists`, `rememberCurrentCompetency`)
 * e o gateway `system/themeMode.ts` ainda leem por elas — esses call sites só se
 * religam a `repos.appSettings` no ticket 05.
 */
export function makeAppSettingsRepository(db: Database.Database) {
  return {
    getAppSetting: (key: string): string | null => getAppSetting(db, key),
    setAppSetting: (key: string, value: string): void => setAppSetting(db, key, value),
    deleteAppSetting: (key: string): void => deleteAppSetting(db, key),
  };
}

export type AppSettingsRepository = ReturnType<typeof makeAppSettingsRepository>;
