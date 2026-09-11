import { describe, expect, it } from 'vitest';
import type { PullRequest } from '@shared/types/pullRequest';
import type { RepoScanResult, RepoSeverity } from '@shared/types/repoScan';
import {
  branchNotices,
  countBranches,
  orderOpenPrs,
  remoteBranchNames,
  resolveSyncState,
  worktreeItems,
} from './repoDetails';
import { summarizePendencies } from './repoList';

/**
 * Fábrica local: repositório sem nada pendente, do qual cada teste altera só o
 * que está examinando. É a mesma forma da fábrica de `repoList.test.ts` — as
 * duas descrevem o mesmo tipo, e nenhuma das duas é interface de produção.
 */
function makeRepo(overrides: Partial<RepoScanResult> & { path: string }): RepoScanResult {
  const name = overrides.name ?? (overrides.path.split('/').pop() as string);
  return {
    name,
    remote: null,
    appUrl: null,
    prs: [],
    mergedBranchesToClean: [],
    head: {
      branch: 'main',
      detached: false,
      commitHash: 'abc1234',
      subject: 'commit',
      author: 'ana',
      timestamp: 1,
    },
    sync: { upstream: 'origin/main', ahead: 0, behind: 0 },
    worktree: { staged: 0, modified: 0, untracked: 0, conflicted: 0, stashes: 0 },
    branches: [],
    groups: [],
    unpublishedBranches: [],
    goneBranches: [],
    lastFetchedAt: null,
    severity: 'clean' as RepoSeverity,
    ...overrides,
  };
}

