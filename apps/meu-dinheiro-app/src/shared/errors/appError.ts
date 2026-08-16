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
  unknown: 'Falha ao ler os dados locais.',
};

const MARKER = 'MDAPP';
const SEPARATOR = '/';

export interface DecodedAppError {
  code: AppErrorCode;
  /** Mensagem técnica original, exibida como detalhe. */
  message: string;
}

function isAppErrorCode(value: string): value is AppErrorCode {
  return (APP_ERROR_CODES as readonly string[]).includes(value);
}

export function encodeAppError(code: AppErrorCode, message: string): string {
  return `${MARKER}${SEPARATOR}${code}${SEPARATOR}${message}`;
}

export function decodeAppError(err: unknown, fallback = 'Ocorreu um erro'): DecodedAppError {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (!raw) return { code: 'unknown', message: fallback };

  const prefix = `${MARKER}${SEPARATOR}`;
  if (raw.startsWith(prefix)) {
    const rest = raw.slice(prefix.length);
    const at = rest.indexOf(SEPARATOR);
    const code = at >= 0 ? rest.slice(0, at) : '';
    if (isAppErrorCode(code)) {
      return { code, message: rest.slice(at + 1) || fallback };
    }
  }

  return { code: 'unknown', message: raw };
}
