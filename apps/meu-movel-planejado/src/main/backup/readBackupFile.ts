import {
  BACKUP_APP,
  BACKUP_VERSION,
  type BackupFile,
  backupSchema,
} from '../schemas/backup.schema';

/**
 * A conferência do arquivo escolhido para importar: o texto do disco entra, e
 * sai o arquivo conferido ou o motivo da recusa.
 *
 * A distinção que interessa ao usuário não é "válido ou inválido" — é **o que
 * fazer agora**, e cada motivo o manda a um lugar diferente. Uma recusa
 * genérica o faria adivinhar qual é o caso dele, e é isso que os motivos
 * separados existem para evitar.
 *
 * Módulo puro, sem import de runtime: a decisão é o que o ticket cobra, e ela
 * fica ao alcance da suíte. Quem transforma o motivo em exceção classificada é
 * `backupFile.ts`, que é a fronteira com o sistema.
 */

export type BackupRefusal = 'not-json' | 'foreign-app' | 'unknown-version' | 'damaged';

/**
 * Uma mensagem por motivo, e todas diferentes entre si — é o que o ticket pede
 * ao separar a recusa por formato da falha de leitura. Cada uma nomeia a saída:
 * outro arquivo, outra versão do app, outra cópia do mesmo arquivo.
 */
export const BACKUP_REFUSAL_MESSAGES: Record<BackupRefusal, string> = {
  'not-json': 'Este arquivo não é um JSON válido. Ele pode estar corrompido.',
  'foreign-app': 'Este arquivo não é um backup do Meu Móvel Planejado.',
  'unknown-version':
    'Este backup foi gerado por uma versão mais nova do app. Atualize o app e tente de novo.',
  damaged:
    'Este backup está incompleto ou danificado, e não pôde ser lido. Tente outra cópia do arquivo.',
};

export type ReadBackupResult =
  { ok: true; file: BackupFile } | { ok: false; refusal: BackupRefusal };

/**
 * As perguntas na ordem em que fazem sentido: é JSON, é deste app, é de uma
 * versão que este app lê, e só então confere de forma.
 *
 * A identidade vem antes da versão de propósito. Num arquivo de outro app, a
 * versão não diz nada sobre este — e "atualize o app" seria conselho falso. A
 * versão vem antes da forma pela mesma razão: enquanto ela não bate, a forma
 * esperada é outra, e apontar a tabela que falta descreveria o formato errado.
 *
 * A última recusa é a que o ticket faria um app desatento errar. Identidade e
 * versão certas e ainda assim não confere significa **dano** — truncado no meio
 * da gravação, copiado pela metade —, e não formato desconhecido.
 */
export function readBackupFile(raw: string): ReadBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, refusal: 'not-json' };
  }

  const validated = backupSchema.safeParse(parsed);
  if (validated.success) return { ok: true, file: validated.data };

  const header = parsed as { app?: unknown; version?: unknown } | null;

  if (header?.app !== BACKUP_APP) return { ok: false, refusal: 'foreign-app' };
  if (header.version !== BACKUP_VERSION) return { ok: false, refusal: 'unknown-version' };

  return { ok: false, refusal: 'damaged' };
}
