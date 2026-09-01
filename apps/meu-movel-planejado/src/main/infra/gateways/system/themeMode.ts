import type Database from 'better-sqlite3';
import { BrowserWindow, nativeTheme } from 'electron';
import type { ThemeMode } from '@shared/types/theme';
import { THEME_MODE_KEY, resolveThemeMode as resolveThemeModeRule } from '../../../domain/theme';
import { makeSettingsRepository } from '../../database/repositories/settingsRepository';

/** Igual a `background.default` do tema do renderer, por modo. */
const BACKGROUND: Record<ThemeMode, string> = {
  light: '#F4F6FB',
  dark: '#10131C',
};

/**
 * Resolvido uma única vez no boot. Toda leitura posterior passa por aqui, e não
 * por `nativeTheme`, pelo motivo explicado em `resolveThemeMode`.
 */
let current: ThemeMode | null = null;

/**
 * O modo a usar nesta sessão. Este gateway faz as duas leituras — a preferência
 * no banco e `nativeTheme.shouldUseDarkColors` — e entrega as duas a
 * `resolveThemeMode` de `domain/theme.ts`, que decide entre elas (e explica por
 * que o modo derivado do SO não é persistido).
 *
 * Precisa rodar **antes** do primeiro `applyThemeMode` e uma vez só:
 * `nativeTheme.shouldUseDarkColors` só reflete o SO enquanto `themeSource` for
 * `'system'`. Depois de fixarmos o modo, ele responde o que fixamos — chamar
 * isto de novo devolveria a própria escolha, não a do usuário.
 */
export function resolveThemeMode(db: Database.Database): ThemeMode {
  const stored = makeSettingsRepository(db).get(THEME_MODE_KEY);
  current = resolveThemeModeRule(stored, nativeTheme.shouldUseDarkColors);
  return current;
}

/** O modo desta sessão. Só depois de `resolveThemeMode`. */
export function getThemeMode(): ThemeMode {
  if (!current) {
    throw new Error('resolveThemeMode precisa rodar antes de getThemeMode');
  }
  return current;
}

export function themeBackground(mode: ThemeMode): string {
  return BACKGROUND[mode];
}

/**
 * Aplica o modo ao que só o processo main controla: a moldura nativa (sem isso
 * a barra de título do Windows fica clara com o app escuro) e o fundo das
 * janelas vivas.
 *
 * O `setBackgroundColor` é o que impede a faixa branca de voltar quando o
 * usuário alterna o tema: `backgroundColor` é fixado na construção da janela e
 * não acompanharia a troca sozinho.
 */
export function applyThemeMode(mode: ThemeMode): void {
  current = mode;
  nativeTheme.themeSource = mode;
  for (const window of BrowserWindow.getAllWindows()) {
    window.setBackgroundColor(BACKGROUND[mode]);
  }
}
