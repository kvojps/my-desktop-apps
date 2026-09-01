/**
 * `theme` não tem entidade rica a modelar: o que as camadas trocam é a
 * preferência de modo, e é só isso que este arquivo nomeia. Espelha o
 * `domain/theme.ts` do `meu-negocio-app` e do `meu-dinheiro-app`; o porquê do
 * sufixo `Entity` está em `domain/project.ts`.
 */
export type ThemeModeEntity = 'light' | 'dark';

/** A chave sob a qual a preferência de tema fica guardada em `settings`. */
export const THEME_MODE_KEY = 'theme.mode';

/**
 * O que está guardado é texto livre: nada impede que a chave do tema traga um
 * valor de uma versão antiga do app, ou escrito à mão no arquivo do banco.
 */
export function isThemeModeEntity(value: string | null): value is ThemeModeEntity {
  return value === 'light' || value === 'dark';
}

/**
 * O modo a usar nesta sessão: o que está no banco ou, na falta dele, o do
 * sistema operacional.
 *
 * Pura de propósito, e em `domain/` e não no gateway: quem precisa dela é o
 * bootstrap, que por carve-out (ADR-0002) resolve o tema antes de existir
 * camada para atravessar. O gateway `infra/gateways/system/themeMode.ts` faz a
 * leitura do banco e do `nativeTheme` e delega a decisão para cá.
 *
 * O modo derivado do SO **não** é persistido: gravar uma preferência que o
 * usuário nunca expressou faria toda mudança de tema do sistema ser ignorada
 * daí em diante (docs/design-system.md §5.1). A linha nasce no primeiro toggle.
 */
export function resolveThemeMode(
  stored: string | null,
  systemPrefersDark: boolean,
): ThemeModeEntity {
  return isThemeModeEntity(stored) ? stored : systemPrefersDark ? 'dark' : 'light';
}
