import { GitBranch } from 'lucide-react';
import type { RepoScanResult } from '@shared/types/repoScan';
import { summarizePendencies } from '@/pages/repos/utils/repoList';
import { SeverityBadge } from './SeverityBadge';

/**
 * Uma linha da lista: severidade, nome, branch atual e o resumo das pendências
 * com contagens. O caminho só aparece quando há outro repositório de mesmo
 * nome — é aí que ele resolve alguma coisa.
 */
export function RepoListItem({
  repo,
  pathHint,
  selected,
  onSelect,
}: {
  repo: RepoScanResult;
  pathHint?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const pendencies = summarizePendencies(repo);

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className="orca-repo-item orca:space-y-1 orca:px-3 orca:py-2.5"
      >
        <span className="orca:flex orca:items-center orca:gap-2">
          <SeverityBadge level={repo.error ? 'error' : repo.severity} />
          <span className="orca:truncate orca:text-sm orca:font-semibold orca:text-foreground">
            {repo.name}
          </span>
          {pathHint && (
            <span
              className="orca:truncate orca:font-mono orca:text-xs orca:text-muted-foreground"
              title={repo.path}
            >
              {pathHint}
            </span>
          )}
        </span>

        {repo.error ? (
          <span className="orca:line-clamp-2 orca:text-xs orca:text-muted-foreground">
            {repo.error}
          </span>
        ) : (
          <span className="orca:flex orca:flex-wrap orca:items-center orca:gap-x-2 orca:gap-y-1 orca:text-xs">
            {repo.head?.branch && (
              <span className="orca:inline-flex orca:min-w-0 orca:items-center orca:gap-1 orca:text-muted-foreground">
                <GitBranch aria-hidden width={12} height={12} className="orca:shrink-0" />
                <span className="orca:truncate orca:font-mono">{repo.head.branch}</span>
              </span>
            )}
            {pendencies.length === 0 ? (
              <span className="orca:text-muted-foreground">nada pendente</span>
            ) : (
              pendencies.map((pendency) => (
                <span
                  key={pendency.key}
                  className={
                    pendency.tone === 'risk'
                      ? 'orca:font-semibold orca:text-foreground'
                      : 'orca:text-muted-foreground'
                  }
                >
                  {pendency.label}
                </span>
              ))
            )}
          </span>
        )}
      </button>
    </li>
  );
}
