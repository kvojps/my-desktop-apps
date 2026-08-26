import type {
  PrIntegrationStatusEntity,
  PrProviderKindEntity,
  PrProviderStatusEntity,
  PullRequestEntity,
  RepoRemoteEntity,
} from '../domain/pullRequest';
import type { RepoFetchProgressEntity, RepoScanResultEntity } from '../domain/repo';
import { listPullRequestsWithGh } from '../infra/gateways/pr/ghCli';
import { listPullRequestsWithToken, verifyGithubToken } from '../infra/gateways/pr/githubToken';
import { listMergeRequestsWithGlab } from '../infra/gateways/pr/glabCli';
import { commandExists, getCommandErrorMessage, runCommand } from '../infra/gateways/system/exec';
import { mapWithConcurrency } from '../utils/concurrency';
import type { SettingsService } from './settingsService';

const PR_CONCURRENCY = 4;

interface CliAvailability {
  gh: boolean;
  ghAuthenticated: boolean;
  glab: boolean;
}

export interface PrFetchFailure {
  path: string;
  name: string;
  error: string;
}

export interface PrFetchOutcome {
  prsByPath: Map<string, PullRequestEntity[]>;
  failures: PrFetchFailure[];
}

export interface FetchPullRequestsOptions {
  /**
   * A consulta de PRs é a fase `'prs'` do "Buscar do remoto" — a mesma entidade
   * de progresso que o `fetchRepos` emite na fase `'git'`. Quem recebe não
   * precisa remontá-la campo a campo.
   */
  onProgress?: (progress: RepoFetchProgressEntity) => void;
}

async function isGhAuthenticated(): Promise<boolean> {
  try {
    await runCommand('gh', ['auth', 'status'], { timeoutMs: 15_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Pull requests: de onde eles vêm, quais existem e o que eles dizem sobre as
 * branches locais.
 *
 * O token não é dele — quem guarda e decifra é o `settingsService`, que chega
 * por parâmetro. O que é daqui é o que o token *significa* para a integração:
 * um provedor a mais quando o `gh` não está instalado.
 *
 * Os dois caches eram estado de módulo, o mais difícil de testar em `main/`:
 * duas variáveis vivas enquanto o processo viver, compartilhadas por qualquer
 * um que importasse o arquivo e sem forma de zerar entre um caso e outro. Como
 * estado da closure, cada `makePrsService` tem o seu.
 */
export function makePrsService(settings: SettingsService) {
  // Detectar CLI custa um processo por binário; o resultado praticamente não
  // muda durante uma sessão, então fica em cache até alguém pedir
  // explicitamente para redetectar (por exemplo depois de instalar o gh).
  let cachedAvailability: CliAvailability | null = null;

  /**
   * Cache em memória dos PRs por repositório. Consultar PRs vai à rede, então só
   * acontece no "Buscar do remoto"; uma releitura local reaproveita o que já foi
   * baixado em vez de esvaziar a tela.
   */
  const prCache = new Map<string, PullRequestEntity[]>();

  async function detectCliAvailability(): Promise<CliAvailability> {
    if (cachedAvailability) return cachedAvailability;

    const [gh, glab] = await Promise.all([commandExists('gh'), commandExists('glab')]);
    const ghAuthenticated = gh ? await isGhAuthenticated() : false;

    cachedAvailability = { gh, ghAuthenticated, glab };
    return cachedAvailability;
  }

  /** Escolhe o provedor conforme o host do remote e o que está disponível. */
  async function pickProvider(
    remote: RepoRemoteEntity,
    hasToken: boolean,
  ): Promise<PrProviderKindEntity> {
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

  async function getIntegrationStatus(): Promise<PrIntegrationStatusEntity> {
    const availability = await detectCliAvailability();
    const hasToken = settings.hasGithubToken();

    const providers: PrProviderStatusEntity[] = [
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

  return {
    getIntegrationStatus,

    /** Esquece a detecção de CLI e responde o estado já redetectado. */
    async redetectProviders(): Promise<PrIntegrationStatusEntity> {
      cachedAvailability = null;
      return getIntegrationStatus();
    },

    /**
     * Valida antes de gravar: salvar um token quebrado só adiaria o erro para o
     * próximo "Buscar do remoto", longe da tela onde ele foi digitado. Devolve
     * o login a quem o token pertence.
     */
    async saveGithubToken(token: string): Promise<string> {
      const login = await verifyGithubToken(token);
      settings.saveGithubToken(token);
      return login;
    },

    deleteGithubToken(): void {
      settings.deleteGithubToken();
    },

    /**
     * Busca PRs dos repositórios que têm remote reconhecido. Falha de um
     * repositório nunca derruba os demais: o erro é coletado e a lista segue.
     */
    async fetchPullRequests(
      repos: RepoScanResultEntity[],
      options: FetchPullRequestsOptions = {},
    ): Promise<PrFetchOutcome> {
      const token = settings.getGithubToken();
      const hasToken = Boolean(token);
      const candidates = repos.filter((repo) => repo.remote && repo.remote.kind !== 'other');

      const prsByPath = new Map<string, PullRequestEntity[]>();
      const failures: PrFetchFailure[] = [];
      let done = 0;

      await mapWithConcurrency(candidates, PR_CONCURRENCY, async (repo) => {
        const remote = repo.remote as RepoRemoteEntity;

        try {
          const provider = await pickProvider(remote, hasToken);

          if (provider === 'gh-cli') {
            prsByPath.set(repo.path, await listPullRequestsWithGh(repo.path));
          } else if (provider === 'glab-cli') {
            prsByPath.set(repo.path, await listMergeRequestsWithGlab(repo.path));
          } else if (provider === 'github-token' && token) {
            prsByPath.set(repo.path, await listPullRequestsWithToken(remote, token));
          }
        } catch (err) {
          failures.push({
            path: repo.path,
            name: repo.name,
            error: getCommandErrorMessage(err, 'Falha ao consultar os pull requests.'),
          });
        } finally {
          done++;
          options.onProgress?.({
            phase: 'prs',
            done,
            total: candidates.length,
            current: repo.name,
          });
        }
      });

      return { prsByPath, failures };
    },

    updatePrCache(prsByPath: Map<string, PullRequestEntity[]>): void {
      for (const [path, prs] of prsByPath) {
        prCache.set(path, prs);
      }
    },

    clearPrCache(): void {
      prCache.clear();
    },

    /** Anexa os PRs em cache e deriva o que depende do cruzamento com as branches locais. */
    attachPullRequests(repos: RepoScanResultEntity[]): RepoScanResultEntity[] {
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
    },
  };
}

export type PrsService = ReturnType<typeof makePrsService>;
