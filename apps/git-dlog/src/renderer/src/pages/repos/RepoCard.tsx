import {
  ArrowDownward,
  ArrowUpward,
  CallSplit,
  CheckCircleOutline,
  CloudOffOutlined,
  ExpandMore,
  Inventory2Outlined,
  LanguageOutlined,
  LinkOffOutlined,
  MergeOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { ReactNode, useState } from 'react';
import type { RepoScanResult, RepoSeverity } from '@shared/types/repoScan';
import { isWorktreeDirty } from '@shared/types/repoScan';
import { formatDateTime, formatRelativeDate, formatRelativeSeconds } from '@/utils/format';
import { getCurrentBranchPr, getOpenPrs, openExternal } from '@/utils/pullRequest';
import { PullRequestRow } from './PullRequestList';

/**
 * Faixa lateral que dá a severidade do repositório num relance, sem precisar
 * ler o card. Só `risk` e `attention` recebem cor: uma barra verde em cada
 * repositório limpo viraria ruído, e a ausência de cor já diz "nada a fazer".
 */
const SEVERITY_ACCENT: Record<RepoSeverity, string | null> = {
  risk: 'error.main',
  attention: 'warning.main',
  clean: null,
};

function accentSx(accent: string | null) {
  return accent ? { borderLeft: '3px solid', borderLeftColor: accent } : undefined;
}

/**
 * Aviso sobre um conjunto de branches. Antes era um `Alert` de largura total
 * para cada caso, e os três podem aparecer juntos — o card virava uma pilha de
 * caixas e o cabeçalho afundava. Como linha com ícone, a informação continua
 * legível e o `Alert` fica reservado para o erro de leitura do repositório.
 */
function BranchNotice({
  icon,
  color,
  label,
  branches,
}: {
  icon: ReactNode;
  color: string;
  label: string;
  branches: string[];
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Box sx={{ color, display: 'flex', flexShrink: 0, mt: '2px' }}>{icon}</Box>
      <Typography variant="body2" color="text.secondary">
        {label}{' '}
        <Box component="span" fontFamily="mono" sx={{ color: 'text.primary' }}>
          {branches.join(', ')}
        </Box>
      </Typography>
    </Stack>
  );
}

/** Ahead/behind da branch atual — a resposta para "preciso dar push ou pull?". */
function SyncChips({ repo }: { repo: RepoScanResult }) {
  const { sync, head } = repo;

  if (head?.detached) {
    return <Chip size="small" color="warning" variant="outlined" label="HEAD detached" />;
  }

  // Repositório inicializado mas ainda sem nenhum commit: não faz sentido falar
  // em upstream aqui, e o alerta vermelho seria só ruído.
  if (head && !head.commitHash) {
    return <Chip size="small" variant="outlined" label="sem commits" />;
  }

  if (!sync.upstream) {
    return (
      <Tooltip title="Esta branch nunca foi publicada: os commits existem só nesta máquina">
        <Chip
          size="small"
          color="error"
          variant="outlined"
          icon={<CloudOffOutlined />}
          label="sem upstream"
        />
      </Tooltip>
    );
  }

  if (sync.ahead === 0 && sync.behind === 0) {
    return (
      <Chip
        size="small"
        color="success"
        variant="outlined"
        icon={<CheckCircleOutline />}
        label="sincronizada"
      />
    );
  }

  return (
    <Stack direction="row" spacing={0.5}>
      {sync.ahead > 0 && (
        <Tooltip title={`${sync.ahead} commit(s) para enviar (push) para ${sync.upstream}`}>
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            icon={<ArrowUpward />}
            label={sync.ahead}
          />
        </Tooltip>
      )}
      {sync.behind > 0 && (
        <Tooltip title={`${sync.behind} commit(s) para receber (pull) de ${sync.upstream}`}>
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            icon={<ArrowDownward />}
            label={sync.behind}
          />
        </Tooltip>
      )}
    </Stack>
  );
}

function WorktreeChips({ repo }: { repo: RepoScanResult }) {
  const { worktree } = repo;

  if (!isWorktreeDirty(worktree) && worktree.stashes === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Working tree limpa
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {worktree.conflicted > 0 && (
        <Chip size="small" color="error" label={`${worktree.conflicted} em conflito`} />
      )}
      {worktree.staged > 0 && (
        <Chip size="small" color="warning" label={`${worktree.staged} staged`} />
      )}
      {worktree.modified > 0 && (
        <Chip size="small" color="warning" label={`${worktree.modified} modificados`} />
      )}
      {worktree.untracked > 0 && (
        <Chip size="small" variant="outlined" label={`${worktree.untracked} não rastreados`} />
      )}
      {worktree.stashes > 0 && (
        <Tooltip title="Stashes existem só nesta máquina e são fáceis de esquecer">
          <Chip
            size="small"
            variant="outlined"
            icon={<Inventory2Outlined />}
            label={`${worktree.stashes} stash${worktree.stashes > 1 ? 'es' : ''}`}
          />
        </Tooltip>
      )}
    </Stack>
  );
}

/**
 * PRs abertos do repositório. O da branch atual sobe para o topo e ganha
 * destaque: é o que a pessoa está tocando agora.
 */
function PullRequestSection({ repo }: { repo: RepoScanResult }) {
  const openPrs = getOpenPrs(repo);
  if (openPrs.length === 0) return null;

  const currentPr = getCurrentBranchPr(repo);
  const others = openPrs.filter((pr) => pr !== currentPr);

  return (
    <Stack spacing={0.75}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
        {openPrs.length === 1 ? '1 PR aberto' : `${openPrs.length} PRs abertos`}
      </Typography>
      {currentPr && <PullRequestRow pr={currentPr} highlighted />}
      {others.map((pr) => (
        <PullRequestRow key={pr.number} pr={pr} />
      ))}
    </Stack>
  );
}

/**
 * Repositório sem nada a dizer: sincronizado, sem PR aberto e sem branch
 * sobrando para apagar. Ocupava a mesma altura de um com conflitos só para
 * informar que estava tudo bem, então entra reduzido a uma linha — é esse
 * contraste de altura que faz o que precisa de atenção saltar na lista.
 */
function isQuiet(repo: RepoScanResult): boolean {
  return (
    repo.severity === 'clean' &&
    getOpenPrs(repo).length === 0 &&
    repo.mergedBranchesToClean.length === 0
  );
}

const COMPACT_CONTENT_SX = { py: 1.25, '&:last-child': { pb: 1.25 } };

export function RepoCard({ repo }: { repo: RepoScanResult }) {
  const [expanded, setExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (repo.error) {
    return (
      <Card variant="outlined" sx={accentSx('error.main')}>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {repo.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="mono">
              {repo.path}
            </Typography>
            <Alert severity="error" variant="outlined">
              {repo.error}
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  const localBranchCount = repo.branches.filter((branch) => !branch.isRemote).length;
  const quiet = isQuiet(repo);
  const showBody = !quiet || detailsOpen;

  return (
    <Card variant="outlined" sx={accentSx(SEVERITY_ACCENT[repo.severity])}>
      <CardContent sx={showBody ? undefined : COMPACT_CONTENT_SX}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ rowGap: 1 }}
          >
            {repo.remote ? (
              <Tooltip title={`Abrir ${repo.remote.webUrl}`}>
                <Link
                  component="button"
                  variant="subtitle1"
                  underline="hover"
                  color="inherit"
                  onClick={() => openExternal(repo.remote!.webUrl)}
                  sx={{ fontWeight: 700 }}
                >
                  {repo.name}
                </Link>
              </Tooltip>
            ) : (
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {repo.name}
              </Typography>
            )}
            {/*
              Ícone, e não chip: os chips deste card significam estado (branch,
              ahead/behind, working tree, CI) e isto é uma ação. Fica ao lado do
              nome porque são as duas saídas do card — o nome leva ao código, o
              globo leva ao site no ar.
            */}
            {repo.appUrl && (
              <Tooltip title={`Abrir o site publicado: ${repo.appUrl}`}>
                <IconButton
                  size="small"
                  aria-label={`Abrir o site publicado de ${repo.name}`}
                  onClick={() => openExternal(repo.appUrl!)}
                >
                  <LanguageOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            {repo.head?.branch && (
              <Chip
                size="small"
                icon={<CallSplit />}
                label={repo.head.branch}
                sx={{ fontFamily: 'mono' }}
              />
            )}
            <SyncChips repo={repo} />

            <Box sx={{ flex: 1 }} />

            <Tooltip
              title={
                repo.lastFetchedAt
                  ? `Último fetch: ${formatDateTime(repo.lastFetchedAt)}`
                  : 'Este repositório nunca foi atualizado a partir do remoto'
              }
            >
              <Typography variant="caption" color="text.secondary">
                {repo.lastFetchedAt
                  ? `remoto lido ${formatRelativeDate(repo.lastFetchedAt)}`
                  : 'nunca buscado'}
              </Typography>
            </Tooltip>

            {quiet && (
              <IconButton
                size="small"
                onClick={() => setDetailsOpen((value) => !value)}
                aria-label={detailsOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
                aria-expanded={detailsOpen}
                sx={{
                  transform: detailsOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 150ms',
                }}
              >
                <ExpandMore fontSize="small" />
              </IconButton>
            )}
          </Stack>

          {showBody && (
            <>
              <Typography variant="caption" color="text.secondary" fontFamily="mono">
                {repo.path}
              </Typography>

              {repo.head?.subject && (
                <Typography variant="body2" color="text.secondary">
                  <Box component="span" fontFamily="mono">
                    {repo.head.commitHash}
                  </Box>{' '}
                  {repo.head.subject} — {repo.head.author},{' '}
                  {formatRelativeSeconds(repo.head.timestamp)}
                </Typography>
              )}

              <WorktreeChips repo={repo} />

              {repo.unpublishedBranches.length > 0 && (
                <BranchNotice
                  icon={<CloudOffOutlined fontSize="small" />}
                  color="error.main"
                  label={
                    repo.unpublishedBranches.length === 1
                      ? 'Nunca publicada, só existe aqui:'
                      : 'Nunca publicadas, só existem aqui:'
                  }
                  branches={repo.unpublishedBranches}
                />
              )}

              {repo.goneBranches.length > 0 && (
                <BranchNotice
                  icon={<LinkOffOutlined fontSize="small" />}
                  color="warning.main"
                  label={
                    repo.goneBranches.length === 1
                      ? 'Upstream apagado no remoto, candidata a limpeza:'
                      : 'Upstream apagado no remoto, candidatas a limpeza:'
                  }
                  branches={repo.goneBranches}
                />
              )}

              {repo.mergedBranchesToClean.length > 0 && (
                <BranchNotice
                  icon={<MergeOutlined fontSize="small" />}
                  color="info.main"
                  label={
                    repo.mergedBranchesToClean.length === 1
                      ? 'PR já mergeado, pode ser apagada:'
                      : 'PR já mergeado, podem ser apagadas:'
                  }
                  branches={repo.mergedBranchesToClean}
                />
              )}

              <PullRequestSection repo={repo} />

              <Divider />

              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  {localBranchCount} local(is) · {repo.branches.length - localBranchCount} remota(s)
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setExpanded((value) => !value)}
                  aria-label={expanded ? 'Ocultar branches' : 'Ver branches'}
                  aria-expanded={expanded}
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 150ms',
                  }}
                >
                  <ExpandMore fontSize="small" />
                </IconButton>
              </Stack>

              <Collapse in={expanded} unmountOnExit>
                {repo.groups.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma branch encontrada.
                  </Typography>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={1.25}>
                    {repo.groups.map((group) => (
                      <Stack key={group.commitHash} spacing={0.75} sx={{ pt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <Box component="span" fontFamily="mono">
                            {group.commitHash}
                          </Box>{' '}
                          {group.subject} — {group.author}, {formatRelativeSeconds(group.timestamp)}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {group.branches.map((branch) => (
                            <Chip
                              key={branch}
                              label={branch}
                              size="small"
                              variant={branch.includes('/') ? 'outlined' : 'filled'}
                              sx={{ fontFamily: 'mono' }}
                            />
                          ))}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Collapse>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
