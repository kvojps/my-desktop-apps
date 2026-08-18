import { FilterAltOffOutlined, Search } from '@mui/icons-material';
import {
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { ReactNode } from 'react';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
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
  searchPlaceholder: string;
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
  searchPlaceholder,
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
      icon={<FilterAltOffOutlined sx={{ fontSize: 40 }} />}
      title={noResultsMessage}
      action={<Button onClick={filter.reset}>Limpar filtros</Button>}
    />
  ) : (
    <EmptyState
      icon={emptyIcon}
      title={emptyMessage}
      action={
        <Button variant="contained" onClick={onAdd}>
          {addLabel}
        </Button>
      }
    />
  );

  return (
    <>
      {/* Controles, não conteúdo: a barra não tem superfície própria porque a
          tabela logo abaixo já é um `Paper` com borda, e uma segunda caixa
          encostada nela vira caixa dentro de caixa.

          A ordenação saiu daqui — ela agora é o cabeçalho da tabela, como na
          Visão Geral —, e com ela saiu o alternador lista/grade. O que sobrou
          são os três controles que de fato estreitam a lista, e eles cabem
          numa linha com folga mesmo na janela mínima. */}
      {hasItems && (
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={filter.search}
            onChange={(e) => filter.setSearch(e.target.value)}
            sx={{ width: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter.status}
              label="Status"
              onChange={(e) => filter.setStatus(e.target.value as Status)}
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {extraFilter}
        </Stack>
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
