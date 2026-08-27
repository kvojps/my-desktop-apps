import type Database from 'better-sqlite3';
import { BrowserWindow, nativeTheme } from 'electron';
import type { ThemeMode } from '@shared/types/theme';
import { makeAppSettingsRepository } from '../../database/repositories/appSettingsRepository';

export const THEME_MODE_KEY = 'theme.mode';

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
 * O modo a usar nesta sessão: o que está no banco ou, na falta dele, o do
 * sistema operacional.
 *
 * Precisa rodar **antes** do primeiro `applyThemeMode` e uma vez só:
 * `nativeTheme.shouldUseDarkColors` só reflete o SO enquanto `themeSource` for
 * `'system'`. Depois de fixarmos o modo, ele responde o que fixamos — chamar
 * isto de novo devolveria a própria escolha, não a do usuário.
 *
 * Quando não há valor gravado, o modo derivado do SO **não** é persistido:
 * gravar uma preferência que o usuário nunca expressou faria toda mudança de
 * tema do sistema ser ignorada daí em diante. A linha nasce no primeiro toggle.
 */
export function resolveThemeMode(db: Database.Database): ThemeMode {
  // Lê direto do repositório, não de `makeRepositories(db)`: o carve-out do
  // ADR-0002 autoriza o bootstrap a alcançar um getter sem montar (e descartar)
  // uma unidade de trabalho inteira só para isso.
  const stored = makeAppSettingsRepository(db).getAppSetting(THEME_MODE_KEY);
  current =
    stored === 'light' || stored === 'dark'
      ? stored
      : nativeTheme.shouldUseDarkColors
        ? 'dark'
        : 'light';
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
