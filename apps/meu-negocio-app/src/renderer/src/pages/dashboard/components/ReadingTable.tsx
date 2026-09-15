import type { ReactNode } from 'react';

export interface ReadingColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
}

interface ReadingTableProps<T> {
  /** O que a tabela lista, para quem chega nela sem ver o título da seção. */
  caption: string;
  columns: ReadingColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
}

/**
 * A alternativa em tabela de um gráfico: os mesmos dados, em linhas que o
 * teclado e o leitor de tela alcançam. Não é o `DataTable` porque não é lista
 * de trabalho — não pagina, não ordena, não tem ações nem rodapé de contagem;
 * a superfície é a da seção que a contém. Cabeçalho, rótulo e valor vão todos
 * à esquerda (§2.1).
 */
export function ReadingTable<T>({ caption, columns, rows, getRowKey }: ReadingTableProps<T>) {
  return (
    <div className="negocio-table-scroll">
      <table className="negocio-table">
        <caption className="negocio-sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
