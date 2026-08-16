import type {
  PrIntegrationStatus,
  PrProviderKind,
  PrProviderStatus,
  PullRequest,
  RepoRemote,
} from '@shared/types/pullRequest';
import type { RepoScanResult } from '@shared/types/repoScan';
import { mapWithConcurrency } from '../utils/concurrency';
import { commandExists, getCommandErrorMessage, runCommand } from '../utils/exec';
import { listPullRequestsWithGh } from './ghCli';
import { listPullRequestsWithToken } from './githubToken';
import { listMergeRequestsWithGlab } from './glabCli';

const PR_CONCURRENCY = 4;

interface CliAvailability {
  gh: boolean;
  ghAuthenticated: boolean;
  glab: boolean;
}

// Detectar CLI custa um processo por binário; o resultado praticamente não muda
// durante uma sessão, então fica em cache até alguém pedir explicitamente para
// redetectar (por exemplo depois de instalar o gh).
let cachedAvailability: CliAvailability | null = null;

async function isGhAuthenticated(): Promise<boolean> {
  try {
    await runCommand('gh', ['auth', 'status'], { timeoutMs: 15_000 });
    return true;
  } catch {
    return false;
  }
}

async function detectCliAvailability(): Promise<CliAvailability> {
  if (cachedAvailability) return cachedAvailability;

  const [gh, glab] = await Promise.all([commandExists('gh'), commandExists('glab')]);
  const ghAuthenticated = gh ? await isGhAuthenticated() : false;

  cachedAvailability = { gh, ghAuthenticated, glab };
  return cachedAvailability;
}

export function resetProviderDetection(): void {
  cachedAvailability = null;
}

export async function getIntegrationStatus(hasToken: boolean): Promise<PrIntegrationStatus> {
  const availability = await detectCliAvailability();

  const providers: PrProviderStatus[] = [
    {
      kind: 'gh-cli',
      available: availability.gh && availability.ghAuthenticated,
      detail: !availability.gh
        ? 'GitHub CLI (gh) não encontrado no PATH.'
        : availability.ghAuthenticated
          ? 'Pronto — usando a sessão já autenticada do gh.'
          : 'gh instalado, mas sem login. Rode "gh auth login".',
    },
    {
      kind: 'github-token',
      available: hasToken,
      detail: hasToken
        ? 'Token salvo no cofre do sistema.'
        : 'Nenhum token salvo. Use como alternativa se preferir não instalar o gh.',
    },
    {
      kind: 'glab-cli',
      available: availability.glab,
      detail: availability.glab
        ? 'Pronto — usando a sessão já autenticada do glab.'
        : 'GitLab CLI (glab) não encontrado no PATH.',
    },
  ];

  return {
    providers,
    anyAvailable: providers.some((provider) => provider.available),
    hasGithubToken: hasToken,
  };
}

/** Escolhe o provedor conforme o host do remote e o que está disponível. */
async function pickProvider(remote: RepoRemote, hasToken: boolean): Promise<PrProviderKind> {
  const availability = await detectCliAvailability();

  if (remote.kind === 'github') {
    if (availability.gh && availability.ghAuthenticated) return 'gh-cli';
    if (hasToken) return 'github-token';
    return 'none';
  }

  if (remote.kind === 'gitlab') {
    return availability.glab ? 'glab-cli' : 'none';
  }

  return 'none';
}

export interface PrFetchFailure {
  path: string;
  name: string;
  error: string;
}

export interface PrFetchOutcome {
  prsByPath: Map<string, PullRequest[]>;
  failures: PrFetchFailure[];
}

export interface FetchPullRequestsOptions {
  token: string | null;
  onProgress?: (done: number, total: number, current: string) => void;
}

/**
 * Busca PRs dos repositórios que têm remote reconhecido. Falha de um
 * repositório nunca derruba os demais: o erro é coletado e a lista segue.
 */
export async function fetchPullRequests(
  repos: RepoScanResult[],
  options: FetchPullRequestsOptions,
): Promise<PrFetchOutcome> {
  const hasToken = Boolean(options.token);
  const candidates = repos.filter((repo) => repo.remote && repo.remote.kind !== 'other');

  const prsByPath = new Map<string, PullRequest[]>();
  const failures: PrFetchFailure[] = [];
  let done = 0;

  await mapWithConcurrency(candidates, PR_CONCURRENCY, async (repo) => {
    const remote = repo.remote as RepoRemote;

    try {
      const provider = await pickProvider(remote, hasToken);

      if (provider === 'gh-cli') {
        prsByPath.set(repo.path, await listPullRequestsWithGh(repo.path));
      } else if (provider === 'glab-cli') {
        prsByPath.set(repo.path, await listMergeRequestsWithGlab(repo.path));
      } else if (provider === 'github-token' && options.token) {
        prsByPath.set(repo.path, await listPullRequestsWithToken(remote, options.token));
      }
    } catch (err) {
      failures.push({
        path: repo.path,
        name: repo.name,
        error: getCommandErrorMessage(err, 'Falha ao consultar os pull requests.'),
      });
    } finally {
      done++;
      options.onProgress?.(done, candidates.length, repo.name);
    }
  });

  return { prsByPath, failures };
}

/**
 * Cache em memória dos PRs por repositório. Consultar PRs vai à rede, então só
 * acontece no "Buscar do remoto"; uma releitura local reaproveita o que já foi
 * baixado em vez de esvaziar a tela.
 */
const prCache = new Map<string, PullRequest[]>();

export function updatePrCache(prsByPath: Map<string, PullRequest[]>): void {
  for (const [path, prs] of prsByPath) {
    prCache.set(path, prs);
  }
}

export function clearPrCache(): void {
  prCache.clear();
}

/** Anexa os PRs em cache e deriva o que depende do cruzamento com as branches locais. */
export function attachPullRequests(repos: RepoScanResult[]): RepoScanResult[] {
  return repos.map((repo) => {
    const prs = prCache.get(repo.path) ?? [];
    if (prs.length === 0) return { ...repo, prs, mergedBranchesToClean: [] };

    const localBranchNames = new Set(
      repo.branches.filter((branch) => !branch.isRemote).map((branch) => branch.name),
    );

    // Branch local que já teve seu PR mergeado: o trabalho está no remoto e a
    // branch ficou só ocupando espaço.
    const mergedBranchesToClean = Array.from(
      new Set(
        prs
          .filter((pr) => pr.state === 'merged' && localBranchNames.has(pr.headBranch))
          .map((pr) => pr.headBranch),
      ),
    );

    return { ...repo, prs, mergedBranchesToClean };
  });
}
