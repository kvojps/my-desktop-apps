import type { AppErrorCode } from '@shared/errors/appError';

export class AppError extends Error {
  statusCode: number;
  /**
   * A classificação, quando quem lança já a conhece. O `classifyError` a deduz
   * do `statusCode` e do `code` do sistema, e isso cobre o banco inteiro; o que
   * ele não tem como deduzir é a falha que não é de dado nenhum — a impressora
   * que recusou o trabalho não é entrada inválida nem registro ausente, e sem
   * este campo ela chegaria à tela como "falha ao ler os dados locais".
   */
  code?: AppErrorCode;

  constructor(statusCode: number, message: string, code?: AppErrorCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
