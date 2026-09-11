import { describe, expect, it } from 'vitest';
import type { PullRequest } from '@shared/types/pullRequest';
import type { RepoScanResult, RepoSeverity } from '@shared/types/repoScan';
import {
  buildPathHints,
  countByFilter,
  findByPath,
  matchesFilter,
  resolveListState,
  searchRepos,
  summarizePendencies,
} from './repoList';

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
      subject: '',
      author: '',
      timestamp: 0,
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
 * A busca filtra e nada mais: a ordem por severidade vem do main e a lista não
 * pode reordená-la (ADR-0003).
 */
describe('searchRepos', () => {
  const repos = [
    makeRepo({ path: '/home/ana/trabalho/api' }),
    makeRepo({ path: '/home/ana/pessoal/site' }),
  ];

  it('devolve tudo quando a busca está vazia', () => {
    expect(searchRepos(repos, '   ')).toEqual(repos);
  });

  it('preserva a ordem em que os resultados chegaram', () => {
    const naOrdemDoMain = [
      makeRepo({ path: '/a/zulu', severity: 'risk' }),
      makeRepo({ path: '/a/alfa', severity: 'clean' }),
    ];

    expect(searchRepos(naOrdemDoMain, 'a').map((repo) => repo.name)).toEqual(['zulu', 'alfa']);
  });

  it('busca por nome sem diferenciar maiúsculas', () => {
    expect(searchRepos(repos, 'API').map((repo) => repo.name)).toEqual(['api']);
  });

  it('busca por trecho do caminho', () => {
    expect(searchRepos(repos, 'pessoal').map((repo) => repo.name)).toEqual(['site']);
  });
});

describe('matchesFilter', () => {
  const comErro = makeRepo({ path: '/a/erro', severity: 'risk', error: 'não foi possível ler' });
  const risco = makeRepo({ path: '/a/risco', severity: 'risk' });
  const prPedindoAcao = makeRepo({
    path: '/a/pr-acao',
    severity: 'clean',
    prs: [makePr({ checks: 'failing' })],
  });
  const prAberto = makeRepo({ path: '/a/pr-aberto', severity: 'clean', prs: [makePr()] });

  it('aceita todos os repositórios em "todos"', () => {
    expect([comErro, risco].every((repo) => matchesFilter(repo, 'all'))).toBe(true);
  });

  it('separa repositórios com erro dos filtros de severidade', () => {
    expect(matchesFilter(comErro, 'error')).toBe(true);
    expect(matchesFilter(comErro, 'risk')).toBe(false);
    expect(matchesFilter(risco, 'risk')).toBe(true);
    expect(matchesFilter(risco, 'error')).toBe(false);
  });

  it('distingue PR pedindo ação de PR apenas aberto', () => {
    expect(matchesFilter(prPedindoAcao, 'prAction')).toBe(true);
    expect(matchesFilter(prPedindoAcao, 'prOpen')).toBe(true);
    expect(matchesFilter(prAberto, 'prAction')).toBe(false);
    expect(matchesFilter(prAberto, 'prOpen')).toBe(true);
  });
});

describe('countByFilter', () => {
  it('conta cada filtro sobre o conjunto recebido', () => {
    const repos = [
      makeRepo({ path: '/a/um', severity: 'risk' }),
      makeRepo({ path: '/a/dois', severity: 'attention' }),
      makeRepo({ path: '/a/tres', severity: 'clean', prs: [makePr()] }),
      makeRepo({ path: '/a/quatro', severity: 'clean', error: 'falhou' }),
    ];

    const counts = countByFilter(repos);

    expect(counts.all).toBe(4);
    expect(counts.risk).toBe(1);
    expect(counts.attention).toBe(1);
    expect(counts.clean).toBe(1);
    expect(counts.error).toBe(1);
    expect(counts.prOpen).toBe(1);
    expect(counts.prAction).toBe(0);
  });
});

