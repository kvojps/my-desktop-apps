import path from 'node:path';
import type { RepoFetchFailure, RepoFetchProgress } from '@shared/types/repoScan';
import { mapWithConcurrency } from '../utils/concurrency';
import { getGitErrorMessage, runGit } from './gitCommand';
import { hasAnyRemote } from './repoScanner';

// Fetch é I/O de rede: mais paralelismo que isso costuma só disputar banda e
// multiplicar timeouts em repositórios grandes.
const FETCH_CONCURRENCY = 4;

// Teto por repositório. Sem isso, um remoto inacessível seguraria a operação
// inteira até o TCP desistir sozinho.
const FETCH_TIMEOUT_MS = 60_000;

export interface FetchReposOptions {
  onProgress?: (progress: RepoFetchProgress) => void;
}

/**
 * Atualiza as refs remotas dos repositórios informados.
 *
 * `--prune` é o que faz as branches deletadas no remoto virarem `[gone]` na
 * varredura seguinte; sem ele, refs mortas ficam para sempre. Nada aqui toca a
 * working tree nem move branches locais: fetch é estritamente aditivo.
 */
export async function fetchRepos(
  repoDirs: string[],
  options: FetchReposOptions = {},
): Promise<RepoFetchFailure[]> {
  const failures: RepoFetchFailure[] = [];
  let done = 0;

  await mapWithConcurrency(repoDirs, FETCH_CONCURRENCY, async (repoDir) => {
    const name = path.basename(repoDir);

    try {
      await runGit(repoDir, ['fetch', '--all', '--prune', '--quiet'], {
        network: true,
        timeoutMs: FETCH_TIMEOUT_MS,
      });
    } catch (err) {
      failures.push({
        path: repoDir,
        name,
        error: getGitErrorMessage(err, 'Falha ao buscar do remoto.'),
      });
    } finally {
      done++;
      options.onProgress?.({ phase: 'git', done, total: repoDirs.length, current: name });
    }
  });

  return failures;
}

/**
 * Repositórios sem nenhum remoto configurado não têm o que buscar. A checagem
 * lê o `.git/config` em vez de rodar `git remote`, para não gastar um processo
 * por repositório antes mesmo do fetch começar.
 */
export async function filterReposWithRemote(repoDirs: string[]): Promise<string[]> {
  const flags = await mapWithConcurrency(repoDirs, 16, hasAnyRemote);
  return repoDirs.filter((_, index) => flags[index]);
}
