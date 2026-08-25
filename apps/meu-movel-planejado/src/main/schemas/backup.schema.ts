import { z } from 'zod';

/**
 * O portão de entrada da importação. O que passa por aqui é gravado por cima de
 * tudo que o usuário tem, então o que ele precisa recusar não é o arquivo
 * aleatório — é o arquivo **parecido**.
 *
 * Os apps do monorepo exportam JSONs de família: o do Meu Dinheiro também tem
 * `version: 1` e `exported_at`. Sem o campo `app`, ele passaria pela conferência
 * de forma, o banco seria esvaziado e só então se descobriria que não havia
 * projeto nenhum para pôr no lugar. O campo é a identidade do arquivo, e é ela
 * que a recusa por formato desconhecido consulta primeiro.
 */

export const BACKUP_APP = 'meu-movel-planejado';

/**
 * A versão do **formato**, não a do app. Sobe quando o arquivo deixa de ser
 * legível como está; enquanto o formato só ganha coluna nova, ela fica parada —
 * coluna a mais ou a menos já é absorvida na gravação, tabela por tabela
 * (`../backup/backupRows`).
 *
 * Versões antigas continuam aceitas por acréscimo a esta união, nunca por
 * substituição: um backup que já saiu para o pen drive do usuário não pode
 * deixar de ser importável.
 */
export const BACKUP_VERSION = 1;
const backupVersionSchema = z.literal(BACKUP_VERSION);

/**
 * Uma célula é o que o SQLite guarda numa coluna deste app: texto, número ou
 * nulo. Objeto ou lista aninhada não é linha de tabela — é outro formato se
 * passando por este.
 */
const cellSchema = z.union([z.string(), z.number(), z.null()]);

/**
 * Uma linha crua, com as chaves em `snake_case` da tabela. As chaves não são
 * enumeradas de propósito: é o que deixa entrar o backup de uma versão mais
 * nova, cuja coluna a mais será descartada na gravação em vez de invalidar o
 * arquivo inteiro.
 */
const rowSchema = z.record(z.string(), cellSchema);
const tableSchema = z.array(rowSchema);

/**
 * Toda tabela é obrigatória, mesmo vazia. Tabela **ausente** não é tabela vazia:
 * a importação apaga tudo antes de gravar, e aceitar a ausência como "nada a
 * restaurar" apagaria o que existia sem nunca ter tido o que pôr no lugar.
 *
 * A lista precisa cobrir exatamente as tabelas que a exportação grava, e as duas
 * se separando em silêncio é a falha que não avisa. Duas travas seguram isso: o
 * `tsc`, porque o resultado deste schema é o `BackupFile` que a gravação
 * consome, e um teste que compara esta lista com a de lá.
 */
export const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  version: backupVersionSchema,
  exported_at: z.string(),
  projects: tableSchema,
  pieces: tableSchema,
  sheets: tableSchema,
  plans: tableSchema,
  planned_sheets: tableSchema,
  placements: tableSchema,
  unallocated_pieces: tableSchema,
  rejected_pieces: tableSchema,
});

/**
 * O arquivo já conferido. Sai daqui, e não de uma interface escrita à mão, para
 * que declarar a tabela no schema e esquecê-la na exportação não compile.
 */
export type BackupFile = z.infer<typeof backupSchema>;
