import fs from 'node:fs/promises';

/**
 * O disco visto como dependência, e não como import global — só o que o
 * backup precisa: ler e escrever um arquivo inteiro em texto.
 */
export interface FileSystemGateway {
  readFile(path: string): Promise<string>;
  writeFile(path: string, contents: string): Promise<void>;
}

export const fileSystem: FileSystemGateway = {
  readFile(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8');
  },

  writeFile(path: string, contents: string): Promise<void> {
    return fs.writeFile(path, contents, 'utf-8');
  },
};
