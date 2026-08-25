import { type AppErrorCode, encodeAppError } from '@shared/errors/appError';
import { AppError } from './AppError';

/** better-sqlite3 e o Node expõem a causa em `code`: SQLITE_CANTOPEN, EACCES... */
function systemCode(err: unknown): string {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : '';
}

export function classifyError(err: unknown): AppErrorCode {
  if (err instanceof AppError) {
    if (err.statusCode === 404) return 'not-found';
    return err.statusCode >= 500 ? 'unknown' : 'invalid-input';
  }

  const code = systemCode(err);
  if (code.startsWith('SQLITE_CORRUPT') || code.startsWith('SQLITE_NOTADB')) return 'db-corrupted';
  if (code.startsWith('SQLITE_READONLY') || ['EACCES', 'EPERM', 'EROFS'].includes(code)) {
    return 'db-permission';
  }
  if (code.startsWith('SQLITE_BUSY') || code.startsWith('SQLITE_LOCKED')) return 'db-busy';
  if (code.startsWith('SQLITE_FULL') || code === 'ENOSPC') return 'disk-full';
  if (code.startsWith('SQLITE_CANTOPEN') || code.startsWith('SQLITE_IOERR') || code === 'ENOENT') {
    return 'db-unavailable';
  }

  return 'unknown';
}

/** Erro pronto para atravessar o IPC com o código preservado na mensagem. */
export function toIpcError(err: unknown): Error {
  const message = err instanceof Error ? err.message : String(err);
  return new Error(encodeAppError(classifyError(err), message));
}
