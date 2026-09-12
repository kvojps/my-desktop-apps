import {
  Archive,
  ArrowDown,
  ArrowUp,
  CircleCheck,
  Cloud,
  CloudOff,
  FilePen,
  FilePlus,
  FileQuestion,
  GitBranch,
  GitMerge,
  Globe,
  HardDrive,
  Hourglass,
  type LucideIcon,
  TriangleAlert,
  Unlink,
} from 'lucide-react';
import type { RepoCommit, RepoScanResult } from '@shared/types/repoScan';
import { api } from '@/api/client';
import { Button } from '@/components/Button';
import {
  type BranchNotice,
  type WorktreeKey,
  branchNotices,
  countBranches,
  orderOpenPrs,
  remoteBranchNames,
  resolveSyncState,
  worktreeItems,
} from '@/pages/repos/utils/repoDetails';
import { formatDateTime, formatRelativeDate, formatRelativeSeconds } from '@/utils/date';
import { DetailsSection } from './DetailsSection';
import { PullRequestRow } from './PullRequestRow';
import { SeverityBadge } from './SeverityBadge';
import { StatusChip, TONE_TEXT } from './StatusChip';

const WORKTREE_ICONS: Record<WorktreeKey, LucideIcon> = {
  conflicted: TriangleAlert,
  staged: FilePlus,
  modified: FilePen,
  untracked: FileQuestion,
  stashes: Archive,
};

const NOTICE_ICONS: Record<BranchNotice['key'], LucideIcon> = {
  unpublished: CloudOff,
  gone: Unlink,
  merged: GitMerge,
};

/** Sincronia da branch atual: um estado só, em chips (`resolveSyncState`). */
function SyncChips({ repo }: { repo: RepoScanResult }) {
  const sync = resolveSyncState(repo);

  switch (sync.kind) {
    case 'detached':
      return (
        <StatusChip
          label="HEAD detached"
          icon={TriangleAlert}
          title="O HEAD não está em nenhuma branch: commits feitos aqui são fáceis de perder"
        />
      );
    case 'no-commits':
      return <StatusChip label="sem commits" icon={Hourglass} />;
    case 'no-upstream':
      return (
        <StatusChip
          label="sem upstream"
          icon={CloudOff}
          tone="danger"
          title="Esta branch nunca foi publicada: os commits existem só nesta máquina"
        />
      );
    case 'in-sync':
      return (
        <StatusChip
          label="sincronizada"
          icon={CircleCheck}
          tone="success"
          title={`Em dia com ${sync.upstream}`}
        />
      );
    default:
      return (
        <>
          {sync.ahead > 0 && (
            <StatusChip
              label={`${sync.ahead} para enviar`}
              icon={ArrowUp}
              title={`${sync.ahead} commit(s) para enviar (push) para ${sync.upstream}`}
            />
          )}
          {sync.behind > 0 && (
            <StatusChip
              label={`${sync.behind} para receber`}
              icon={ArrowDown}
              title={`${sync.behind} commit(s) para receber (pull) de ${sync.upstream}`}
            />
          )}
        </>
      );
  }
}

function CommitLine({ commit }: { commit: RepoCommit }) {
  return (
    <p className="ui:m-0 ui:text-xs ui:break-words ui:text-muted-foreground">
      <span className="ui:font-mono ui:text-foreground">{commit.commitHash}</span>{' '}
      {commit.subject} — {commit.author}, {formatRelativeSeconds(commit.timestamp)}
    </p>
  );
}

/**
 * O repositório escolhido, por inteiro e numa ordem só: quem ele é, o que está
 * pendente, os PRs, as branches e o último commit. As duas seções extensas
 * recolhem; o que é problema fica na primeira, que não recolhe.
 */
