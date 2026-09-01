import type Database from 'better-sqlite3';
import type { ThemeMode } from '@shared/types/theme';
import { makeSettingsRepository } from '../infra/database/repositories/settingsRepository';

/**
 * A preferência de tema no banco. Hoje é só o par chave + escrita que saiu de
 * `infra/gateways/system/themeMode.ts`; o ticket 05 é que monta o serviço de
 * verdade (sem a closure `onThemeModeChange`, e assumindo também a leitura que
 * o gateway ainda faz).
 */

/** A chave sob a qual a preferência de tema fica guardada em `settings`. */
export const THEME_MODE_KEY = 'theme.mode';

export function saveThemeMode(db: Database.Database, mode: ThemeMode): void {
  makeSettingsRepository(db).set(THEME_MODE_KEY, mode);
}
