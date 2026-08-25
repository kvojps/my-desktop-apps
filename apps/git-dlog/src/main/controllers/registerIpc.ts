import type Database from 'better-sqlite3';
import { app, shell } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { PrIntegrationStatus } from '@shared/types/pullRequest';
import type { RepoFetchResult } from '@shared/types/repoScan';
import type { ThemeMode } from '@shared/types/theme';
import { makeRepositories } from '../infra/database';
import { fetchRepos, filterReposWithRemote } from '../infra/gateways/git/repoFetcher';
import { listRepoDirs, scanRepos } from '../infra/gateways/git/repoScanner';
import { verifyGithubToken } from '../infra/gateways/pr/githubToken';
import {
  attachPullRequests,
  fetchPullRequests,
  getIntegrationStatus,
  resetProviderDetection,
  updatePrCache,
} from '../services/prsService';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { handle } from './handle';
import { externalUrlSchema, githubTokenSchema } from './schemas/prs.schema';
import { fetchReposSchema } from './schemas/repoFetch.schema';
import { createScanPathSchema } from './schemas/scanPath.schema';
import { themeModeSchema } from './schemas/settings.schema';
import { registerDialogHandlers } from './systemController';

interface RegisterIpcOptions {
  /** Aplica o novo modo à janela (nativeTheme, backgroundColor) além de persistir. */
  onThemeModeChange: (mode: ThemeMode) => void;
}

export function registerIpcHandlers(db: Database.Database, options: RegisterIpcOptions): void {
  const repos = makeRepositories(db);

  registerDialogHandlers();

  // Os repositórios já falam entidade (`ScanPathEntity`, `ThemeModeEntity`), e
  // por ora ela atravessa o IPC sem mapper nos dois sentidos, aqui e no canal
  // de tema lá embaixo: as formas são idênticas às de `@shared` hoje, e só por
  // isso typecheca. Quem fecha a segunda travessia (README §2.5) é o ticket 09,
  // com os controllers.
  handle(IPC_CHANNELS.scanPathsGetAll, () => repos.scanPaths.list());
  handle(IPC_CHANNELS.scanPathsAdd, (_event, data: unknown) =>
    repos.scanPaths.create({ path: parseOrThrow(createScanPathSchema, data) }),
  );
  handle(IPC_CHANNELS.scanPathsDelete, (_event, id: unknown) =>
    repos.scanPaths.delete(parseId(id)),
  );

  function getBaseDirs(): string[] {
    return repos.scanPaths.list().map((scanPath) => scanPath.path);
  }

  handle(IPC_CHANNELS.reposScan, async () =>
    attachPullRequests(await scanRepos(await listRepoDirs(getBaseDirs()))),
  );

  handle(IPC_CHANNELS.reposFetch, async (event, data: unknown): Promise<RepoFetchResult> => {
    const requestedPaths = parseOrThrow(fetchReposSchema, data);
    const repoDirs = await listRepoDirs(getBaseDirs());

    // O filtro é a própria validação: só entram caminhos que a varredura
    // encontrou nos diretórios cadastrados.
    const target = requestedPaths?.length
      ? repoDirs.filter((repoDir) => requestedPaths.includes(repoDir))
      : repoDirs;

    function sendProgress(progress: unknown) {
      if (!event.sender.isDestroyed()) {
        event.sender.send(IPC_CHANNELS.reposFetchProgress, progress);
      }
    }

    const failures = await fetchRepos(await filterReposWithRemote(target), {
      onProgress: sendProgress,
    });

    // A varredura precisa vir antes dos PRs: é ela que descobre o remote de
    // cada repositório, que é o que diz onde procurar os pull requests.
    const scanned = await scanRepos(repoDirs);

    const { prsByPath, failures: prFailures } = await fetchPullRequests(scanned, {
      token: repos.settings.getGithubToken(),
      onProgress: (done, total, current) => sendProgress({ phase: 'prs', done, total, current }),
    });
    updatePrCache(prsByPath);

    return { results: attachPullRequests(scanned), failures, prFailures };
  });

  function integrationStatus(): Promise<PrIntegrationStatus> {
    return getIntegrationStatus(repos.settings.hasGithubToken());
  }

  handle(IPC_CHANNELS.prsGetStatus, () => integrationStatus());

  handle(IPC_CHANNELS.prsSaveToken, async (_event, data: unknown) => {
    const token = parseOrThrow(githubTokenSchema, data);
    // Valida antes de gravar: salvar um token quebrado só adiaria o erro para
    // o próximo "Buscar do remoto", longe da tela onde ele foi digitado.
    const login = await verifyGithubToken(token);
    repos.settings.saveGithubToken(token);
    return login;
  });

  handle(IPC_CHANNELS.prsDeleteToken, () => {
    repos.settings.deleteGithubToken();
  });

  handle(IPC_CHANNELS.prsRedetect, () => {
    resetProviderDetection();
    return integrationStatus();
  });

  handle(IPC_CHANNELS.shellOpenExternal, async (_event, data: unknown) => {
    await shell.openExternal(parseOrThrow(externalUrlSchema, data));
  });

  handle(IPC_CHANNELS.dataOpenFolder, async () => {
    await shell.openPath(app.getPath('userData'));
  });

  handle(IPC_CHANNELS.settingsSaveThemeMode, (_event, data: unknown) => {
    const mode = parseOrThrow(themeModeSchema, data);
    repos.settings.saveThemeMode(mode);
    options.onThemeModeChange(mode);
  });
}