export function RepoDetails({ repo }: { repo: RepoScanResult }) {
  const fetchedTitle = repo.lastFetchedAt
    ? `Último fetch: ${formatDateTime(repo.lastFetchedAt)}`
    : 'Este repositório nunca foi atualizado a partir do remoto';

  const header = (
    <header className="ui:space-y-1.5">
      <div className="ui:flex ui:flex-wrap ui:items-center ui:gap-2">
        <SeverityBadge level={repo.error ? 'error' : repo.severity} />
        <h2 className="ui:m-0 ui:min-w-0 ui:text-base ui:font-bold ui:break-words ui:text-foreground">
          {repo.remote ? (
            <button
              type="button"
              onClick={() => void api.openExternal(repo.remote!.webUrl)}
              title={`Abrir ${repo.remote.webUrl}`}
              className="ui-link ui:text-base ui:font-bold ui:text-foreground"
            >
              {repo.name}
            </button>
          ) : (
            repo.name
          )}
        </h2>
        {/*
          Ícone, e não chip: o que está em volta é estado, e isto é ação. Fica
          ao lado do nome porque são as duas saídas do painel — o nome leva ao
          código, o globo leva ao site no ar.
        */}
        {repo.appUrl && (
          <Button
            variant="icon"
            aria-label={`Abrir o site publicado de ${repo.name}`}
            title={`Abrir o site publicado: ${repo.appUrl}`}
            onClick={() => void api.openExternal(repo.appUrl!)}
          >
            <Globe aria-hidden />
          </Button>
        )}
        <span
          title={fetchedTitle}
          className="ui:ml-auto ui:shrink-0 ui:text-xs ui:text-muted-foreground"
        >
          {repo.lastFetchedAt
            ? `remoto lido ${formatRelativeDate(repo.lastFetchedAt)}`
            : 'nunca buscado'}
        </span>
      </div>
      <p className="ui:m-0 ui:font-mono ui:text-xs ui:break-all ui:text-muted-foreground ui:select-text">
        {repo.path}
      </p>
    </header>
  );

  if (repo.error) {
    return (
      <div className="ui:space-y-3">
        {header}
        <DetailsSection title="Erro na leitura">
          <p className="ui:m-0 ui:text-sm ui:font-semibold ui:text-danger">{repo.error}</p>
        </DetailsSection>
      </div>
    );
  }

  const worktree = worktreeItems(repo);
  const notices = branchNotices(repo);
  const prs = orderOpenPrs(repo);
  const branches = countBranches(repo);
  const remotes = remoteBranchNames(repo);

  return (
    <div className="ui:space-y-3">
      {header}

      <DetailsSection title="Resumo e pendências">
        <div className="ui:space-y-2.5">
          <div className="ui:flex ui:flex-wrap ui:items-center ui:gap-1.5">
            {repo.head?.branch && (
              <StatusChip label={repo.head.branch} icon={GitBranch} tone="emphasis" mono />
            )}
            <SyncChips repo={repo} />
          </div>

          <div className="ui:flex ui:flex-wrap ui:items-center ui:gap-1.5">
            {worktree.length === 0 ? (
              <p className="ui:m-0 ui:text-xs ui:text-muted-foreground">Working tree limpa</p>
            ) : (
              worktree.map((item) => (
                <StatusChip
                  key={item.key}
                  label={item.label}
                  icon={WORKTREE_ICONS[item.key]}
                  tone={item.tone}
                  title={
                    item.key === 'stashes'
                      ? 'Stashes existem só nesta máquina e são fáceis de esquecer'
                      : undefined
                  }
                />
              ))
            )}
          </div>

          {notices.map((notice) => {
            const Icon = NOTICE_ICONS[notice.key];
            return (
              <div key={notice.key} className="ui:flex ui:items-start ui:gap-2">
                <Icon
                  aria-hidden
                  width={15}
                  height={15}
                  className={`ui:mt-px ui:shrink-0 ${TONE_TEXT[notice.tone]}`}
                />
                <p className="ui:m-0 ui:text-xs ui:break-words ui:text-muted-foreground">
                  <span className={TONE_TEXT[notice.tone]}>{notice.label}:</span>{' '}
                  <span className="ui:font-mono ui:text-foreground">
                    {notice.branches.join(', ')}
                  </span>
                </p>
              </div>
            );
          })}
        </div>
      </DetailsSection>

      <DetailsSection
        title="Pull requests"
        meta={prs.length === 1 ? '1 aberto' : prs.length > 1 ? `${prs.length} abertos` : undefined}
        collapsible={prs.length > 0}
      >
        {prs.length === 0 ? (
          <p className="ui:m-0 ui:text-xs ui:text-muted-foreground">
            {repo.remote
              ? 'Nenhum PR aberto. Os PRs são consultados no "Buscar do remoto".'
              : 'Sem remoto configurado: não há PRs a consultar.'}
          </p>
        ) : (
          <ul className="ui:m-0 ui:list-none ui:divide-y ui:divide-border ui:p-0">
            {prs.map(({ pr, isCurrentBranch }) => (
              <PullRequestRow key={pr.number} pr={pr} isCurrentBranch={isCurrentBranch} />
            ))}
          </ul>
        )}
      </DetailsSection>

      <DetailsSection
        title="Branches"
        meta={`${branches.local} local(is) · ${branches.remote} remota(s)`}
        collapsible={repo.groups.length > 0}
        defaultOpen={false}
      >
        {repo.groups.length === 0 ? (
          <p className="ui:m-0 ui:text-xs ui:text-muted-foreground">
            Nenhuma branch encontrada.
          </p>
        ) : (
          <ul className="ui:m-0 ui:list-none ui:divide-y ui:divide-border ui:p-0">
            {repo.groups.map((group) => (
              <li key={group.commitHash} className="ui:space-y-1.5 ui:py-2">
                <CommitLine commit={group} />
                {/*
                  Local e remota não se separam por cor: o ícone de nuvem é o
                  segundo canal que a §1.7 exige, e o rótulo diz o mesmo a quem
                  não vê nenhum dos dois.
                */}
                <div className="ui:flex ui:flex-wrap ui:gap-1.5">
                  {group.branches.map((branch) => {
                    const remota = remotes.has(branch);
                    return (
                      <span
                        key={branch}
                        className={`ui:inline-flex ui:max-w-full ui:items-center ui:gap-1 ui:rounded-md ui:border ui:border-border ui:px-1.5 ui:py-0.5 ui:font-mono ui:text-xs ${
                          remota
                            ? 'ui:text-muted-foreground'
                            : 'ui:bg-accent ui:text-foreground'
                        }`}
                      >
                        {remota ? (
                          <Cloud aria-label="Branch remota" width={12} height={12} />
                        ) : (
                          <HardDrive aria-label="Branch local" width={12} height={12} />
                        )}
                        <span className="ui:truncate">{branch}</span>
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DetailsSection>

      <DetailsSection title="Último commit">
        {repo.head?.commitHash ? (
          <CommitLine commit={repo.head} />
        ) : (
          /*
            Fora de uma branch o main não lê o commit do HEAD (`buildHead`), e
            dizer "ainda não tem commits" ali seria falso: o commit está no
            agrupamento da seção de branches.
          */
          <p className="ui:m-0 ui:text-xs ui:text-muted-foreground">
            {repo.head?.detached
              ? 'HEAD detached: sem branch atual, o último commit aparece no agrupamento das branches.'
              : 'Este repositório ainda não tem commits.'}
          </p>
        )}
      </DetailsSection>
    </div>
  );
}
