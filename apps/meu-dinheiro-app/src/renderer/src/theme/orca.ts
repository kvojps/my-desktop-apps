import type { PaletteMode } from '@mui/material';

/** Tokens das superfícies migradas; MUI mantém sua paleta até a migração da tela. */
export function getOrcaVariables(mode: PaletteMode): Record<string, string> {
  const light = mode === 'light';
  return {
    '--money-background': light ? '#ffffff' : '#0a0a0a',
    '--money-paper': light ? '#ffffff' : '#171717',
    '--money-sidebar': light ? '#fafafa' : '#171717',
    '--money-foreground': light ? '#0a0a0a' : '#fafafa',
    '--money-muted': light ? '#666666' : '#a1a1a1',
    '--money-accent': light ? '#f5f5f5' : '#262626',
    '--money-border': light ? '#e5e5e5' : '#272727',
    '--money-focus': light ? '#2771ca' : '#3987e5',
    '--money-primary': light ? '#0a0a0a' : '#fafafa',
    '--money-on-primary': light ? '#fafafa' : '#0a0a0a',
    '--money-danger': light ? '#b42318' : '#ff8a80',
    '--money-font': '"Geist", system-ui, sans-serif',
    '--money-mono': 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  };
}
