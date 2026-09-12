import type { CSSProperties } from 'react';
import type { ThemeMode } from './themeModeContext';

/**
 * Caminhos, hashes e nomes de branch são metade do conteúdo do app. O
 * `monospace` genérico cai no Courier New no Windows, então a fonte vai
 * empacotada e declarada, com os monoespaçados de sistema como fallback.
 *
 * Uso: `fontFamily="mono"` — o sx resolve a chave pelo tema.
 */
const MONO_FONT_FAMILY = '"JetBrains Mono", "Cascadia Code", Consolas, "SF Mono", Menlo, monospace';

/**
 * `SURFACE_RADIUS` cobre cards, papers e diálogos; `CONTROL_RADIUS` fica
 * sempre um degrau abaixo, para botões, inputs, toggles e ladrilhos de ícone
 * (docs/design-system.md §2).
 */
export const SURFACE_RADIUS = 10;
export const CONTROL_RADIUS = 6;

// Rótulo correto por §1.3 do design system: branco no claro e
// rgba(0,0,0,0.87) no escuro para toda cor de estado, exceto warning, que é
// preto nos dois modos.
const stateContrastText = (mode: ThemeMode) =>
  mode === 'light' ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)';
const WARNING_CONTRAST_TEXT = 'rgba(0, 0, 0, 0.87)';

/**
 * Os valores do tema do piloto, num lugar só. A paleta MUI e as variáveis CSS
 * que o Tailwind consome são duas leituras da mesma tabela — quando estavam
 * escritas duas vezes, nada impedia que divergissem em silêncio.
 * Medições e procedência em `apps/git-dlog/docs/orca-theme.md`.
 */
const uiTokens = (mode: ThemeMode) => {
  const light = mode === 'light';
  return {
    background: light ? '#ffffff' : '#0a0a0a',
    paper: light ? '#ffffff' : '#171717',
    sidebar: light ? '#fafafa' : '#171717',
    foreground: light ? '#0a0a0a' : '#fafafa',
    mutedForeground: light ? '#666666' : '#a1a1a1',
    accent: light ? '#f5f5f5' : '#262626',
    border: light ? '#e5e5e5' : 'rgba(255, 255, 255, 0.07)',
    focus: light ? '#2771CA' : '#3987e5',
    primary: light ? '#2771CA' : '#3987e5',
    secondary: light ? '#4a3aa7' : '#9085e9',
    success: light ? '#0a7d0a' : '#0ca30c',
    danger: light ? '#CF3939' : '#D85B5B',
    info: light ? '#0F7C91' : '#1190A9',
    /** Só preenchimento — nunca texto (design system §1.4): 1.70:1 sobre papel claro. */
    warning: '#fab219',
    onColor: stateContrastText(mode),
  };
};

/** Variáveis consumidas pelo Tailwind e pelos componentes locais do piloto. */
export function getThemeVariables(mode: ThemeMode): CSSProperties {
  const ui = uiTokens(mode);
  return {
    '--dlog-background': ui.background,
    '--dlog-paper': ui.paper,
    '--dlog-sidebar': ui.sidebar,
    '--dlog-foreground': ui.foreground,
    '--dlog-muted-foreground': ui.mutedForeground,
    '--dlog-accent': ui.accent,
    '--dlog-border': ui.border,
    '--dlog-focus': ui.focus,
    '--dlog-primary': ui.primary,
    '--dlog-success': ui.success,
    '--dlog-danger': ui.danger,
    '--dlog-warning': ui.warning,
    '--dlog-on-color': ui.onColor,
    '--dlog-on-warning': WARNING_CONTRAST_TEXT,
    '--dlog-mono': MONO_FONT_FAMILY,
  } as CSSProperties;
}
