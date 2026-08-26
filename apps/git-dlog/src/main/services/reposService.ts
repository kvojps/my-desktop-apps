import type {
  RepoFetchProgressEntity,
  RepoFetchResultEntity,
  RepoScanResultEntity,
} from '../domain/repo';
import type { Repositories } from '../infra/database';
import { fetchRepos, filterReposWithRemote } from '../infra/gateways/git/repoFetcher';
import { listRepoDirs, scanRepos } from '../infra/gateways/git/repoScanner';
import type { PrsService } from './prsService';

export interface FetchOptions {
  /**
   * O progresso sai daqui como entidade e o service não sabe para onde ele vai.
   * Quem o transforma em mensagem de IPC é o controller: `event.sender` é
   * fronteira de IPC e não atravessa para cá.
   */
  onProgress?: (progress: RepoFetchProgressEntity) => void;
}

/**
 * A varredura dos repositórios git e a busca do que está no remoto.
 *
 * É o único fluxo do app com orquestração de verdade, e era o exemplo do
 * problema que a camada resolve: ele morava inteiro dentro do handler de
 * `repos:fetch`.
 */
export function makeReposService(repos: Repositories, prs: PrsService) {
  function baseDirs(): string[] {
    return repos.scanPaths.list().map((scanPath) => scanPath.path);
  }

  return {
    /** Leitura local: lê o disco e anexa os PRs que já estiverem em cache. */
    async scan(): Promise<RepoScanResultEntity[]> {
      return prs.attachPullRequests(await scanRepos(await listRepoDirs(baseDirs())));
    },

    /**
     * Busca do remoto: `git fetch` nos repositórios pedidos, varredura de todos
     * e consulta de pull requests.
     */
    async fetch(
      requestedPaths: string[] | null | undefined,
      options: FetchOptions = {},
    ): Promise<RepoFetchResultEntity> {
      const repoDirs = await listRepoDirs(baseDirs());

      // O filtro é a própria validação: só entram caminhos que a varredura
      // encontrou nos diretórios cadastrados.
      const target = requestedPaths?.length
        ? repoDirs.filter((repoDir) => requestedPaths.includes(repoDir))
        : repoDirs;

      const failures = await fetchRepos(await filterReposWithRemote(target), {
        onProgress: options.onProgress,
      });

      // A varredura precisa vir antes dos PRs: é ela que descobre o remote de
      // cada repositório, que é o que diz onde procurar os pull requests.
      const scanned = await scanRepos(repoDirs);

      const { prsByPath, failures: prFailures } = await prs.fetchPullRequests(scanned, {
        onProgress: options.onProgress,
      });
      prs.updatePrCache(prsByPath);

      return { results: prs.attachPullRequests(scanned), failures, prFailures };
    },
  };
}

export type ReposService = ReturnType<typeof makeReposService>;
