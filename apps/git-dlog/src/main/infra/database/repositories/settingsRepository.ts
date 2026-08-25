import type Database from 'better-sqlite3';
import { safeStorage } from 'electron';
import {
  type EncryptedGithubTokenEntity,
  type ThemeModeEntity,
  isThemeModeEntity,
} from '../../../domain/settings';
import { AppError } from '../../../utils/errors/AppError';

const GITHUB_TOKEN_KEY = 'githubToken';
const THEME_MODE_KEY = 'themeMode';

interface SettingRow {
  value: string;
}

/**
 * Tabela chave-valor: não há entidade a listar nem id a buscar, então o
 * contrato `list`/`findById`/… não tem o que nomear aqui. Os verbos são os do
 * que está guardado.
 *
 * Duas dívidas seguem aqui de propósito, ambas do ticket 08: a cifragem, que é
 * do `safeStorage` e portanto de `infra/gateways/system/` (README §2.2), e o
 * `AppError(500)` que ela lança — repositório não lança. Enquanto não existe
 * `settingsService` para costurar gateway e repositório, mover qualquer uma das
 * duas só trocaria de camada errada.
 */
export function makeSettingsRepository(db: Database.Database) {
  function getSetting(key: string): string | null {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
      SettingRow | undefined;
    return row?.value ?? null;
  }

  function setSetting(key: string, value: string): void {
    db.prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).run(key, value, new Date().toISOString());
  }

  return {
    /**
     * O token é gravado cifrado pelo `safeStorage` do Electron, que usa o cofre do
     * sistema operacional (DPAPI no Windows, Keychain no macOS). Nunca guardamos o
     * valor em texto puro no SQLite — o arquivo do banco fica num diretório comum
     * do usuário e seria trivial de ler.
     */
    saveGithubToken(token: string): void {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new AppError(
          500,
          'O cofre de credenciais do sistema não está disponível; o token não pode ser salvo com segurança.',
        );
      }

      const encrypted: EncryptedGithubTokenEntity = safeStorage
        .encryptString(token)
        .toString('base64');
      setSetting(GITHUB_TOKEN_KEY, encrypted);
    },

    getGithubToken(): string | null {
      const stored: EncryptedGithubTokenEntity | null = getSetting(GITHUB_TOKEN_KEY);
      if (!stored) return null;

      if (!safeStorage.isEncryptionAvailable()) return null;

      try {
        return safeStorage.decryptString(Buffer.from(stored, 'base64'));
      } catch {
        // Cofre do SO trocado (outro usuário, outra máquina, perfil recriado):
        // o valor guardado virou lixo indecifrável.
        return null;
      }
    },

    hasGithubToken(): boolean {
      return getSetting(GITHUB_TOKEN_KEY) !== null;
    },

    deleteGithubToken(): void {
      db.prepare('DELETE FROM settings WHERE key = ?').run(GITHUB_TOKEN_KEY);
    },

    /**
     * A preferência de tema mora no banco, não no `localStorage`: o processo main
     * precisa dela antes de existir renderer, para pintar a janela e o
     * `nativeTheme.themeSource` sem flash branco (docs/design-system.md §5.1).
     * Texto plano — não é segredo, ao contrário do token do GitHub.
     */
    getThemeMode(): ThemeModeEntity | null {
      const stored = getSetting(THEME_MODE_KEY);
      return stored !== null && isThemeModeEntity(stored) ? stored : null;
    },

    saveThemeMode(mode: ThemeModeEntity): void {
      setSetting(THEME_MODE_KEY, mode);
    },
  };
}

export type SettingsRepository = ReturnType<typeof makeSettingsRepository>;