function makePr(overrides: Partial<PullRequest> = {}): PullRequest {
  return {
    number: 1,
    title: 'PR',
    url: 'https://example.test/pr/1',
    state: 'open',
    isDraft: false,
    reviewDecision: null,
    checks: null,
    headBranch: 'feat/x',
    baseBranch: 'main',
    author: 'ana',
    updatedAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

/**
 * A sincronia é uma resposta só: os casos se excluem, e a ordem entre eles é a
 * ordem em que fazem sentido perguntar — não adianta falar de upstream num HEAD
 * detached nem de ahead/behind num repositório sem commit nenhum.
 */
describe('resolveSyncState', () => {
  it('reconhece HEAD detached antes de qualquer coisa', () => {
    const repo = makeRepo({
      path: '/a/x',
      head: {
        branch: null,
        detached: true,
        commitHash: 'abc1234',
        subject: 's',
        author: 'a',
        timestamp: 1,
      },
      sync: { upstream: 'origin/main', ahead: 2, behind: 1 },
    });

    expect(resolveSyncState(repo).kind).toBe('detached');
  });

  it('reconhece repositório sem nenhum commit', () => {
    const repo = makeRepo({
      path: '/a/x',
      head: {
        branch: 'main',
        detached: false,
        commitHash: '',
        subject: '',
        author: '',
        timestamp: 0,
      },
      sync: { upstream: null, ahead: 0, behind: 0 },
    });

    expect(resolveSyncState(repo).kind).toBe('no-commits');
  });

  it('reconhece branch nunca publicada', () => {
    const repo = makeRepo({ path: '/a/x', sync: { upstream: null, ahead: 0, behind: 0 } });

    expect(resolveSyncState(repo).kind).toBe('no-upstream');
  });

  it('reconhece branch em dia com o upstream', () => {
    const repo = makeRepo({ path: '/a/x' });

    expect(resolveSyncState(repo)).toEqual({
      kind: 'in-sync',
      upstream: 'origin/main',
      ahead: 0,
      behind: 0,
    });
  });

  it('devolve as contagens quando há commits dos dois lados', () => {
    const repo = makeRepo({
      path: '/a/x',
      sync: { upstream: 'origin/main', ahead: 3, behind: 2 },
    });

    expect(resolveSyncState(repo)).toEqual({
      kind: 'diverged',
      upstream: 'origin/main',
      ahead: 3,
      behind: 2,
    });
  });
});

describe('worktreeItems', () => {
  it('não devolve nada quando a working tree está limpa', () => {
    expect(worktreeItems(makeRepo({ path: '/a/x' }))).toEqual([]);
  });

  it('lista cada contagem uma vez, do conflito ao stash', () => {
    const repo = makeRepo({
      path: '/a/x',
      worktree: { staged: 1, modified: 2, untracked: 3, conflicted: 4, stashes: 1 },
    });

    expect(worktreeItems(repo).map((item) => [item.key, item.label])).toEqual([
      ['conflicted', '4 em conflito'],
      ['staged', '1 staged'],
      ['modified', '2 modificados'],
      ['untracked', '3 não rastreados'],
      ['stashes', '1 stash'],
    ]);
  });

  it('só o conflito é perda de trabalho iminente', () => {
    const repo = makeRepo({
      path: '/a/x',
      worktree: { staged: 1, modified: 0, untracked: 0, conflicted: 1, stashes: 0 },
    });

    expect(worktreeItems(repo).map((item) => item.tone)).toEqual(['danger', 'emphasis']);
  });

  it('pluraliza stash e concorda com o número', () => {
    const repo = makeRepo({
      path: '/a/x',
      worktree: { staged: 0, modified: 1, untracked: 1, conflicted: 0, stashes: 2 },
    });

    expect(worktreeItems(repo).map((item) => item.label)).toEqual([
      '1 modificado',
      '1 não rastreado',
      '2 stashes',
    ]);
  });
});

describe('branchNotices', () => {
  it('não devolve nada quando não há branch sobrando', () => {
    expect(branchNotices(makeRepo({ path: '/a/x' }))).toEqual([]);
  });

  it('dá a cada conjunto o seu aviso, com os nomes das branches', () => {
    const repo = makeRepo({
      path: '/a/x',
      unpublishedBranches: ['feat/a'],
      goneBranches: ['feat/b', 'feat/c'],
      mergedBranchesToClean: ['feat/d'],
    });

    expect(branchNotices(repo)).toEqual([
      {
        key: 'unpublished',
        label: 'Nunca publicada, só existe aqui',
        branches: ['feat/a'],
        tone: 'danger',
      },
      {
        key: 'gone',
        label: 'Upstream apagado no remoto, candidatas a limpeza',
        branches: ['feat/b', 'feat/c'],
        tone: 'neutral',
      },
      {
        key: 'merged',
        label: 'PR já mergeado, pode ser apagada',
        branches: ['feat/d'],
        tone: 'neutral',
      },
    ]);
  });

  it('concorda o aviso com o número de branches', () => {
    const repo = makeRepo({
      path: '/a/x',
      unpublishedBranches: ['feat/a', 'feat/b'],
      goneBranches: ['feat/c'],
      mergedBranchesToClean: ['feat/d', 'feat/e'],
    });

    expect(branchNotices(repo).map((notice) => notice.label)).toEqual([
      'Nunca publicadas, só existem aqui',
      'Upstream apagado no remoto, candidata a limpeza',
      'PR já mergeado, podem ser apagadas',
    ]);
  });
});

const branchBase = {
  commitHash: 'abc1234',
  subject: 's',
  author: 'a',
  timestamp: 1,
  upstream: null,
  ahead: 0,
  behind: 0,
  gone: false,
  unpublished: false,
};

const repoComBranches = makeRepo({
  path: '/a/x',
  branches: [
    { ...branchBase, name: 'main', isRemote: false },
    { ...branchBase, name: 'feat/a', isRemote: false },
    { ...branchBase, name: 'origin/main', isRemote: true },
  ],
});

describe('countBranches', () => {
  it('separa locais de remotas', () => {
    expect(countBranches(repoComBranches)).toEqual({ local: 2, remote: 1 });
  });
});

/**
 * O agrupamento por commit traz só nomes, e é preciso saber quais deles são
 * remotos. Quem responde é a lista de branches do repositório — não o nome:
 * `feat/a` é local e tem barra igual.
 */
describe('remoteBranchNames', () => {
  it('reconhece a branch remota pela leitura do repositório, não pela barra no nome', () => {
    const remotas = remoteBranchNames(repoComBranches);

    expect(remotas.has('origin/main')).toBe(true);
    expect(remotas.has('feat/a')).toBe(false);
    expect(remotas.has('main')).toBe(false);
  });
});

/**
 * Lista e painel descrevem o mesmo repositório: uma pendência que grita num e
 * sussurra no outro seria uma contradição entre as duas metades da tela.
 */
describe('tons do painel contra os da lista', () => {
  it('mantém neutro o que a lista considera neutro', () => {
    const repo = makeRepo({
      path: '/a/x',
      goneBranches: ['feat/b'],
      mergedBranchesToClean: ['feat/c'],
    });

    const neutrasNaLista = summarizePendencies(repo)
      .filter((pendency) => pendency.tone === 'neutral')
      .map((pendency) => pendency.key);

    expect(neutrasNaLista).toEqual(['gone', 'merged']);
    expect(branchNotices(repo).map((notice) => notice.tone)).toEqual(['neutral', 'neutral']);
  });

  it('nunca deixa neutro o que a lista considera risco', () => {
    const repo = makeRepo({
      path: '/a/x',
      worktree: { staged: 1, modified: 1, untracked: 1, conflicted: 1, stashes: 1 },
      unpublishedBranches: ['feat/a'],
    });

    expect(summarizePendencies(repo).every((pendency) => pendency.tone === 'risk')).toBe(true);
    expect(worktreeItems(repo).every((item) => item.tone !== 'neutral')).toBe(true);
    expect(branchNotices(repo).map((notice) => notice.tone)).toEqual(['danger']);
  });
});

/**
 * O PR da branch atual é o que a pessoa está tocando agora: vem primeiro e vem
 * marcado, esteja onde estiver na resposta do provedor.
 */
describe('orderOpenPrs', () => {
  it('não devolve PR fechado nem mergeado', () => {
    const repo = makeRepo({
      path: '/a/x',
      prs: [
        makePr({ number: 1, state: 'merged' }),
        makePr({ number: 2, state: 'closed' }),
        makePr({ number: 3, state: 'open', headBranch: 'feat/z' }),
      ],
    });

    expect(orderOpenPrs(repo).map((item) => item.pr.number)).toEqual([3]);
  });

  it('põe o PR da branch atual na frente e o marca', () => {
    const repo = makeRepo({
      path: '/a/x',
      head: {
        branch: 'feat/atual',
        detached: false,
        commitHash: 'abc1234',
        subject: 's',
        author: 'a',
        timestamp: 1,
      },
      prs: [
        makePr({ number: 10, headBranch: 'feat/outra' }),
        makePr({ number: 11, headBranch: 'feat/atual' }),
        makePr({ number: 12, headBranch: 'feat/terceira' }),
      ],
    });

    expect(orderOpenPrs(repo).map((item) => [item.pr.number, item.isCurrentBranch])).toEqual([
      [11, true],
      [10, false],
      [12, false],
    ]);
  });

  it('preserva a ordem do provedor quando nenhum PR é da branch atual', () => {
    const repo = makeRepo({
      path: '/a/x',
      prs: [makePr({ number: 10 }), makePr({ number: 11 })],
    });

    expect(orderOpenPrs(repo).map((item) => item.pr.number)).toEqual([10, 11]);
  });

  it('não marca nada quando o HEAD está detached', () => {
    const repo = makeRepo({
      path: '/a/x',
      head: {
        branch: null,
        detached: true,
        commitHash: 'abc1234',
        subject: 's',
        author: 'a',
        timestamp: 1,
      },
      prs: [makePr({ number: 10 })],
    });

    expect(orderOpenPrs(repo).map((item) => item.isCurrentBranch)).toEqual([false]);
  });
});
