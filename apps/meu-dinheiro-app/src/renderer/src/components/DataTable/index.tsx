import {
  Box,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import { ReactNode } from 'react';
import { Pagination } from '@/components/Pagination';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  /**
   * Largura da coluna (qualquer valor CSS). Sem ela a tabela distribui pelo
   * conteúdo, o que deixa a primeira coluna comendo a sobra e abre um vão entre
   * o rótulo e os números. Vale para o cabeçalho e para o corpo, senão os dois
   * discordam e o navegador arbitra.
   */
  width?: number | string;
  /** Ícone do cabeçalho, antes do rótulo. Não aparece nas linhas. */
  icon?: ReactNode;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  items: T[];
  totalCount: number;
  start: number;
  sort?: { key: string | null; direction: 'asc' | 'desc' };
  onToggleSort?: (key: string) => void;
  renderActions?: (item: T) => ReactNode;
  getRowKey: (item: T) => string;
  footerLabel: string;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  /** Estado vazio completo — ícone, frase e a ação que resolve. */
  empty?: ReactNode;
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
  onRowClick,
  empty,
  pagination,
}: DataTableProps<T>) {
  const colSpan = columns.length + (renderActions ? 1 : 0);

  function renderBody() {
    // Enquanto o SQLite responde, a tabela mantém a própria forma em vez de
    // piscar um "nenhum registro" que ainda não é verdade.
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
          <TableCell colSpan={colSpan} sx={{ borderBottom: 0 }}>
            {empty}
          </TableCell>
        </TableRow>
      );
    }

    return items.map((item) => (
      <TableRow
        key={getRowKey(item)}
        hover
        onClick={onRowClick ? () => onRowClick(item) : undefined}
        sx={onRowClick ? { cursor: 'pointer' } : undefined}
      >
        {columns.map((col) => (
          <TableCell key={col.key} align={col.align} sx={{ width: col.width }}>
            {col.render(item)}
          </TableCell>
        ))}
        {renderActions && <TableCell align="right">{renderActions(item)}</TableCell>}
      </TableRow>
    ));
  }

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => {
                // O ícone fica só no cabeçalho: repeti-lo em cada linha diria a
                // mesma coisa doze vezes e disputaria a leitura com o número.
                const heading = col.icon ? (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      // Sem isto o ícone vira o começo da caixa e o rótulo
                      // desalinha da coluna de números que ele encabeça.
                      flexDirection: col.align === 'right' ? 'row-reverse' : 'row',
                    }}
                  >
                    <Box
                      component="span"
                      aria-hidden
                      sx={{ display: 'flex', color: 'text.secondary', fontSize: 16 }}
                    >
                      {col.icon}
                    </Box>
                    {col.label}
                  </Box>
                ) : (
                  col.label
                );

                return (
                  <TableCell
                    key={col.key}
                    align={col.align}
                    sx={{ width: col.width }}
                    sortDirection={col.sortable && sort?.key === col.key ? sort.direction : false}
                  >
                    {col.sortable ? (
                      <TableSortLabel
                        active={sort?.key === col.key}
                        direction={sort?.key === col.key ? sort.direction : 'asc'}
                        onClick={() => onToggleSort?.(col.key)}
                      >
                        {heading}
                      </TableSortLabel>
                    ) : (
                      heading
                    )}
                  </TableCell>
                );
              })}
              {renderActions && <TableCell align="right">Ações</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
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
