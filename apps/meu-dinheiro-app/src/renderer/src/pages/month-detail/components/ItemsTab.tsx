import {
  FilterAltOffOutlined,
  GridViewOutlined,
  Search,
  ViewListOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import { Key, ReactNode } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { ItemsFilter } from '@/hooks/useItemsFilter';
import { ListView, useListView } from '@/hooks/useListView';
import { cardGrid } from '@/theme';

interface Option<V extends string> {
  value: V;
  label: string;
}

interface ItemsTabProps<T, Status extends string, Sort extends string> {
  filter: ItemsFilter<T, Status, Sort>;
  /** Quantos itens o mês tem antes de qualquer filtro. */
  totalCount: number;
  searchPlaceholder: string;
  /** Quando o mês não tem nenhum item. */
  emptyMessage: string;
  /** Ícone da aba, usado nos dois estados vazios. */
  emptyIcon: ReactNode;
  /** Quando os filtros não deixaram nada. */
  noResultsMessage: string;
  addLabel: string;
  statusOptions: Option<Status>[];
  sortOptions: Option<Sort>[];
  /** Filtro adicional da aba, montado por quem usa (ex.: categoria). */
  extraFilter?: ReactNode;
  getKey: (item: T) => Key;
  /** Visualização em lista densa — o padrão. */
  renderRow: (item: T) => ReactNode;
  /** Visualização em grade de cards. */
  renderItem: (item: T) => ReactNode;
  onAdd: () => void;
}

/** Corpo de uma aba do mês: filtros, lista paginada e o botão de adicionar. */
export function ItemsTab<T, Status extends string, Sort extends string>({
  filter,
  totalCount,
  searchPlaceholder,
  emptyMessage,
  emptyIcon,
  noResultsMessage,
  addLabel,
  statusOptions,
  sortOptions,
  extraFilter,
  getKey,
  renderRow,
  renderItem,
  onAdd,
}: ItemsTabProps<T, Status, Sort>) {
  const { view, setView } = useListView();

  if (totalCount === 0) {
    return (
      <Card variant="outlined">
        <EmptyState
          icon={emptyIcon}
          title={emptyMessage}
          action={
            <Button variant="contained" onClick={onAdd}>
              {addLabel}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <>
      {/* Controles, não conteúdo: barra sem fundo próprio para não competir
          visualmente com as linhas da lista logo abaixo.

          Dois grupos — o que filtra e o que apresenta — em vez de controles
          soltos. Com `ml: 'auto'` num só filho, a quebra de linha jogava
          "Ordenar por" para a direita de uma linha vazia, deixando um vão de
          ~540px no meio da barra. `space-between` entre dois grupos dá o mesmo
          alinhamento quando tudo cabe numa linha e, quando não cabe, cada grupo
          começa na margem esquerda da sua.

          O status é um select, e não uma fileira de chips: os chips cresciam com
          a quantidade de estados (289px para quatro) e eram o que mais empurrava
          a barra para uma segunda linha.

          As larguras estão dimensionadas para a barra inteira caber numa linha
          na janela mínima, onde há 790px: 200 + 140 + 150 (filtros) + 150 + 70
          (apresentação) + 5 vãos de 12px = 770. Antes eram 872 e a barra
          quebrava.

          Nenhum controle cresce. Um `flex-grow` na busca parece atraente para
          ocupar a sobra, mas a contribuição de max-content do item passa a
          incluir o teto do crescimento — o container conclui que não cabe e
          quebra a linha justamente na janela mínima, que é o caso a proteger. */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        justifyContent="space-between"
        sx={{ pb: 2, mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
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

        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={filter.sort}
              label="Ordenar por"
              onChange={(e) => filter.setSort(e.target.value as Sort)}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, next: ListView | null) => next && setView(next)}
          >
            <ToggleButton value="list" aria-label="Ver em lista">
              <Tooltip title="Lista">
                <ViewListOutlined fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="grid" aria-label="Ver em grade">
              <Tooltip title="Grade">
                <GridViewOutlined fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {filter.filtered.length === 0 ? (
        <EmptyState
          icon={<FilterAltOffOutlined sx={{ fontSize: 40 }} />}
          title={noResultsMessage}
          action={<Button onClick={filter.reset}>Limpar filtros</Button>}
        />
      ) : view === 'list' ? (
        <Stack spacing={1}>
          {filter.visible.map((item) => (
            <Box key={getKey(item)}>{renderRow(item)}</Box>
          ))}
        </Stack>
      ) : (
        /* Grade guiada pela largura disponível: os breakpoints do MUI olham a
           janela e davam três colunas quando só cabiam duas. */
        <Box sx={{ ...cardGrid(280), gap: 2 }}>
          {filter.visible.map((item) => (
            <Box key={getKey(item)}>{renderItem(item)}</Box>
          ))}
        </Box>
      )}

      <Pagination
        currentPage={filter.page}
        totalPages={filter.totalPages}
        onPageChange={filter.setPage}
      />
    </>
  );
}
