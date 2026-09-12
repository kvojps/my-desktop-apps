import { FilterX } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { Field, SelectInput, TextInput } from '@/components/Field';
import { ItemsFilter } from '@/hooks/useItemsFilter';

interface Option<V extends string> {
  value: V;
  label: string;
}

interface ItemsTabProps<T, Status extends string, Sort extends string> {
  filter: ItemsFilter<T, Status, Sort>;
  /** Quantos itens o mês tem antes de qualquer filtro. */
  totalCount: number;
  columns: Column<T>[];
  /** Singular do que a busca procura, para o rótulo: "despesa", "entrada". */
  searchLabel: string;
  /** Quando o mês não tem nenhum item. */
  emptyMessage: string;
  /** Ícone da aba, usado no estado vazio de mês sem itens. */
  emptyIcon: ReactNode;
  /** Quando os filtros não deixaram nada. */
  noResultsMessage: string;
  addLabel: string;
  /** Plural do que a tabela lista, para o rodapé: "despesas", "entradas". */
  footerLabel: string;
  statusOptions: Option<Status>[];
  /** Filtro adicional da aba, montado por quem usa (ex.: categoria). */
  extraFilter?: ReactNode;
  getRowKey: (item: T) => string;
  getRowLabel: (item: T) => string;
  renderActions: (item: T) => ReactNode;
  onRowClick: (item: T) => void;
  onAdd: () => void;
}

/** Corpo de uma aba do mês: filtros e a tabela paginada. */
export function ItemsTab<T, Status extends string, Sort extends string>({
  filter,
  totalCount,
  columns,
  searchLabel,
  emptyMessage,
  emptyIcon,
  noResultsMessage,
  addLabel,
  footerLabel,
  statusOptions,
  extraFilter,
  getRowKey,
  getRowLabel,
  renderActions,
  onRowClick,
  onAdd,
}: ItemsTabProps<T, Status, Sort>) {
  // Mês sem nenhum item não ganha barra de filtros: não há o que estreitar, e
  // um filtro sobre o vazio só sugere que o vazio é culpa dele (§5.4).
  const hasItems = totalCount > 0;

  // Os dois vazios do §5.4 são diferentes e a diferença é o `isFiltered`:
  // "cadastre a primeira despesa" para quem não tem nenhuma, "limpe o filtro"
  // para quem tem doze e digitou errado.
  const empty = filter.isFiltered ? (
    <EmptyState
      icon={<FilterX size={40} aria-hidden="true" />}
      title={noResultsMessage}
      action={<Button onClick={filter.reset}>Limpar filtros</Button>}
    />
  ) : (
    <EmptyState
      icon={emptyIcon}
      title={emptyMessage}
      action={
        <Button variant="primary" onClick={onAdd}>
          {addLabel}
        </Button>
      }
    />
  );

  return (
    <>
      {/* Controles, não conteúdo: a barra não tem superfície própria porque a
          tabela logo abaixo já é um painel com borda, e uma segunda caixa
          encostada nela vira caixa dentro de caixa (§4).

          A ordenação saiu daqui — ela agora é o cabeçalho da tabela, como na
          Visão Geral. O que sobrou são os três controles que de fato estreitam
          a lista, e eles cabem numa linha com folga mesmo na janela mínima. */}
      {hasItems && (
        <div className="money-filters">
          <Field label={`Buscar ${searchLabel}`}>
            <TextInput
              type="search"
              placeholder={`Nome da ${searchLabel}`}
              value={filter.search}
              onChange={(event) => filter.setSearch(event.target.value)}
            />
          </Field>

          <Field label="Status">
            <SelectInput
              value={filter.status}
              onChange={(event) => filter.setStatus(event.target.value as Status)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>

          {extraFilter}
        </div>
      )}

      <DataTable
        columns={columns}
        items={filter.visible}
        totalCount={filter.filtered.length}
        start={filter.start}
        sort={{ key: filter.sort, direction: filter.direction }}
        onToggleSort={filter.toggleSort}
        renderActions={renderActions}
        getRowKey={getRowKey}
        getRowLabel={getRowLabel}
        footerLabel={footerLabel}
        onRowClick={onRowClick}
        empty={empty}
        pagination={{
          currentPage: filter.page,
          totalPages: filter.totalPages,
          onPageChange: filter.setPage,
        }}
      />
    </>
  );
}
