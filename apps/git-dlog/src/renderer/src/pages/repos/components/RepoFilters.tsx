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
    <div className="ui:space-y-2">
      <div className="ui:relative ui:max-w-[360px]">
        <Search
          aria-hidden
          width={15}
          height={15}
          className="ui:pointer-events-none ui:absolute ui:top-1/2 ui:left-2.5 ui:-translate-y-1/2 ui:text-muted-foreground"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Filtrar repositórios por nome ou caminho"
          placeholder="Filtrar por nome ou caminho"
          className="ui-input ui:h-9 ui:w-full ui:rounded-md ui:border ui:border-border ui:bg-paper ui:pr-9 ui:pl-8 ui:text-foreground"
        />
        {search && (
          <Button
            variant="icon"
            aria-label="Limpar busca"
            onClick={() => onSearchChange('')}
            className="ui:absolute ui:top-1/2 ui:right-1 ui:-translate-y-1/2"
          >
            <X aria-hidden width={15} height={15} />
          </Button>
        )}
      </div>

      <div className="ui:flex ui:flex-wrap ui:gap-1.5">
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
      className={`ui-button ui:h-7 ui:rounded-md ui:border ui:px-2.5 ui:text-xs ui:font-medium ${
        active
          ? 'ui:border-primary ui:bg-accent ui:text-foreground'
          : 'ui:border-border ui:text-muted-foreground ui:hover:bg-accent ui:hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}
