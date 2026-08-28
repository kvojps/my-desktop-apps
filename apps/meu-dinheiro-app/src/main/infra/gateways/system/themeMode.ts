import type Database from 'better-sqlite3';
import { BrowserWindow, nativeTheme } from 'electron';
import { THEME_MODE_KEY, type ThemeModeEntity, resolveThemeMode } from '../../../domain/theme';
import { getAppSetting } from '../../database/repositories/appSettingsRepository';

/** Igual a `background.default` do tema do renderer, por modo. */
const BACKGROUND: Record<ThemeModeEntity, string> = {
  light: '#F4F6FB',
  dark: '#10131C',
};

/**
 * Resolvido uma única vez no boot. Toda leitura posterior passa por aqui, e não
 * por `nativeTheme`, pelo motivo explicado em `domain/theme.ts`.
 */
let current: ThemeModeEntity | null = null;

/**
 * O modo a usar nesta sessão: o que está no banco ou, na falta dele, o do
 * sistema operacional. A decisão em si é a função pura `resolveThemeMode` de
 * `domain/theme.ts`; o que fica aqui é a leitura do banco e do `nativeTheme`.
 *
 * Precisa rodar **antes** do primeiro `applyThemeMode` e uma vez só:
 * `nativeTheme.shouldUseDarkColors` só reflete o SO enquanto `themeSource` for
 * `'system'`. Depois de fixarmos o modo, ele responde o que fixamos — chamar
 * isto de novo devolveria a própria escolha, não a do usuário.
 */
export function resolveInitialThemeMode(db: Database.Database): ThemeModeEntity {
  current = resolveThemeMode(getAppSetting(db, THEME_MODE_KEY), nativeTheme.shouldUseDarkColors);
  return current;
}

/** O modo desta sessão. Só depois de `resolveInitialThemeMode`. */
export function getThemeMode(): ThemeModeEntity {
  if (!current) {
    throw new Error('resolveInitialThemeMode precisa rodar antes de getThemeMode');
  }
  return current;
}

export function themeBackground(mode: ThemeModeEntity): string {
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
export function applyThemeMode(mode: ThemeModeEntity): void {
  current = mode;
  nativeTheme.themeSource = mode;
  for (const window of BrowserWindow.getAllWindows()) {
    window.setBackgroundColor(BACKGROUND[mode]);
  }
}
