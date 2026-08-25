/**
 * O que a tela de Configurações mostra sobre a instalação: a versão que está
 * rodando e onde o banco mora em disco.
 *
 * São as duas coisas que ninguém consegue descobrir sozinho e que toda conversa
 * de suporte pede na primeira pergunta — e o caminho é também o que se procura
 * ao trocar de computador.
 */
export interface AppInfo {
  version: string;
  dbPath: string;
}
