#!/usr/bin/env node
// Gera o THIRD-PARTY-NOTICES.md de um app a partir da árvore de dependências de
// produção resolvida pelo npm. A MIT e a OFL exigem que o aviso de copyright
// acompanhe o binário distribuído; este arquivo é o veículo desse aviso.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const app = process.argv[2];
if (!app) {
  console.error('uso: generate-third-party-notices.mjs <workspace>');
  process.exit(1);
}

const root = new URL('..', import.meta.url).pathname;
const appDir = join(root, 'apps', app);

const LICENSE_FILE = /^(LICEN[CS]E|COPYING|NOTICE|OFL)([.-].*)?$/i;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// O `license` do npm ls só chega quando é string; normaliza os formatos legados.
function licenseOf(pkg) {
  if (typeof pkg.license === 'string') return pkg.license;
  if (pkg.license?.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses)) {
    return pkg.licenses.map((entry) => entry.type ?? entry).join(' OR ');
  }
  return 'UNKNOWN';
}

function licenseTextOf(dir) {
  let files;
  try {
    files = readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  const match = files
    .filter((entry) => entry.isFile() && LICENSE_FILE.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))[0];
  if (!match) return null;
  return readFileSync(join(dir, match.name), 'utf8').trim();
}

function authorOf(pkg) {
  const author = pkg.author;
  if (typeof author === 'string') return author;
  if (author?.name) {
    return author.email ? `${author.name} <${author.email}>` : author.name;
  }
  return null;
}

const packages = new Map();

function collect(node) {
  for (const [name, entry] of Object.entries(node.dependencies ?? {})) {
    // Workspaces locais não são terceiros: o LICENSE da raiz já os cobre.
    const local = entry.resolved?.startsWith('file:') || name === app;
    const key = `${name}@${entry.version}`;
    if (!local && entry.path && !packages.has(key)) {
      packages.set(key, { name, version: entry.version, dir: entry.path });
    }
    collect(entry);
  }
}

const tree = JSON.parse(
  execFileSync('npm', ['ls', '--omit=dev', '--all', '--long', '--json', '-w', app], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }),
);
collect(tree);

// O Electron é devDependency porque não é importado pelo bundle, mas é o binário
// que se distribui — o aviso dele precisa estar aqui.
const electronVersion = readJson(join(appDir, 'package.json')).devDependencies?.electron;
if (electronVersion) {
  const dir = join(root, 'node_modules', 'electron');
  const version = readJson(join(dir, 'package.json')).version;
  packages.set(`electron@${version}`, { name: 'electron', version, dir });
}

const entries = [...packages.values()].sort(
  (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
);

const sections = [];
const missing = [];

for (const entry of entries) {
  const pkg = readJson(join(entry.dir, 'package.json'));
  const license = licenseOf(pkg);
  const text = licenseTextOf(entry.dir);
  const author = authorOf(pkg);
  if (!text) missing.push(`${entry.name}@${entry.version} (${license})`);

  const header = [`## ${entry.name} ${entry.version}`, '', `Licença: ${license}`];
  if (author) header.push(`Autoria: ${author}`);
  if (pkg.homepage) header.push(`Origem: ${pkg.homepage}`);
  sections.push(
    [
      ...header,
      '',
      text ? '```\n' + text + '\n```' : '_Pacote sem arquivo de licença; ver o campo acima._',
    ].join('\n'),
  );
}

const product = readJson(join(appDir, 'package.json'));
const notices = `# Avisos de terceiros — ${product.productName ?? product.name} ${product.version}

Gerado por \`scripts/generate-third-party-notices.mjs\`; não editar à mão.
Reúne ${entries.length} pacotes distribuídos junto com o aplicativo. O código
próprio está sob a licença do \`LICENSE\` na raiz do repositório.

O binário do Electron embarca Chromium e Node.js, cujos avisos completos são
instalados pelo electron-builder ao lado do executável (\`LICENSES.chromium.html\`).

${sections.join('\n\n')}
`;

writeFileSync(join(appDir, 'THIRD-PARTY-NOTICES.md'), notices);
console.log(`THIRD-PARTY-NOTICES.md: ${entries.length} pacotes`);
if (missing.length) {
  console.warn(`sem texto de licença (${missing.length}): ${missing.join(', ')}`);
}
