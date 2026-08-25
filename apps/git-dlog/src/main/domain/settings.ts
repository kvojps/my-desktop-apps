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
 * A cifragem ainda mora dentro do repositório. Quando ela sair para
 * `infra/gateways/system/` (ticket 08), este é o tipo que o repositório guarda
 * e devolve, e que o gateway recebe para decifrar.
 */
export type EncryptedGithubTokenEntity = string;

/**
 * O que está guardado é texto livre: nada impede que a chave do tema tenha um
 * valor de uma versão antiga do app, ou escrito à mão no arquivo do banco.
 */
export function isThemeModeEntity(value: string): value is ThemeModeEntity {
  return value === 'light' || value === 'dark';
}
