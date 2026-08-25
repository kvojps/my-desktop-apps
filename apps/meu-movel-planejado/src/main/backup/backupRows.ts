/**
 * A conciliação entre as colunas que o arquivo de backup traz e as colunas que
 * a tabela tem **hoje**.
 *
 * O formato do backup são as linhas cruas das tabelas, e é este módulo que faz
 * essa escolha valer alguma coisa: um arquivo gerado antes de uma migração
 * continua importável, porque a coluna que ele não conhece simplesmente não
 * entra na gravação e fica com o default da tabela.
 *
 * A regra que não pode ser afrouxada: **nome de coluna sai da tabela viva,
 * nunca do arquivo**. O arquivo é entrada externa, e o nome de coluna é
 * identificador de SQL, que não aceita vínculo de parâmetro — o que o arquivo
 * decide é quais das colunas conhecidas serão gravadas, jamais quais existem.
 *
 * Módulo puro, sem import de runtime, para ficar ao alcance da suíte.
 */

/** Uma linha crua: o que o SQLite guarda numa tabela deste app. */
export type BackupRow = Record<string, string | number | null>;

/**
 * As colunas que a gravação vai usar: as da tabela viva que aparecem em pelo
 * menos uma linha do arquivo, na ordem da tabela.
 *
 * Reunir as colunas de todas as linhas, e não só da primeira, cobre o arquivo
 * editado à mão — sem isso, uma coluna ausente na primeira linha seria descartada
 * de todas as outras.
 *
 * A consequência, que vale registrar: o default da tabela só prevalece quando a
 * coluna falta em **todas** as linhas. Se uma linha a traz, a coluna entra na
 * gravação e as demais recebem nulo explícito — o que é o comportamento correto
 * para um arquivo assim, já que uma coluna `NOT NULL` faz o banco recusar o
 * arquivo inteiro em vez de inventar valor.
 */
export function importColumns(
  tableColumns: readonly string[],
  rows: readonly BackupRow[],
): string[] {
  const present = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) present.add(key);
  }
  return tableColumns.filter((column) => present.has(column));
}

/**
 * Os valores de uma linha, um por coluna pedida.
 *
 * O nulo explícito não é zelo: o `better-sqlite3` recusa a gravação quando um
 * parâmetro nomeado não é vinculado, então uma linha mais curta que as demais
 * derrubaria a importação inteira em vez de entrar com o campo vazio.
 */
export function rowValues(
  columns: readonly string[],
  row: BackupRow,
): Record<string, string | number | null> {
  return Object.fromEntries(columns.map((column) => [column, row[column] ?? null]));
}