/**
 * Dois repositórios com o mesmo nome são o caso em que selecionar o errado é
 * fácil. O trecho de caminho existe só para desempatá-los, e precisa ser o
 * menor que ainda distingue.
 */
describe('buildPathHints', () => {
  it('não sugere trecho para nomes únicos', () => {
    const repos = [makeRepo({ path: '/home/ana/api' }), makeRepo({ path: '/home/ana/site' })];

    expect(buildPathHints(repos)).toEqual({});
  });

  it('usa o menor trecho que distingue nomes repetidos', () => {
    const repos = [
      makeRepo({ path: '/home/ana/trabalho/api' }),
      makeRepo({ path: '/home/ana/pessoal/api' }),
    ];

    expect(buildPathHints(repos)).toEqual({
      '/home/ana/trabalho/api': 'trabalho',
      '/home/ana/pessoal/api': 'pessoal',
    });
  });

  it('aprofunda o trecho quando um segmento não basta', () => {
    const repos = [
      makeRepo({ path: '/home/ana/um/src/api' }),
      makeRepo({ path: '/home/ana/dois/src/api' }),
    ];

    expect(buildPathHints(repos)).toEqual({
      '/home/ana/um/src/api': 'um/src',
      '/home/ana/dois/src/api': 'dois/src',
    });
  });

  it('entende caminhos do Windows', () => {
    const repos = [
      makeRepo({ path: 'C:\\dev\\trabalho\\api', name: 'api' }),
      makeRepo({ path: 'C:\\dev\\pessoal\\api', name: 'api' }),
    ];

    expect(buildPathHints(repos)).toEqual({
      'C:\\dev\\trabalho\\api': 'trabalho',
      'C:\\dev\\pessoal\\api': 'pessoal',
    });
  });
});

/**
 * A seleção é por caminho, não por posição: uma atualização que reordena a
 * lista não pode fazer o painel descrever outro repositório.
 */
describe('findByPath', () => {
  const antes = [makeRepo({ path: '/a/um' }), makeRepo({ path: '/a/dois' })];
  const depois = [makeRepo({ path: '/a/dois' }), makeRepo({ path: '/a/um' })];

  it('encontra o mesmo repositório depois da reordenação', () => {
    expect(findByPath(antes, '/a/dois')?.path).toBe('/a/dois');
    expect(findByPath(depois, '/a/dois')?.path).toBe('/a/dois');
  });

  it('devolve nulo quando o repositório não está mais na lista', () => {
    expect(findByPath(depois, '/a/tres')).toBeNull();
    expect(findByPath(depois, null)).toBeNull();
  });
});

