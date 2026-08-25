/**
 * O IPC do Electron só preserva a *mensagem* de um erro lançado no main.
 * Para o renderer poder explicar a falha (em vez de chutar "verifique sua
 * conexão", que não existe num app local), o main codifica um código junto da
 * mensagem técnica e o renderer decodifica.
 */
export const APP_ERROR_CODES = [
  'db-unavailable',
  'db-corrupted',
  'db-permission',
  'db-busy',
  'disk-full',
  'not-found',
  'invalid-input',
  'print-failed',
  'export-failed',
  'import-failed',
  'pdf-failed',
  'unknown',
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

/** Texto honesto de cada falha, compartilhado entre as telas e o diálogo de boot. */
export const APP_ERROR_DESCRIPTIONS: Record<AppErrorCode, string> = {
  'db-unavailable':
    'O arquivo do banco de dados não pôde ser aberto. Ele pode ter sido movido, renomeado ou excluído — ou outro programa está com ele aberto.',
  'db-corrupted':
    'O arquivo do banco de dados está corrompido e não pôde ser lido. Restaurar o backup mais recente costuma resolver.',
  'db-permission':
    'O app não tem permissão para ler ou gravar na pasta de dados. Verifique as permissões da pasta ou se o antivírus está bloqueando o arquivo.',
  'db-busy':
    'O banco de dados está ocupado por outra operação. Costuma liberar em alguns segundos.',
  'disk-full':
    'Não há espaço em disco para gravar no banco de dados. Libere espaço e tente de novo.',
  'not-found': 'O registro não existe mais. Ele pode ter sido excluído em outra tela.',
  'invalid-input': 'Os dados informados não foram aceitos.',
  'print-failed':
    'Não foi possível enviar o plano para a impressora. Verifique se há uma impressora instalada e disponível no Windows.',
  'export-failed':
    'Não foi possível salvar o arquivo. Verifique se a pasta escolhida permite gravação e se há espaço em disco.',
  'import-failed':
    'Não foi possível ler o arquivo escolhido. Verifique se ele ainda existe e se você tem permissão para abri-lo.',
  'pdf-failed':
    'Não foi possível montar o PDF do plano. Deixe a tela do plano aberta e tente de novo.',
  unknown: 'Falha ao ler os dados locais.',
};

const MARKER = 'APPERR';
const SEPARATOR = '/';

export interface DecodedAppError {
  code: AppErrorCode;
  /** Mensagem técnica original, exibida como detalhe. */
  message: string;
  /**
   * `true` quando o erro veio do main já classificado. `false` é um erro nascido
   * no próprio renderer — o código é 'unknown' por falta de informação, não por
   * diagnóstico.
   */
  encoded: boolean;
}

function isAppErrorCode(value: string): value is AppErrorCode {
  return (APP_ERROR_CODES as readonly string[]).includes(value);
}

export function encodeAppError(code: AppErrorCode, message: string): string {
  return `${MARKER}${SEPARATOR}${code}${SEPARATOR}${message}`;
}

export function decodeAppError(err: unknown, fallback = 'Ocorreu um erro'): DecodedAppError {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (!raw) return { code: 'unknown', message: fallback, encoded: false };

  const prefix = `${MARKER}${SEPARATOR}`;
  if (raw.startsWith(prefix)) {
    const rest = raw.slice(prefix.length);
    const at = rest.indexOf(SEPARATOR);
    const code = at >= 0 ? rest.slice(0, at) : '';
    if (isAppErrorCode(code)) {
      return { code, message: rest.slice(at + 1) || fallback, encoded: true };
    }
  }

  return { code: 'unknown', message: raw, encoded: false };
}

/**
 * Texto pronto para exibir ao usuário. Erros de domínio (`AppError`) já vêm com
 * uma mensagem própria, escrita para ser lida; para falhas de sistema o texto
 * técnico não ajuda ninguém e entra a descrição do código.
 */
export function describeAppError(err: unknown, fallback = 'Ocorreu um erro'): string {
  const { code, message, encoded } = decodeAppError(err, fallback);
  if (code === 'not-found' || code === 'invalid-input') return message;
  // Erro que não atravessou o IPC (bug no renderer): sem classificação, a
  // descrição de sistema afirmaria uma causa que ninguém apurou.
  if (!encoded) return fallback;
  return APP_ERROR_DESCRIPTIONS[code];
}
