import {
  AccountTreeOutlined,
  ClearOutlined,
  CloudSyncOutlined,
  Refresh,
  SearchOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RepoScanResult, RepoSeverity } from '@shared/types/repoScan';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { useRepos } from '@/hooks/repos/useRepos';
import { useScanPaths } from '@/hooks/scanPaths/useScanPaths';
import { formatDateTime } from '@/utils/date';
import { getOpenPrs, needsAction } from '@/utils/pullRequest';
import { ROUTES } from '../../routes';
import { RepoCard } from './components/RepoCard';
import { RepoCardSkeletonList } from './components/RepoCardSkeleton';

type Filter = 'all' | RepoSeverity | 'error' | 'prAction' | 'prOpen';

const FILTERS: {
  value: Filter;
  label: string;
  color: 'default' | 'error' | 'warning' | 'success' | 'primary';
}[] = [
  { value: 'risk', label: 'só nesta máquina', color: 'error' },
  { value: 'attention', label: 'fora de sincronia', color: 'warning' },
  { value: 'prAction', label: 'PR pedindo ação', color: 'error' },
  { value: 'prOpen', label: 'com PR aberto', color: 'primary' },
  { value: 'clean', label: 'sincronizados', color: 'success' },
  { value: 'error', label: 'com erro', color: 'default' },
];

/** Cada filtro é um predicado sobre o repositório; a contagem e a lista usam o mesmo. */
function matches(repo: RepoScanResult, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'error':
      return Boolean(repo.error);
    case 'prAction':
      return !repo.error && repo.prs.some(needsAction);
    case 'prOpen':
      return !repo.error && getOpenPrs(repo).length > 0;
    default:
      return !repo.error && repo.severity === filter;
  }
}

export function ReposPage() {
  const { scanPaths } = useScanPaths();
  const { results, isScanning, isFetching, error, fetchProgress, lastScanAt, scan, fetchRemote } =
    useRepos();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  // A busca vem antes dos filtros para que as contagens dos chips descrevam o
  // conjunto realmente visível, e não o total escondido atrás da busca.
  // `results` já chega ordenado por severidade do processo principal.
  const searched = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return results;
    return results.filter(
      (repo) => repo.name.toLowerCase().includes(query) || repo.path.toLowerCase().includes(query),
    );
  }, [results, search]);

  const visible = useMemo(
    () => searched.filter((repo) => matches(repo, filter)),
    [searched, filter],
  );

  const busy = isScanning || isFetching;
  const hasNoPaths = scanPaths.length === 0;

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
    <Stack spacing={2}>
      <PageHeader
        icon={<AccountTreeOutlined sx={{ fontSize: 22 }} color="action" />}
        title="Repositórios"
        subtitle={
          lastScanAt
            ? `Última leitura local: ${formatDateTime(lastScanAt)}`
            : 'Clique em "Atualizar" para ler o estado dos repositórios'
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={scan}
              disabled={busy || hasNoPaths}
            >
              {isScanning ? 'Lendo...' : 'Atualizar'}
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudSyncOutlined />}
              onClick={fetchRemote}
              disabled={busy || hasNoPaths}
            >
              {isFetching ? 'Buscando...' : 'Buscar do remoto'}
            </Button>
          </Stack>
        }
      />

      {isFetching && (
        <Card variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {fetchProgress
                  ? `${
                      fetchProgress.phase === 'git' ? 'Buscando do remoto' : 'Consultando PRs'
                    }: ${fetchProgress.current}`
                  : 'Preparando busca nos remotos...'}
              </Typography>
              {fetchProgress && (
                <Typography variant="body2" color="text.secondary">
                  {fetchProgress.done}/{fetchProgress.total}
                </Typography>
              )}
            </Stack>
            <LinearProgress
              variant={fetchProgress ? 'determinate' : 'indeterminate'}
              value={
                fetchProgress ? (fetchProgress.done / Math.max(fetchProgress.total, 1)) * 100 : 0
              }
            />
          </Stack>
        </Card>
      )}

      {results.length > 0 && (
        <TextField
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filtrar por nome ou caminho"
          sx={{ maxWidth: 360 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Limpar busca" onClick={() => setSearch('')}>
                    <ClearOutlined fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
        />
      )}

      {results.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip
            label={`todos (${searched.length})`}
            color={filter === 'all' ? 'primary' : 'default'}
            variant={filter === 'all' ? 'filled' : 'outlined'}
            onClick={() => setFilter('all')}
          />
          {FILTERS.map((item) => {
            const count = searched.filter((repo) => matches(repo, item.value)).length;
            if (count === 0) return null;
            const active = filter === item.value;
            return (
              <Chip
                key={item.value}
                label={`${count} ${item.label}`}
                color={active ? item.color : 'default'}
                variant={active ? 'filled' : 'outlined'}
                onClick={() => setFilter(active ? 'all' : item.value)}
              />
            );
          })}
        </Stack>
      )}

      {hasNoPaths ? (
        <EmptyState
          icon={<AccountTreeOutlined />}
          description="Nenhum diretório cadastrado ainda. Cadastre uma pasta-base para o app procurar repositórios git dentro dela."
          action={
            <Button variant="outlined" size="small" onClick={() => navigate(ROUTES.DIRECTORIES)}>
              Ir para Diretórios
            </Button>
          }
        />
      ) : busy || results.length === 0 ? (
        <RepoCardSkeletonList />
      ) : visible.length === 0 ? (
        <EmptyState
          size="section"
          icon={<SearchOutlined />}
          description="Nenhum repositório corresponde aos filtros aplicados."
          action={
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {visible.map((repo) => (
            <RepoCard key={repo.path} repo={repo} />
          ))}
        </Box>
      )}
    </Stack>
  );
}
