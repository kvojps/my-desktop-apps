import type { ThemeMode } from '@shared/types/theme';

/** A chave sob a qual a preferência de tema fica guardada em `app_settings`. */
export const THEME_MODE_KEY = 'theme.mode';

/**
 * O que está guardado é texto livre: nada impede que a chave do tema traga um
 * valor de uma versão antiga do app, ou escrito à mão no arquivo do banco.
 */
export function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

/**
 * O modo a usar quando ainda não há escolha gravada: o do sistema operacional.
 *
 * Pura de propósito, e aqui e não no service: quem precisa dela é o bootstrap,
 * que por carve-out (ADR-0002) lê o tema direto do repositório, antes de haver
 * camada para atravessar. `domain/` é a única pasta que ele alcança sem montar
 * uma unidade de trabalho inteira para chegar a uma decisão de duas linhas.
 *
 * O modo derivado do SO **não** é persistido: gravar uma preferência que o
 * usuário nunca expressou faria toda mudança de tema do sistema ser ignorada
 * daí em diante (docs/design-system.md §5.1). A linha nasce no primeiro toggle.
 */
export function resolveThemeMode(
  stored: string | null,
  systemPrefersDark: boolean,
): ThemeMode {
  return isThemeMode(stored) ? stored : systemPrefersDark ? 'dark' : 'light';
}
