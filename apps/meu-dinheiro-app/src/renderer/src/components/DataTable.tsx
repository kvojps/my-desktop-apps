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
import { KeyboardEvent, ReactNode } from 'react';
import { Pagination } from '@/components/Pagination';

/**
 * Sem `align`: cabeçalho, rótulo e valor vão todos à esquerda (§2.1). A única
 * célula à direita é a de ações, e ela é do próprio componente — a regra é
 * imposta aqui, em vez de depender de cada tela repetir a escolha.
 */
export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
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
  /** Como a linha se anuncia quando ela é clicável. Sem isto ela vira "button". */
  getRowLabel?: (item: T) => string;
  footerLabel: string;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  /**
   * Sem a superfície própria, para quando a tabela já mora dentro de uma —
   * o `AccordionDetails` das Configurações. Um `Paper` com borda dentro de
   * outro vira caixa dentro de caixa.
   */
  flush?: boolean;
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
  getRowLabel,
  footerLabel,
  isLoading,
  onRowClick,
  flush,
  empty,
  pagination,
}: DataTableProps<T>) {
  const colSpan = columns.length + (renderActions ? 1 : 0);

  /**
   * Linha clicável é um controle, e controle precisa existir para o teclado
   * (§5.5). O `Enter`/`Espaço` só valem quando o foco está na própria linha —
   * dentro da célula de ações eles pertencem ao botão que os recebeu.
   */
  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, item: T) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onRowClick?.(item);
  }

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
        role={onRowClick ? 'button' : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        aria-label={onRowClick ? getRowLabel?.(item) : undefined}
        onClick={onRowClick ? () => onRowClick(item) : undefined}
        onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, item) : undefined}
        sx={onRowClick ? { cursor: 'pointer' } : undefined}
      >
        {columns.map((col) => (
          <TableCell key={col.key}>{col.render(item)}</TableCell>
        ))}
        {renderActions && (
          // A ação da linha não pode disparar o clique da linha: "Pagar" abriria
          // o diálogo de pagamento e o de detalhes ao mesmo tempo.
          <TableCell align="right" onClick={(event) => event.stopPropagation()}>
            {renderActions(item)}
          </TableCell>
        )}
      </TableRow>
    ));
  }

  // O miolo é o mesmo nos dois modos; só o invólucro muda. Sem a borda do
  // `Paper`, quem abre e fecha a tabela são a faixa tonal do cabeçalho e a
  // régua superior do rodapé.
  const body = (
    <>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  sortDirection={col.sortable && sort?.key === col.key ? sort.direction : false}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={sort?.key === col.key}
                      direction={sort?.key === col.key ? sort.direction : 'asc'}
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
    </>
  );

  return flush ? <Box>{body}</Box> : <Paper variant="outlined">{body}</Paper>;
}
