import type Database from 'better-sqlite3';
import { safeStorage } from 'electron';
import { AppError } from '../errors/AppError';

const GITHUB_TOKEN_KEY = 'githubToken';

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
