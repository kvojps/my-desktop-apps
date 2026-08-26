import type Database from 'better-sqlite3';
import { app, shell } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { PrIntegrationStatus } from '@shared/types/pullRequest';
import type { RepoFetchResult } from '@shared/types/repoScan';
import { makeRepositories } from '../infra/database';
import { fileSystem } from '../infra/gateways/system/fileSystem';
import { safeStorageVault } from '../infra/gateways/system/safeStorage';
import { theme } from '../infra/gateways/system/theme';
import { makePrsService } from '../services/prsService';
import { makeReposService } from '../services/reposService';
import { makeScanPathsService } from '../services/scanPathsService';
import { makeSettingsService } from '../services/settingsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { externalUrlSchema, githubTokenSchema } from './schemas/prs.schema';
import { fetchReposSchema } from './schemas/repoFetch.schema';
import { createScanPathSchema } from './schemas/scanPath.schema';
import { themeModeSchema } from './schemas/settings.schema';
import { registerDialogHandlers } from './systemController';

export function registerIpcHandlers(db: Database.Database): void {
  const repos = makeRepositories(db);
  const settingsService = makeSettingsService(repos, safeStorageVault, theme);
  const scanPathsService = makeScanPathsService(repos, fileSystem);
  const prsService = makePrsService(settingsService);
  const reposService = makeReposService(repos, prsService);

  registerDialogHandlers();

  // Repositórios, gateways e services já falam entidade (`ScanPathEntity`,
  // `ThemeModeEntity`, `RepoScanResultEntity`, `PrIntegrationStatusEntity`), e
  // por ora ela atravessa o IPC sem mapper nos dois sentidos — nos canais de
  // `scanPaths` daqui, nos de repos e PRs abaixo e no de tema lá no fim. As
  // formas são idênticas às de `@shared` hoje, e só por isso typecheca. Quem
  // fecha a segunda travessia (README §2.5) é o ticket 09, com os controllers.
  //
  // Até lá, o que sai daqui continua anotado com o tipo de `@shared`, não com a
  // entidade: a anotação é a única coisa que ainda confere se o que atravessa o
  // canal casa com o contrato que o renderer espera, já que o `invoke` do
  // preload não checa nada em runtime. Trocá-la pela entidade calaria o
  // compilador justamente onde falta o mapper.
  handle(IPC_CHANNELS.scanPathsGetAll, () => scanPathsService.list());
  handle(IPC_CHANNELS.scanPathsAdd, (_event, data: unknown) =>
    scanPathsService.create(parseOrThrow(createScanPathSchema, data)),
  );
  handle(IPC_CHANNELS.scanPathsDelete, (_event, id: unknown) =>
    scanPathsService.delete(parseId(id)),
  );

  handle(IPC_CHANNELS.reposScan, () => reposService.scan());

  handle(IPC_CHANNELS.reposFetch, async (event, data: unknown): Promise<RepoFetchResult> => {
    const requestedPaths = parseOrThrow(fetchReposSchema, data);

    // O progresso é o único ponto do fluxo que precisa do `event`: o service
    // avisa que andou, e traduzir isso em mensagem para a janela é daqui.
    return reposService.fetch(requestedPaths, {
      onProgress: (progress) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send(IPC_CHANNELS.reposFetchProgress, progress);
        }
      },
    });
  });

  handle(IPC_CHANNELS.prsGetStatus, (): Promise<PrIntegrationStatus> =>
    prsService.getIntegrationStatus(),
  );

  handle(IPC_CHANNELS.prsSaveToken, (_event, data: unknown) =>
    prsService.saveGithubToken(parseOrThrow(githubTokenSchema, data)),
  );

  handle(IPC_CHANNELS.prsDeleteToken, () => {
    prsService.deleteGithubToken();
  });

  handle(IPC_CHANNELS.prsRedetect, (): Promise<PrIntegrationStatus> =>
    prsService.redetectProviders(),
  );

  handle(IPC_CHANNELS.shellOpenExternal, async (_event, data: unknown) => {
    await shell.openExternal(parseOrThrow(externalUrlSchema, data));
  });

  handle(IPC_CHANNELS.dataOpenFolder, async () => {
    await shell.openPath(app.getPath('userData'));
  });

  handle(IPC_CHANNELS.settingsSaveThemeMode, (_event, data: unknown) => {
    settingsService.saveThemeMode(parseOrThrow(themeModeSchema, data));
  });
}
