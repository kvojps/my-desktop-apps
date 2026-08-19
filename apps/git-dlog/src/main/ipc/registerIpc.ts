import type Database from 'better-sqlite3';
import { app, shell } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc/channels';
import type { PrIntegrationStatus } from '@shared/types/pullRequest';
import type { RepoFetchResult } from '@shared/types/repoScan';
import type { ThemeMode } from '@shared/types/theme';
import { addScanPath, deleteScanPath, getAllScanPaths } from '../db/scanPathsRepository';
import {
  deleteGithubToken,
  getGithubToken,
  hasGithubToken,
  saveGithubToken,
  saveThemeMode,
} from '../db/settingsRepository';
import { fetchRepos, filterReposWithRemote } from '../git/repoFetcher';
import { listRepoDirs, scanRepos } from '../git/repoScanner';
import { verifyGithubToken } from '../pr/githubToken';
import {
  attachPullRequests,
  fetchPullRequests,
  getIntegrationStatus,
  resetProviderDetection,
  updatePrCache,
} from '../pr/prService';
import { externalUrlSchema, githubTokenSchema } from '../schemas/prs.schema';
import { fetchReposSchema } from '../schemas/repoFetch.schema';
import { createScanPathSchema } from '../schemas/scanPath.schema';
import { themeModeSchema } from '../schemas/settings.schema';
import { parseId } from '../utils/parseId';
import { parseOrThrow } from '../utils/validate';
import { registerDialogHandlers } from './dialogHandlers';
import { handle } from './handle';

interface RegisterIpcOptions {
  /** Aplica o novo modo à janela (nativeTheme, backgroundColor) além de persistir. */
  onThemeModeChange: (mode: ThemeMode) => void;
}

export function registerIpcHandlers(db: Database.Database, options: RegisterIpcOptions): void {
  registerDialogHandlers();

  handle(IPC_CHANNELS.scanPathsGetAll, () => getAllScanPaths(db));
  handle(IPC_CHANNELS.scanPathsAdd, (_event, data: unknown) =>
    addScanPath(db, { path: parseOrThrow(createScanPathSchema, data) }),
  );
  handle(IPC_CHANNELS.scanPathsDelete, (_event, id: unknown) => deleteScanPath(db, parseId(id)));

  function getBaseDirs(): string[] {
    return getAllScanPaths(db).map((scanPath) => scanPath.path);
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
      token: getGithubToken(db),
      onProgress: (done, total, current) => sendProgress({ phase: 'prs', done, total, current }),
    });
    updatePrCache(prsByPath);

    return { results: attachPullRequests(scanned), failures, prFailures };
  });

  function integrationStatus(): Promise<PrIntegrationStatus> {
    return getIntegrationStatus(hasGithubToken(db));
  }

  handle(IPC_CHANNELS.prsGetStatus, () => integrationStatus());

  handle(IPC_CHANNELS.prsSaveToken, async (_event, data: unknown) => {
    const token = parseOrThrow(githubTokenSchema, data);
    // Valida antes de gravar: salvar um token quebrado só adiaria o erro para
    // o próximo "Buscar do remoto", longe da tela onde ele foi digitado.
    const login = await verifyGithubToken(token);
    saveGithubToken(db, token);
    return login;
  });

  handle(IPC_CHANNELS.prsDeleteToken, () => {
    deleteGithubToken(db);
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
    saveThemeMode(db, mode);
    options.onThemeModeChange(mode);
  });
}
