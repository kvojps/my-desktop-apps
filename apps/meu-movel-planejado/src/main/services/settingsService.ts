import type Database from 'better-sqlite3';
import type { ThemeMode } from '@shared/types/theme';
import { THEME_MODE_KEY } from '../domain/theme';
import { makeSettingsRepository } from '../infra/database/repositories/settingsRepository';

/**
 * A preferência de tema no banco. Hoje é só a escrita que saiu de
 * `infra/gateways/system/themeMode.ts` (a chave mora em `domain/theme.ts`); o
 * ticket 05 é que monta o serviço de verdade — sem a closure `onThemeModeChange`,
 * e assumindo também a leitura que o gateway ainda faz.
 */
export function saveThemeMode(db: Database.Database, mode: ThemeMode): void {
  makeSettingsRepository(db).set(THEME_MODE_KEY, mode);
}
