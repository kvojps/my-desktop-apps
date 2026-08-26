import type { ScanPathEntity } from '../domain/scanPath';
import type { Repositories } from '../infra/database';
import type { FileSystemGateway } from '../infra/gateways/system/fileSystem';
import { AppError } from '../utils/errors/AppError';

/**
 * Os diretórios que o usuário cadastrou para serem varridos.
 *
 * As duas regras de cadastro moravam em camadas erradas: "o caminho existe?"
 * dentro do schema zod, e "já está cadastrado?" dentro do repositório. As duas
 * são decisão, e decisão é daqui.
 */
export function makeScanPathsService(repos: Repositories, fileSystem: FileSystemGateway) {
  return {
    list(): ScanPathEntity[] {
      return repos.scanPaths.list();
    },

    create(path: string): ScanPathEntity {
      if (!fileSystem.isDirectory(path)) {
        throw new AppError(400, 'O caminho informado não existe ou não é um diretório');
      }

      if (repos.scanPaths.findByPath(path)) {
        throw new AppError(409, `Diretório já cadastrado: ${path}`);
      }

      return repos.scanPaths.create({ path });
    },

    delete(id: string): void {
      repos.scanPaths.delete(id);
    },
  };
}

export type ScanPathsService = ReturnType<typeof makeScanPathsService>;
