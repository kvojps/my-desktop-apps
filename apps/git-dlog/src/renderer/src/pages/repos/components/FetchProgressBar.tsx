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
    <div className="orca:space-y-2 orca:rounded-lg orca:border orca:border-border orca:bg-paper orca:p-3">
      <div className="orca:flex orca:items-center orca:justify-between orca:gap-2 orca:text-xs orca:text-muted-foreground">
        <span className="orca:truncate">
          {progress
            ? `${PHASE_LABEL[progress.phase]}: ${progress.current}`
            : 'Preparando busca nos remotos...'}
        </span>
        {progress && (
          <span className="orca:shrink-0">
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
        className="orca:h-1 orca:overflow-hidden orca:rounded-md orca:bg-accent"
      >
        <div
          className={`orca:h-full orca:bg-primary ${percent === null ? 'orca-skeleton orca:w-full' : ''}`}
          style={percent === null ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
