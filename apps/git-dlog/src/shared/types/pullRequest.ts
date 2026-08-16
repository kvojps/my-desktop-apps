export type PullRequestState = 'open' | 'merged' | 'closed';

/** Resultado da revisão, quando o provedor informa. */
export type ReviewDecision = 'approved' | 'changes_requested' | 'review_required' | null;

/** Consolidado do CI sobre o commit de topo do PR. */
export type ChecksState = 'passing' | 'failing' | 'pending' | null;

export interface PullRequest {
  number: number;
  title: string;
  url: string;
  state: PullRequestState;
  isDraft: boolean;
  /** Branch de origem — é o que liga o PR a uma branch local. */
  headBranch: string;
  baseBranch: string;
  author: string;
  reviewDecision: ReviewDecision;
  checks: ChecksState;
  updatedAt: string;
}

export type RemoteKind = 'github' | 'gitlab' | 'other';

export interface RepoRemote {
  /** Nome do remote no git (`origin`). */
  name: string;
  url: string;
  host: string;
  /** Dono ou grupo; no GitLab pode ter subgrupos (`grupo/subgrupo`). */
  owner: string;
  repo: string;
  /** URL navegável do projeto. */
  webUrl: string;
  kind: RemoteKind;
}

export type PrProviderKind = 'gh-cli' | 'glab-cli' | 'github-token' | 'none';

export interface PrProviderStatus {
  kind: PrProviderKind;
  available: boolean;
  /** Mensagem pronta para a UI explicando o estado. */
  detail: string;
}

export interface PrIntegrationStatus {
  providers: PrProviderStatus[];
  /** Algum provedor utilizável foi encontrado. */
  anyAvailable: boolean;
  /** Um token do GitHub está salvo (o valor em si nunca sai do main). */
  hasGithubToken: boolean;
}
