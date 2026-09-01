import fs from 'node:fs/promises';

/**
 * O disco visto como dependência, e não como import global — só o que o backup e
 * a exportação do plano precisam: ler um arquivo de texto inteiro, gravar um
 * arquivo de texto inteiro e gravar bytes crus (o PNG rasterizado pelo renderer
 * e o PDF impresso da janela).
 */
export interface FileSystemGateway {
  readFile(path: string): Promise<string>;
  writeFile(path: string, contents: string): Promise<void>;
  writeBytes(path: string, data: Uint8Array): Promise<void>;
}

export const fileSystem: FileSystemGateway = {
  readFile(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8');
  },

  writeFile(path: string, contents: string): Promise<void> {
    return fs.writeFile(path, contents, 'utf-8');
  },

  writeBytes(path: string, data: Uint8Array): Promise<void> {
    return fs.writeFile(path, data);
  },
};
