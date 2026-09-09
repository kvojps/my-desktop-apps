import {
  Box,
  Pagination,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
} from '@mui/material';
import { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
}

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  items: T[];
  getRowKey: (row: T) => string | number;
  empty?: ReactNode;
  pagination?: DataTablePaginationProps;
  /** Dentro de um acordeão, onde a superfície já é a do painel (docs/design-system.md §4). */
  flush?: boolean;
}

/**
 * Lista tabular. Traz a própria `Paper` e a própria `Pagination` — não
 * envolva em `Card`, não renderize `Pagination` como irmã
 * (docs/design-system.md §3.1). O azul só aparece no cabeçalho e na linha sob
 * o cursor; a zebra é acromática de propósito (§1.6).
 */
export function DataTable<T>({
  columns,
  items,
  getRowKey,
  empty,
  pagination,
  flush = false,
}: DataTableProps<T>) {
  const theme = useTheme();
  const tint = (opacity: number) => {
    const factor = theme.palette.mode === 'dark' ? 1.8 : 1;
    return alpha(theme.palette.primary.main, opacity * factor);
  };
  const zebra = theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.028) : alpha('#000000', 0.022);

  if (items.length === 0 && empty) {
    return <>{empty}</>;
  }

  const table = (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: tint(0.06) }}>
          {columns.map((column) => (
            <TableCell key={column.key} align={column.align ?? 'left'}>
              {column.header}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map((row, index) => (
          <TableRow
            key={getRowKey(row)}
            hover
            sx={{
              bgcolor: index % 2 === 1 ? zebra : 'transparent',
              '&:hover': { bgcolor: tint(0.1) },
            }}
          >
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align ?? 'left'}>
                {column.render(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Box>
      {flush ? (
        <TableContainer>{table}</TableContainer>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          {table}
        </TableContainer>
      )}
      {pagination && pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.currentPage}
            onChange={(_event, page) => pagination.onPageChange(page)}
            size="small"
          />
        </Box>
      )}
    </Box>
  );
}
