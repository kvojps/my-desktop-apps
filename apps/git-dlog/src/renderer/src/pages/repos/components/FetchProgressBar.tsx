import type { RepoFetchProgress } from '@shared/types/repoScan';

const PHASE_LABEL: Record<RepoFetchProgress['phase'], string> = {
  git: 'Buscando do remoto',
  prs: 'Consultando PRs',
};

/**
 * "Buscar do remoto" é a única operação de rede do app e tem duas fases. O
 * progresso diz qual delas está rodando, em que repositório e quanto falta —
 * antes de a primeira fase reportar qualquer coisa, a barra é indeterminada.
 */
export function FetchProgressBar({ progress }: { progress: RepoFetchProgress | null }) {
  const percent = progress ? Math.round((progress.done / Math.max(progress.total, 1)) * 100) : null;

  return (
    <div className="ui:space-y-2 ui:rounded-lg ui:border ui:border-border ui:bg-paper ui:p-3">
      <div className="ui:flex ui:items-center ui:justify-between ui:gap-2 ui:text-xs ui:text-muted-foreground">
        <span className="ui:truncate">
          {progress
            ? `${PHASE_LABEL[progress.phase]}: ${progress.current}`
            : 'Preparando busca nos remotos...'}
        </span>
        {progress && (
          <span className="ui:shrink-0">
            {progress.done}/{progress.total}
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Progresso da busca no remoto"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        className="ui:h-1 ui:overflow-hidden ui:rounded-md ui:bg-accent"
      >
        <div
          className={`ui:h-full ui:bg-primary ${percent === null ? 'ui-skeleton ui:w-full' : ''}`}
          style={percent === null ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
