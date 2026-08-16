export interface AppInfo {
  /** Versão do package.json, a mesma exibida no instalador. */
  version: string;
  /** Caminho do arquivo .db em disco — é o que o usuário precisa informar quando pede suporte. */
  dbPath: string;
}
