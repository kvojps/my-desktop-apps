/**
 * O vocabulário de pull requests do processo principal: o PR em si, o remote de
 * onde ele vem e o estado das integrações que sabem consultá-lo.
 *
 * Estas entidades são estruturalmente idênticas aos tipos de
 * `@shared/types/pullRequest`, e o porquê do sufixo `Entity` está em
 * `domain/scanPath.ts`. A diferença de papel é a de sempre: aqui é a forma que
 * os gateways de `infra/gateways/pr/` produzem e que o service consome; lá é o
 * contrato que atravessa o IPC.
 */

export type PullRequestStateEntity = 'open' | 'merged' | 'closed';

/** Resultado da revisão, quando o provedor informa. */
export type ReviewDecisionEntity = 'approved' | 'changes_requested' | 'review_required' | null;

/** Consolidado do CI sobre o commit de topo do PR. */
export type ChecksStateEntity = 'passing' | 'failing' | 'pending' | null;

export type PullRequestEntity = {
  number: number;
  title: string;
  url: string;
  state: PullRequestStateEntity;
  isDraft: boolean;
  /** Branch de origem — é o que liga o PR a uma branch local. */
  headBranch: string;
  baseBranch: string;
  author: string;
  reviewDecision: ReviewDecisionEntity;
  checks: ChecksStateEntity;
  updatedAt: string;
};

/** Que provedor de PR atende este host — é o que decide quem vai ser consultado. */
export type RemoteKindEntity = 'github' | 'gitlab' | 'other';

export type RepoRemoteEntity = {
  /** Nome do remote no git (`origin`). */
  name: string;
  url: string;
  host: string;
  /** Dono ou grupo; no GitLab pode ter subgrupos (`grupo/subgrupo`). */
  owner: string;
  repo: string;
  /** URL navegável do projeto. */
  webUrl: string;
  kind: RemoteKindEntity;
};

/** Como os PRs são obtidos. `none` é o caso de não haver caminho utilizável. */
export type PrProviderKindEntity = 'gh-cli' | 'glab-cli' | 'github-token' | 'none';

export type PrProviderStatusEntity = {
  kind: PrProviderKindEntity;
  available: boolean;
  /** Mensagem pronta para a UI explicando o estado. */
  detail: string;
};

export type PrIntegrationStatusEntity = {
  providers: PrProviderStatusEntity[];
  /** Algum provedor utilizável foi encontrado. */
  anyAvailable: boolean;
  /** Um token do GitHub está salvo (o valor em si nunca sai do main). */
  hasGithubToken: boolean;
};
