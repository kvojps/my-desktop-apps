import fs from 'node:fs';

/**
 * O disco visto como dependência, e não como import global. Existe porque a
 * pergunta "esse diretório existe?" é regra — quem a faz é o
 * `scanPathsService` —, e regra que chama `node:fs` direto não tem como ser
 * exercitada sem um diretório de verdade no sistema de arquivos.
 */
export interface FileSystemGateway {
  isDirectory(path: string): boolean;
}

export const fileSystem: FileSystemGateway = {
  isDirectory(path: string): boolean {
    return fs.existsSync(path) && fs.statSync(path).isDirectory();
  },
};
