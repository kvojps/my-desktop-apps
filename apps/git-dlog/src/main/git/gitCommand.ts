import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 10 * 1024 * 1024;

/**
 * Ambiente base de todo comando git disparado pelo app.
 *
 * - `GIT_TERMINAL_PROMPT=0` impede que o git trave esperando usuário/senha num
 *   terminal que não existe (o processo ficaria pendurado para sempre).
 * - `GIT_OPTIONAL_LOCKS=0` faz o `git status` não pegar o lock do index nem
 *   reescrevê-lo: a varredura é só leitura e não deve brigar com a IDE aberta.
 */
const READ_ENV = {
  ...process.env,
  GIT_TERMINAL_PROMPT: '0',
  GIT_OPTIONAL_LOCKS: '0',
};

/**
 * Ambiente para operações de rede. Além de não pedir senha no terminal, também
 * desarma os helpers gráficos de credencial e coloca o ssh em modo batch — sem
 * isso, um repositório com credencial expirada abriria um prompt invisível e o
 * fetch nunca terminaria.
 */
const NETWORK_ENV = {
  ...READ_ENV,
  GIT_ASKPASS: '',
  SSH_ASKPASS: '',
  GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND ?? 'ssh -o BatchMode=yes',
};

export interface RunGitOptions {
  /** Usa o ambiente de rede (fetch/pull) em vez do de leitura. */
  network?: boolean;
  timeoutMs?: number;
}

export async function runGit(
  cwd: string,
  args: string[],
  options: RunGitOptions = {},
): Promise<string> {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
    maxBuffer: MAX_BUFFER,
    env: options.network ? NETWORK_ENV : READ_ENV,
    timeout: options.timeoutMs,
    windowsHide: true,
  });
  return stdout.trim();
}

export function getGitErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    // execFile rejeita com um Error que carrega o stderr do processo.
    const stderr = (err as { stderr?: string }).stderr;
    if (typeof stderr === 'string' && stderr.trim()) {
      return stderr.trim().split('\n').slice(0, 3).join(' ');
    }
    if ((err as { killed?: boolean }).killed) {
      return 'O comando git excedeu o tempo limite.';
    }
  }
  return err instanceof Error && err.message ? err.message : fallback;
}
