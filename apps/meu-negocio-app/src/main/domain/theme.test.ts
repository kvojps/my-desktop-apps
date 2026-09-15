import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WINDOW_BACKGROUND, resolveThemeMode } from './theme';

describe('resolveThemeMode', () => {
  it('prefers the stored choice over the system preference', () => {
    expect(resolveThemeMode('light', true)).toBe('light');
    expect(resolveThemeMode('dark', false)).toBe('dark');
  });

  it('falls back to the system preference when nothing valid is stored', () => {
    expect(resolveThemeMode(null, true)).toBe('dark');
    expect(resolveThemeMode('sepia', false)).toBe('light');
  });
});

/**
 * O fundo que a janela recebe antes de existir renderer é o token
 * `background` da base local: a linha "background (janela)" da tabela de
 * docs/orca-theme.md. O renderer é conferido contra a mesma linha em
 * `renderer/src/theme/tokens.test.ts`, então os três lados só podem concordar.
 */
describe('WINDOW_BACKGROUND', () => {
  it('matches the background row of docs/orca-theme.md in both modes', () => {
    const doc = readFileSync(new URL('../../../docs/orca-theme.md', import.meta.url), 'utf8');
    const row = /^\| background \(janela\)\s*\|\s*`(#[0-9a-f]{6})`\s*\|\s*`(#[0-9a-f]{6})`/m.exec(
      doc,
    );
    expect(row).not.toBeNull();
    expect(WINDOW_BACKGROUND.light).toBe(row![1]);
    expect(WINDOW_BACKGROUND.dark).toBe(row![2]);
  });
});
