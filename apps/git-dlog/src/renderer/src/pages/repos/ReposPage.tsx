import { CloudDownload, FolderSearch, GitBranch, RefreshCw, SearchX } from 'lucide-react';
import { type ComponentProps, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { useRepos } from '@/hooks/repos/useRepos';
import { useScanPaths } from '@/hooks/scan-paths/useScanPaths';
import { ROUTES } from '@/routes';
import { formatDateTime } from '@/utils/date';
import { useIsNarrow } from './hooks/useIsNarrow';
import { FetchProgressBar } from './components/FetchProgressBar';
import { RepoDetailsPanel } from './components/RepoDetailsPanel';
import { RepoFilters } from './components/RepoFilters';
import { RepoList } from './components/RepoList';
import { RepoListMessage } from './components/RepoListMessage';
import { RepoListSkeleton } from './components/RepoListSkeleton';
import type { RepoFilter, RepoListState } from './utils/repoList';
import {
  buildPathHints,
  countByFilter,
  findByPath,
  matchesFilter,
  resolveListState,
  searchRepos,
} from './utils/repoList';

/**
 * Largura a partir da qual lista e painel cabem lado a lado sem que nenhum dos
 * dois fique estreito demais para o que carrega: ~360px de lista e ~420px de
 * detalhes. Abaixo disso a tela alterna entre os dois.
 */
const SIDE_BY_SIDE_WIDTH = 820;

export function ReposPage() {
  const { scanPaths, isLoading: isLoadingScanPaths } = useScanPaths();
  const { results, isScanning, isFetching, error, fetchProgress, lastScanAt, scan, fetchRemote } =
    useRepos();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<RepoFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [returningFromDetails, setReturningFromDetails] = useState(false);
  const listScrollTop = useRef(0);

  const { ref: layoutRef, isNarrow } = useIsNarrow(SIDE_BY_SIDE_WIDTH);

  // A busca vem antes dos filtros para que as contagens dos chips descrevam o
  // conjunto realmente visível, e não o total escondido atrás da busca.
  // `results` já chega ordenado por severidade do processo principal, e nem
  // busca nem filtro reordenam: é a ordem do domínio que a lista mostra.
  const searched = useMemo(() => searchRepos(results, search), [results, search]);
  const visible = useMemo(
    () => searched.filter((repo) => matchesFilter(repo, filter)),
    [searched, filter],
  );
  const counts = useMemo(() => countByFilter(searched), [searched]);
  const pathHints = useMemo(() => buildPathHints(results), [results]);

  /*
   * A seleção guardada é um caminho, não uma posição: depois de uma atualização
   * que reordena a lista, é o mesmo repositório que continua selecionado. Some
   * da lista — por filtro ou por ter deixado de existir — e a tela larga cai no
   * primeiro visível, para o painel nunca ficar descrevendo o repositório
   * errado. Em janela estreita não há queda: quem some fecha os detalhes.
   */
  const selected = useMemo(
    () => findByPath(visible, selectedPath) ?? (isNarrow ? null : (visible[0] ?? null)),
    [visible, selectedPath, isNarrow],
  );

  /*
   * A queda para o primeiro visível vira a escolha. Sem isto, o destaque da
   * lista e a escolha guardada apontariam para repositórios diferentes, e
   * limpar o filtro devolveria o painel ao anterior sem ninguém ter pedido.
   */
  useEffect(() => {
    if (selected && selected.path !== selectedPath) setSelectedPath(selected.path);
  }, [selected, selectedPath]);

  const busy = isScanning || isFetching;
  /*
   * Em janela estreita as duas metades se alternam: selecionar abre os
   * detalhes e voltar devolve a lista, que remonta na posição de rolagem
   * guardada, com a busca e o filtro intactos porque eles moram aqui.
   */
  const showDetails = isNarrow ? detailsOpen && selected !== null : selected !== null;
  const showList = !isNarrow || !showDetails;

  const listState = resolveListState({
    isLoadingScanPaths,
    hasScanPaths: scanPaths.length > 0,
    hasScanned: lastScanAt !== null,
    totalRepos: results.length,
    visibleRepos: visible.length,
  });

  function selectRepo(path: string) {
    setSelectedPath(path);
    setDetailsOpen(true);
    setReturningFromDetails(false);
  }

  function backToList() {
    setDetailsOpen(false);
    setReturningFromDetails(true);
  }

  function clearFilters() {
    setSearch('');
    setFilter('all');
  }

  /*
   * O que distingue os estados sem lista é a saída que cada um oferece
   * (docs/design-system.md §5.4). `loading` fica de fora: ali o lugar da lista
   * é o esqueleto, e não há saída a oferecer.
   */
  const placeholders: Record<
    Exclude<RepoListState, 'list' | 'loading'>,
    ComponentProps<typeof RepoListMessage>
  > = {
    'no-paths': {
      icon: FolderSearch,
      description:
        'Nenhum diretório cadastrado ainda. Cadastre uma pasta-base para o app procurar repositórios git dentro dela.',
      action: (
        <Button variant="outline" onClick={() => navigate(ROUTES.DIRECTORIES)}>
          Ir para Diretórios
        </Button>
      ),
    },
    'no-repos': {
      icon: GitBranch,
      description:
        'A varredura terminou sem encontrar nenhum repositório git nos diretórios cadastrados.',
      action: (
        <Button variant="outline" onClick={() => void scan()} disabled={busy}>
          <RefreshCw aria-hidden />
          Varrer de novo
        </Button>
      ),
    },
    'no-matches': {
      icon: SearchX,
      description: 'Nenhum repositório corresponde aos filtros aplicados.',
      action: (
        <Button variant="outline" onClick={clearFilters}>
          Limpar filtros
        </Button>
      ),
    },
  };

  if (error && !busy) {
    return (
      <ErrorState
        title="Não foi possível ler os repositórios"
        error={error}
        onRetry={() => void scan()}
      />
    );
  }

  return (
    <div data-fill-height className="orca:flex orca:min-h-0 orca:flex-1 orca:flex-col orca:gap-4">
      <header className="orca:flex orca:flex-wrap orca:items-start orca:justify-between orca:gap-3">
        <div>
          <h1 className="orca:m-0 orca:text-xl orca:font-bold orca:text-foreground">
            Repositórios
          </h1>
          <p className="orca:mt-1 orca:mb-0 orca:text-sm orca:text-muted-foreground">
            {lastScanAt
              ? `Última leitura local: ${formatDateTime(lastScanAt)}`
              : 'Clique em "Atualizar" para ler o estado dos repositórios'}
          </p>
        </div>
        <div className="orca:flex orca:gap-2">
          <Button
            variant="outline"
            onClick={() => void scan()}
            disabled={busy || scanPaths.length === 0}
          >
            <RefreshCw aria-hidden />
            {isScanning ? 'Lendo...' : 'Atualizar'}
          </Button>
          <Button
            variant="primary"
            onClick={() => void fetchRemote()}
            disabled={busy || scanPaths.length === 0}
          >
            <CloudDownload aria-hidden />
            {isFetching ? 'Buscando...' : 'Buscar do remoto'}
          </Button>
        </div>
      </header>

      {isFetching && <FetchProgressBar progress={fetchProgress} />}

      <div
        ref={layoutRef}
        className="orca:flex orca:min-h-0 orca:flex-1 orca:gap-4 orca:overflow-hidden"
      >
        {showList && (
          <div
            className={`orca:flex orca:min-h-0 orca:min-w-0 orca:flex-col orca:gap-3 ${
              isNarrow ? 'orca:flex-1' : 'orca:w-[360px] orca:shrink-0'
            }`}
          >
            {/*
              Busca e filtros só quando há o que filtrar — ou quando foram eles
              que esvaziaram a lista, e é neles que está a saída. Sobre "nenhum
              diretório cadastrado" eles descreveriam uma varredura antiga.
            */}
            {(listState === 'list' || listState === 'no-matches') && (
              <RepoFilters
                search={search}
                onSearchChange={setSearch}
                filter={filter}
                onFilterChange={setFilter}
                counts={counts}
              />
            )}

            <div className="orca:flex orca:min-h-0 orca:flex-1 orca:flex-col orca:overflow-hidden orca:rounded-lg orca:border orca:border-border orca:bg-paper">
              {listState === 'loading' && <RepoListSkeleton />}

              {listState === 'list' && (
                <RepoList
                  repos={visible}
                  pathHints={pathHints}
                  selectedPath={selected?.path ?? null}
                  onSelect={selectRepo}
                  scrollTopRef={listScrollTop}
                  focusSelected={returningFromDetails}
                />
              )}

              {listState !== 'list' && listState !== 'loading' && (
                <RepoListMessage {...placeholders[listState]} />
              )}
            </div>
          </div>
        )}

        {showDetails && selected && (
          <RepoDetailsPanel repo={selected} onBack={isNarrow ? backToList : undefined} />
        )}
      </div>
    </div>
  );
}
