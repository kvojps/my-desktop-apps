import { ChevronDown, ChevronUp } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Pagination } from '@/components/Pagination';

/**
 * Sem `align`: cabeçalho, rótulo e valor vão todos à esquerda (§2.1). A única
 * célula à direita é a de ações, e ela é do próprio componente — a regra é
 * imposta aqui, em vez de depender de cada tela repetir a escolha.
 */
export interface Column<T> {
  key: (keyof T & string) | (string & {});
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
   * Sem a superfície própria, para quando a tabela já mora dentro de uma — os
   * cards de seção do Dashboard. Um `Paper` com borda dentro de outro vira
   * caixa dentro de caixa.
   */
  flush?: boolean;
  /** Estado vazio completo — ícone, frase e a ação que resolve. Use `EmptyState`. */
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
    // piscar um "nenhum registro" que não é verdade ainda.
    if (isLoading) {
      return Array.from({ length: SKELETON_ROWS }, (_, row) => (
        <tr key={`skeleton-${row}`}>
          {Array.from({ length: colSpan }, (_, col) => (
            <td key={col}>
              <span className="negocio-skeleton" style={{ width: col === 0 ? '60%' : '40%' }} />
            </td>
          ))}
        </tr>
      ));
    }

    if (totalCount === 0) {
      return (
        <tr>
          <td colSpan={colSpan} className="negocio-cell-empty">
            {empty}
          </td>
        </tr>
      );
    }

    return items.map((item) => (
      <tr
        key={getRowKey(item)}
        role={onRowClick ? 'button' : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        aria-label={onRowClick ? getRowLabel?.(item) : undefined}
        onClick={onRowClick ? () => onRowClick(item) : undefined}
        onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, item) : undefined}
      >
        {columns.map((col) => (
          <td key={col.key}>{col.render(item)}</td>
        ))}
        {renderActions && (
          // A ação da linha não pode disparar o clique da linha: "Ver" abriria o
          // detalhe do pedido e o menu de ações ao mesmo tempo. É o par de mouse
          // da guarda de teclado acima.
          <td className="negocio-cell-actions" onClick={(event) => event.stopPropagation()}>
            {renderActions(item)}
          </td>
        )}
      </tr>
    ));
  }

  // O miolo é o mesmo nos dois modos; só o invólucro muda. Sem a borda do
  // `Paper`, quem abre e fecha a tabela são a faixa tonal do cabeçalho e a
  // régua superior do rodapé.
  const body = (
    <>
      <div className="negocio-table-scroll">
        <table className="negocio-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    sort?.key === col.key
                      ? sort.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className="negocio-sort"
                      data-active={sort?.key === col.key}
                      onClick={() => onToggleSort?.(col.key)}
                    >
                      {col.label}
                      {sort?.key === col.key && sort.direction === 'asc' ? (
                        <ChevronUp aria-hidden="true" />
                      ) : (
                        <ChevronDown aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {renderActions && (
                <th scope="col" className="negocio-cell-actions">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>
      <div className="negocio-table-footer">
        {isLoading ? (
          <span className="negocio-skeleton" style={{ width: 180 }} />
        ) : totalCount > 0 ? (
          `Mostrando ${start + 1}–${start + items.length} de ${totalCount} ${footerLabel}`
        ) : (
          `Mostrando 0 de 0 ${footerLabel}`
        )}
      </div>

      {!isLoading && pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.onPageChange}
        />
      )}
    </>
  );

  return (
    <div className={flush ? 'negocio-table-flush' : 'negocio-panel negocio-table-panel'}>
      {body}
    </div>
  );
}
