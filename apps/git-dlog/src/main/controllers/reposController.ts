import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { RepoFetchResult, RepoScanResult } from '@shared/types/repoScan';
import type { ReposService } from '../services/reposService';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import {
  repoFetchProgressToResponse,
  repoFetchResultToResponse,
  repoScanResultToResponse,
} from './responses/repo.response';
import { fetchReposSchema } from './schemas/repoFetch.schema';

/**
 * A varredura local e a busca do remoto. O fluxo inteiro é do `reposService`;
 * o que sobrou aqui é a fronteira — validar a entrada, traduzir a saída e ser
 * o único ponto que toca o `event`.
 */
export function registerReposController(repos: ReposService): void {
  handle(IPC_CHANNELS.reposScan, async (): Promise<RepoScanResult[]> =>
    (await repos.scan()).map(repoScanResultToResponse),
  );

  handle(IPC_CHANNELS.reposFetch, async (event, data: unknown): Promise<RepoFetchResult> => {
    const requestedPaths = parseOrThrow(fetchReposSchema, data);

    // O progresso é o único ponto do fluxo que precisa do `event`: o service
    // avisa que andou, e traduzir isso em mensagem para a janela é daqui.
    const result = await repos.fetch(requestedPaths, {
      onProgress: (progress) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(IPC_CHANNELS.reposFetchProgress, repoFetchProgressToResponse(progress));
        }
      },
    });

    return repoFetchResultToResponse(result);
  });
}
