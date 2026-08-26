import type Database from 'better-sqlite3';
import {
  type EncryptedGithubTokenEntity,
  type ThemeModeEntity,
  isThemeModeEntity,
} from '../../../domain/settings';

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
 * Guarda e devolve, e é só isso: o token entra e sai já cifrado, sem que este
 * arquivo saiba cifrar. Quem cifra é `infra/gateways/system/safeStorage.ts`, e
 * quem costura os dois é o `settingsService` (README §2.2).
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
     * O token é gravado cifrado, nunca em texto puro — o arquivo do banco fica
     * num diretório comum do usuário e seria trivial de ler. O tipo do
     * parâmetro é o que diz isso: quem chega aqui já passou pelo cofre.
     */
    saveGithubToken(encrypted: EncryptedGithubTokenEntity): void {
      setSetting(GITHUB_TOKEN_KEY, encrypted);
    },

    getGithubToken(): EncryptedGithubTokenEntity | null {
      return getSetting(GITHUB_TOKEN_KEY);
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
