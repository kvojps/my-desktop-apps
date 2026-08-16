import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const MAX_BUFFER = 20 * 1024 * 1024;

/**
 * Ambiente das CLIs externas (`gh`, `glab`). Herda o ambiente do usuário —
 * é lá que moram a config e o login dessas ferramentas — mas desliga prompts,
 * cores ANSI e avisos de atualização, que só sujariam a saída JSON.
 */
const CLI_ENV = {
  ...process.env,
  GIT_TERMINAL_PROMPT: '0',
  GH_NO_UPDATE_NOTIFIER: '1',
  NO_COLOR: '1',
  CLICOLOR: '0',
};

export interface RunCommandOptions {
  cwd?: string;
  timeoutMs?: number;
}

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    cwd: options.cwd,
    maxBuffer: MAX_BUFFER,
    env: CLI_ENV,
    timeout: options.timeoutMs,
    windowsHide: true,
  });
  return stdout.trim();
}

/** `true` se o binário existe no PATH e responde. */
export async function commandExists(command: string, versionArg = '--version'): Promise<boolean> {
  try {
    await runCommand(command, [versionArg], { timeoutMs: 10_000 });
    return true;
  } catch {
    return false;
  }
}

export function getCommandErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const stderr = (err as { stderr?: string }).stderr;
    if (typeof stderr === 'string' && stderr.trim()) {
      return stderr.trim().split('\n').slice(0, 2).join(' ');
    }
    if ((err as { code?: string }).code === 'ENOENT') {
      return 'Comando não encontrado no PATH.';
    }
  }
  return err instanceof Error && err.message ? err.message : fallback;
}