describe('summarizePendencies', () => {
  it('não lista pendência nenhuma num repositório limpo', () => {
    expect(summarizePendencies(makeRepo({ path: '/a/limpo' }))).toEqual([]);
  });

  it('resume o trabalho que só existe nesta máquina como risco', () => {
    const repo = makeRepo({
      path: '/a/risco',
      severity: 'risk',
      worktree: { staged: 1, modified: 2, untracked: 3, conflicted: 1, stashes: 1 },
      unpublishedBranches: ['feat/x'],
    });

    expect(summarizePendencies(repo)).toEqual([
      { key: 'conflicted', label: '1 em conflito', tone: 'risk' },
      { key: 'changed', label: '3 alterados', tone: 'risk' },
      { key: 'untracked', label: '3 não rastreados', tone: 'risk' },
      { key: 'stashes', label: '1 stash', tone: 'risk' },
      { key: 'unpublished', label: '1 branch sem publicar', tone: 'risk' },
    ]);
  });

  it('pluraliza stashes e branches nunca publicadas', () => {
    const repo = makeRepo({
      path: '/a/risco',
      severity: 'risk',
      worktree: { staged: 0, modified: 0, untracked: 0, conflicted: 0, stashes: 2 },
      unpublishedBranches: ['feat/x', 'feat/y'],
    });

    expect(summarizePendencies(repo).map((pendency) => pendency.label)).toEqual([
      '2 stashes',
      '2 branches sem publicar',
    ]);
  });

  it('resume a sincronia e as branches órfãs como atenção neutra', () => {
    const repo = makeRepo({
      path: '/a/atencao',
      severity: 'attention',
      sync: { upstream: 'origin/main', ahead: 2, behind: 1 },
      goneBranches: ['feat/velha'],
      mergedBranchesToClean: ['feat/mergeada'],
    });

    expect(summarizePendencies(repo)).toEqual([
      { key: 'ahead', label: '2 para enviar', tone: 'neutral' },
      { key: 'behind', label: '1 para receber', tone: 'neutral' },
      { key: 'gone', label: '1 branch sem remoto', tone: 'neutral' },
      { key: 'merged', label: '1 branch para limpar', tone: 'neutral' },
    ]);
  });

  it('anuncia HEAD detached', () => {
    const repo = makeRepo({
      path: '/a/detached',
      severity: 'attention',
      head: {
        branch: null,
        detached: true,
        commitHash: 'abc1234',
        subject: '',
        author: '',
        timestamp: 0,
      },
    });

    expect(summarizePendencies(repo)).toEqual([
      { key: 'detached', label: 'HEAD detached', tone: 'neutral' },
    ]);
  });

  it('destaca PR pedindo ação e conta os demais PRs abertos', () => {
    const repo = makeRepo({
      path: '/a/prs',
      prs: [
        makePr({ number: 1, checks: 'failing' }),
        makePr({ number: 2, reviewDecision: 'changes_requested' }),
        makePr({ number: 3 }),
        makePr({ number: 4, state: 'merged' }),
      ],
    });

    expect(summarizePendencies(repo)).toEqual([
      { key: 'prAction', label: '2 PRs pedindo ação', tone: 'risk' },
      { key: 'prOpen', label: '1 PR aberto', tone: 'neutral' },
    ]);
  });

  it('não resume pendências de um repositório que falhou na leitura', () => {
    const repo = makeRepo({
      path: '/a/erro',
      error: 'não foi possível ler',
      worktree: { staged: 5, modified: 0, untracked: 0, conflicted: 0, stashes: 0 },
    });

    expect(summarizePendencies(repo)).toEqual([]);
  });
});

/**
 * Os quatro estados da lista existem para dar saídas diferentes: cadastrar um
 * diretório, esperar, varrer de novo ou limpar os filtros. O caso que faltava é
 * a varredura que termina sem achar repositório nenhum — antes ela ficava
 * carregando para sempre.
 */
describe('resolveListState', () => {
  const base = {
    isLoadingScanPaths: false,
    hasScanPaths: true,
    hasScanned: true,
    totalRepos: 3,
    visibleRepos: 3,
  };

  it('carrega enquanto os diretórios-base ainda não chegaram', () => {
    expect(resolveListState({ ...base, isLoadingScanPaths: true, hasScanPaths: false })).toBe(
      'loading',
    );
  });

  it('pede o cadastro de um diretório-base quando não há nenhum', () => {
    expect(resolveListState({ ...base, hasScanPaths: false, totalRepos: 0 })).toBe('no-paths');
  });

  it('carrega enquanto a primeira varredura não terminou', () => {
    expect(resolveListState({ ...base, hasScanned: false, totalRepos: 0, visibleRepos: 0 })).toBe(
      'loading',
    );
  });

  it('conclui que a varredura não encontrou repositório nenhum', () => {
    expect(resolveListState({ ...base, totalRepos: 0, visibleRepos: 0 })).toBe('no-repos');
  });

  it('distingue lista vazia por filtro de varredura vazia', () => {
    expect(resolveListState({ ...base, visibleRepos: 0 })).toBe('no-matches');
  });

  it('mostra a lista quando há resultado visível', () => {
    expect(resolveListState(base)).toBe('list');
  });

  it('mantém a lista visível durante uma nova varredura', () => {
    expect(resolveListState({ ...base, hasScanned: true })).toBe('list');
  });
});
