/**
 * `settings` é uma tabela chave-valor, então não há entidade rica a modelar
 * aqui: o que este arquivo carrega são os tipos do que está guardado em cada
 * chave. O porquê do sufixo `Entity` está em `domain/scanPath.ts`.
 */

/** A preferência de tema, como está no banco. */
export type ThemeModeEntity = 'light' | 'dark';

/**
 * O token do GitHub como ele está no banco: cifrado e codificado em base64,
 * nunca em texto puro. O tipo nomeia a diferença entre o token que o usuário
 * digitou e o que é gravado — as duas formas são `string`, e é fácil trocar uma
 * pela outra sem querer.
 *
 * É esta forma que o repositório guarda e devolve; cifrar e decifrar é do
 * `safeStorageVault` de `infra/gateways/system/`, e quem costura os dois é o
 * `settingsService`.
 */
export type EncryptedGithubTokenEntity = string;

/**
 * O que está guardado é texto livre: nada impede que a chave do tema tenha um
 * valor de uma versão antiga do app, ou escrito à mão no arquivo do banco.
 */
export function isThemeModeEntity(value: string): value is ThemeModeEntity {
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
  stored: ThemeModeEntity | null,
  systemPrefersDark: boolean,
): ThemeModeEntity {
  return stored ?? (systemPrefersDark ? 'dark' : 'light');
}
