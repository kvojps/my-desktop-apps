import {
  Box,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { Pagination } from '@/components/Pagination';

export interface Column<T> {
  key: (keyof T & string) | (string & {});
  label: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  items: T[];
  totalCount: number;
  start: number;
  sort: { key: string | null; direction: 'asc' | 'desc' };
  onToggleSort?: (key: string) => void;
  renderActions?: (item: T) => React.ReactNode;
  getRowKey: (item: T) => string;
  footerLabel: string;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Ícone grande do estado vazio — reforça que a lista está vazia de propósito. */
  emptyIcon?: React.ReactNode;
  /** Ação que resolve o vazio, no próprio lugar onde o usuário percebeu a falta. */
  emptyAction?: React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

const SKELETON_ROWS = 5;

export function DataTable<T>({
  columns,
  items,
  totalCount,
  start,
  sort,
  onToggleSort,
  renderActions,
  getRowKey,
  footerLabel,
  isLoading,
  emptyMessage,
  emptyIcon,
  emptyAction,
  pagination,
}: DataTableProps<T>) {
  const colSpan = columns.length + (renderActions ? 1 : 0);

  function renderBody() {
    // Enquanto o SQLite responde, a tabela mantém a própria forma em vez de
    // piscar um "nenhum registro" que não é verdade ainda.
    if (isLoading) {
      return Array.from({ length: SKELETON_ROWS }, (_, row) => (
        <TableRow key={`skeleton-${row}`}>
          {Array.from({ length: colSpan }, (_, col) => (
            <TableCell key={col}>
              <Skeleton variant="text" width={col === 0 ? '60%' : '40%'} />
            </TableCell>
          ))}
        </TableRow>
      ));
    }

    if (totalCount === 0) {
      return (
        <TableRow>
          <TableCell colSpan={colSpan} align="center" sx={{ borderBottom: 0 }}>
            <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
              {emptyIcon && <Box sx={{ display: 'flex', color: 'text.disabled' }}>{emptyIcon}</Box>}
              <Typography variant="body2" color="text.secondary">
                {emptyMessage ?? 'Nenhum registro encontrado.'}
              </Typography>
              {emptyAction}
            </Stack>
          </TableCell>
        </TableRow>
      );
    }

    return items.map((item) => (
      <TableRow key={getRowKey(item)} hover>
        {columns.map((col) => (
          <TableCell key={col.key}>{col.render(item)}</TableCell>
        ))}
        {renderActions && <TableCell align="right">{renderActions(item)}</TableCell>}
      </TableRow>
    ));
  }

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  sortDirection={col.sortable && sort.key === col.key ? sort.direction : false}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={sort.key === col.key}
                      direction={sort.key === col.key ? sort.direction : 'asc'}
                      onClick={() => onToggleSort?.(col.key)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
              {renderActions && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {isLoading ? (
            <Skeleton variant="text" width={180} />
          ) : totalCount > 0 ? (
            `Mostrando ${start + 1}–${start + items.length} de ${totalCount} ${footerLabel}`
          ) : (
            `Mostrando 0 de 0 ${footerLabel}`
          )}
        </Typography>
      </Box>

      {!isLoading && pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </Paper>
  );
}
