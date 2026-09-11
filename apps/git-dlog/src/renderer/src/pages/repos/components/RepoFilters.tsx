import { Search, X } from 'lucide-react';
import { Button } from '@/components/Button';
import type { RepoFilter } from '@/pages/repos/utils/repoList';
import { REPO_FILTERS } from '@/pages/repos/utils/repoList';

/**
 * Busca e filtros da lista. As contagens descrevem o resultado da busca, e não
 * o total: o chip promete o que a pessoa vai ver ao clicar nele.
 */
export function RepoFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  counts,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filter: RepoFilter;
  onFilterChange: (value: RepoFilter) => void;
  counts: Record<RepoFilter, number>;
}) {
  return (
    <div className="orca:space-y-2">
      <div className="orca:relative orca:max-w-[360px]">
        <Search
          aria-hidden
          width={15}
          height={15}
          className="orca:pointer-events-none orca:absolute orca:top-1/2 orca:left-2.5 orca:-translate-y-1/2 orca:text-muted-foreground"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Filtrar repositórios por nome ou caminho"
          placeholder="Filtrar por nome ou caminho"
          className="orca-input orca:h-9 orca:w-full orca:rounded-md orca:border orca:border-border orca:bg-paper orca:pr-9 orca:pl-8 orca:text-foreground"
        />
        {search && (
          <Button
            variant="icon"
            aria-label="Limpar busca"
            onClick={() => onSearchChange('')}
            className="orca:absolute orca:top-1/2 orca:right-1 orca:-translate-y-1/2"
          >
            <X aria-hidden width={15} height={15} />
          </Button>
        )}
      </div>

      <div className="orca:flex orca:flex-wrap orca:gap-1.5">
        <FilterChip
          label={`todos (${counts.all})`}
          active={filter === 'all'}
          onClick={() => onFilterChange('all')}
        />
        {REPO_FILTERS.map(({ value, label }) => {
          const count = counts[value];
          if (count === 0) return null;
          const active = filter === value;
          return (
            <FilterChip
              key={value}
              label={`${count} ${label}`}
              active={active}
              onClick={() => onFilterChange(active ? 'all' : value)}
            />
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`orca-button orca:h-7 orca:rounded-md orca:border orca:px-2.5 orca:text-xs orca:font-medium ${
        active
          ? 'orca:border-primary orca:bg-accent orca:text-foreground'
          : 'orca:border-border orca:text-muted-foreground orca:hover:bg-accent orca:hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
