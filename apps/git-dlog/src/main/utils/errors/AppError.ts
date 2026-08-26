import type { AppErrorCode } from '@shared/errors/appError';

export class AppError extends Error {
  statusCode: number;
  /**
   * A classificação, quando quem lança já a conhece. O `classifyError` a deduz
   * do `statusCode` e do `code` do sistema, e isso cobre o banco inteiro; o que
   * ele não tem como deduzir é a falha que não é de dado nenhum — uma recusa do
   * mundo externo não é entrada inválida nem registro ausente, e sem este campo
   * ela chegaria à tela como "falha ao ler os dados locais".
   *
   * Nasce sem call site no `git-dlog`: os `AppError` daqui são todos 4xx de
   * dado, e `APP_ERROR_CODES` ainda não tem código de recusa externa. Está aqui
   * pelo mesmo motivo do `transaction()` em `makeRepositories` — o contrato de
   * erro é o mesmo nos quatro apps, e o primeiro uso real já existe no
   * `meu-movel-planejado` (impressora que recusou o trabalho).
   */
  code?: AppErrorCode;

  constructor(statusCode: number, message: string, code?: AppErrorCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
