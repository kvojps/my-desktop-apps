import fs from 'node:fs/promises';
import path from 'node:path';
import type { RemoteKindEntity, RepoRemoteEntity } from '../../../domain/pullRequest';

/**
 * Lê o `.git/config` em vez de chamar `git config`/`git remote -v`.
 *
 * O arquivo já está no disco e a varredura tem orçamento de três processos por
 * repositório — gastar um quarto só para descobrir a URL do origin sairia caro
 * multiplicado por dezenas de repositórios.
 */
async function readConfigFile(gitDir: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(gitDir, 'config'), 'utf8');
  } catch {
    return null;
  }
}

function parseRemotes(content: string): Map<string, string> {
  const remotes = new Map<string, string>();
  let currentRemote: string | null = null;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    const section = line.match(/^\[remote\s+"([^"]+)"\]$/);
    if (section) {
      currentRemote = section[1];
      continue;
    }
    // Qualquer outra seção encerra a seção de remote corrente.
    if (line.startsWith('[')) {
      currentRemote = null;
      continue;
    }

    if (!currentRemote) continue;

    const url = line.match(/^url\s*=\s*(.+)$/);
    if (url) {
      remotes.set(currentRemote, url[1].trim());
    }
  }

  return remotes;
}

/**
 * URL do site publicado, anotada pela pessoa com
 * `git config dlog.url https://meusite.com`:
 *
 *   [dlog]
 *       url = https://meusite.com
 *
 * Mora no `.git/config` — e não numa tabela indexada pelo caminho — para
 * sobreviver a mover ou renomear a pasta, e por não ser versionada: é uma
 * anotação pessoal, não do projeto.
 */
function parseAppUrl(content: string): string | null {
  let inDlogSection = false;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    if (/^\[dlog\]$/i.test(line)) {
      inDlogSection = true;
      continue;
    }
    if (line.startsWith('[')) {
      inDlogSection = false;
      continue;
    }

    if (!inDlogSection) continue;

    const url = line.match(/^url\s*=\s*(.+)$/i);
    if (url) return normalizeAppUrl(url[1]);
  }

  return null;
}

/**
 * Só http/https vira link. O `shell.openExternal` do main já recusa o resto,
 * mas descartar aqui evita exibir um botão que falharia em silêncio.
 */
function normalizeAppUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
}

export async function readRemotes(gitDir: string): Promise<Map<string, string>> {
  const content = await readConfigFile(gitDir);
  return content ? parseRemotes(content) : new Map();
}

/** `origin` tem precedência; senão, o primeiro remote declarado. */
export function pickPrimaryRemote(
  remotes: Map<string, string>,
): { name: string; url: string } | null {
  const origin = remotes.get('origin');
  if (origin) return { name: 'origin', url: origin };

  const first = remotes.entries().next();
  return first.done ? null : { name: first.value[0], url: first.value[1] };
}

function classifyHost(host: string): RemoteKindEntity {
  const normalized = host.toLowerCase();
  if (normalized === 'github.com' || normalized.endsWith('.github.com')) return 'github';
  if (normalized === 'gitlab.com' || normalized.startsWith('gitlab.')) return 'gitlab';
  return 'other';
}

/**
 * Aceita os formatos que o git usa na prática:
 *   https://host/owner/repo.git
 *   ssh://git@host:22/owner/repo.git
 *   git@host:owner/repo.git        (scp-like, sem esquema)
 *
 * `owner` preserva subgrupos do GitLab (`grupo/subgrupo/projeto`).
 */
/**
 * Um remote também pode apontar para o disco (espelho local, pasta de rede).
 * Isso precisa ser descartado antes da regra scp-like, senão `C:/repos/x.git`
 * casaria com ela e a letra do drive viraria "host".
 */
function isLocalPath(url: string): boolean {
  return (
    /^[a-zA-Z]:[\\/]/.test(url) || // C:\repos ou C:/repos
    url.startsWith('\\\\') || // UNC \\servidor\share
    url.startsWith('/') ||
    url.startsWith('./') ||
    url.startsWith('../') ||
    url.toLowerCase().startsWith('file://')
  );
}

export function parseRemoteUrl(name: string, url: string): RepoRemoteEntity | null {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed || isLocalPath(trimmed)) return null;

  let host: string;
  let fullPath: string;

  const scpLike = trimmed.match(/^(?:([^@/]+)@)?([^:/]+):(.+)$/);
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);

  if (hasScheme) {
    try {
      const parsed = new URL(trimmed);
      host = parsed.hostname;
      fullPath = parsed.pathname;
    } catch {
      return null;
    }
  } else if (scpLike) {
    host = scpLike[2];
    fullPath = scpLike[3];
  } else {
    return null;
  }

  const segments = fullPath
    .replace(/\.git$/, '')
    .split('/')
    .filter(Boolean);

  if (segments.length < 2) return null;

  const repo = segments[segments.length - 1];
  const owner = segments.slice(0, -1).join('/');

  return {
    name,
    url: trimmed,
    host,
    owner,
    repo,
    webUrl: `https://${host}/${owner}/${repo}`,
    kind: classifyHost(host),
  };
}

export interface RepoConfig {
  remote: RepoRemoteEntity | null;
  /** URL do site publicado (`dlog.url`), já validada como http/https. */
  appUrl: string | null;
}

/** Remote principal e URL do site publicado, numa única leitura do arquivo. */
export async function readRepoConfig(gitDir: string): Promise<RepoConfig> {
  const content = await readConfigFile(gitDir);
  if (!content) return { remote: null, appUrl: null };

  const primary = pickPrimaryRemote(parseRemotes(content));

  return {
    remote: primary ? parseRemoteUrl(primary.name, primary.url) : null,
    appUrl: parseAppUrl(content),
  };
}
