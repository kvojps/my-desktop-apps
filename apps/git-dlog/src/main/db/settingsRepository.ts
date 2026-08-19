import type Database from 'better-sqlite3';
import { safeStorage } from 'electron';
import type { ThemeMode } from '@shared/types/theme';
import { AppError } from '../errors/AppError';

const GITHUB_TOKEN_KEY = 'githubToken';
const THEME_MODE_KEY = 'themeMode';

interface SettingRow {
  value: string;
}

function getSetting(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    SettingRow | undefined;
  return row?.value ?? null;
}

function setSetting(db: Database.Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  ).run(key, value, new Date().toISOString());
}

/**
 * O token é gravado cifrado pelo `safeStorage` do Electron, que usa o cofre do
 * sistema operacional (DPAPI no Windows, Keychain no macOS). Nunca guardamos o
 * valor em texto puro no SQLite — o arquivo do banco fica num diretório comum
 * do usuário e seria trivial de ler.
 */
export function saveGithubToken(db: Database.Database, token: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new AppError(
      500,
      'O cofre de credenciais do sistema não está disponível; o token não pode ser salvo com segurança.',
    );
  }

  const encrypted = safeStorage.encryptString(token).toString('base64');
  setSetting(db, GITHUB_TOKEN_KEY, encrypted);
}

export function getGithubToken(db: Database.Database): string | null {
  const stored = getSetting(db, GITHUB_TOKEN_KEY);
  if (!stored) return null;

  if (!safeStorage.isEncryptionAvailable()) return null;

  try {
    return safeStorage.decryptString(Buffer.from(stored, 'base64'));
  } catch {
    // Cofre do SO trocado (outro usuário, outra máquina, perfil recriado):
    // o valor guardado virou lixo indecifrável.
    return null;
  }
}

export function hasGithubToken(db: Database.Database): boolean {
  return getSetting(db, GITHUB_TOKEN_KEY) !== null;
}

export function deleteGithubToken(db: Database.Database): void {
  db.prepare('DELETE FROM settings WHERE key = ?').run(GITHUB_TOKEN_KEY);
}

/**
 * A preferência de tema mora no banco, não no `localStorage`: o processo main
 * precisa dela antes de existir renderer, para pintar a janela e o
 * `nativeTheme.themeSource` sem flash branco (docs/design-system.md §5.1).
 * Texto plano — não é segredo, ao contrário do token do GitHub.
 */
export function getThemeMode(db: Database.Database): ThemeMode | null {
  const stored = getSetting(db, THEME_MODE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : null;
}

export function saveThemeMode(db: Database.Database, mode: ThemeMode): void {
  setSetting(db, THEME_MODE_KEY, mode);
}
