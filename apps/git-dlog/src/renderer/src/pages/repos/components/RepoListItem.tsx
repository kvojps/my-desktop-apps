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
        className="ui-repo-item ui:space-y-1 ui:px-3 ui:py-2.5"
      >
        <span className="ui:flex ui:items-center ui:gap-2">
          <SeverityBadge level={repo.error ? 'error' : repo.severity} />
          <span className="ui:truncate ui:text-sm ui:font-semibold ui:text-foreground">
            {repo.name}
          </span>
          {pathHint && (
            <span
              className="ui:truncate ui:font-mono ui:text-xs ui:text-muted-foreground"
              title={repo.path}
            >
              {pathHint}
            </span>
          )}
        </span>

        {repo.error ? (
          <span className="ui:line-clamp-2 ui:text-xs ui:text-muted-foreground">
            {repo.error}
          </span>
        ) : (
          <span className="ui:flex ui:flex-wrap ui:items-center ui:gap-x-2 ui:gap-y-1 ui:text-xs">
            {repo.head?.branch && (
              <span className="ui:inline-flex ui:min-w-0 ui:items-center ui:gap-1 ui:text-muted-foreground">
                <GitBranch aria-hidden width={12} height={12} className="ui:shrink-0" />
                <span className="ui:truncate ui:font-mono">{repo.head.branch}</span>
              </span>
            )}
            {pendencies.length === 0 ? (
              <span className="ui:text-muted-foreground">nada pendente</span>
            ) : (
              pendencies.map((pendency) => (
                <span
                  key={pendency.key}
                  className={
                    pendency.tone === 'risk'
                      ? 'ui:font-semibold ui:text-foreground'
                      : 'ui:text-muted-foreground'
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
