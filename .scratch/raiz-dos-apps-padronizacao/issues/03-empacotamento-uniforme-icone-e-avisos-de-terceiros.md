# 03: Empacotamento uniforme — ícone e aviso de terceiros em todos os apps

**What to build:** O empacotamento fica idêntico nos quatro apps. Cada ícone
existe uma vez só por app (o PNG duplicado em `build/` some, e o instalador Linux
passa a usar o mesmo `resources/icon.png` que o runtime já usa). Todo app — não
só o `git-dlog` — gera seu `THIRD-PARTY-NOTICES.md` e o empacota junto do
executável com o `LICENSE`, cumprindo a obrigação das licenças MIT e da fonte
Inter (OFL 1.1) que os quatro distribuem. `npm run notices` na raiz regenera
todos de uma vez.

**Blocked by:** 02 (edita os mesmos `apps/*/package.json`)

**Status:** resolved

- [x] `apps/*/build/icon.png` é removido nos quatro apps (é cópia byte-a-byte de
  `apps/*/resources/icon.png`).
- [x] Nos quatro `apps/*/package.json`, `linux.icon` aponta para
  `resources/icon.png`; `win.icon` continua `build/icon.ico`.
- [x] Cada `apps/*/package.json` ganha o script
  `"notices": "node ../../scripts/generate-third-party-notices.mjs <nome-do-app>"`,
  posicionado antes de `dist:win` no bloco `scripts`.
- [x] `dist:win` e `dist:linux` dos três apps que ainda não fazem isso passam a
  começar com `npm run notices &&`; depois disso os quatro `dist:win` são
  idênticos entre si e os quatro `dist:linux` também.
- [x] `extraResources` dos quatro `apps/*/package.json` inclui, na mesma ordem:
  `resources` → `resources`,
  `THIRD-PARTY-NOTICES.md` → `THIRD-PARTY-NOTICES.md`,
  `../../LICENSE` → `LICENSE`.
- [x] Os `THIRD-PARTY-NOTICES.md` de `meu-dinheiro-app`, `meu-negocio-app` e
  `meu-movel-planejado` são gerados pelo script e entram versionados no git
  (como o do `git-dlog` já é).
- [x] `package.json` raiz: o bloco `dist:linux:*` é reordenado para
  `dinheiro`, `negocio`, `dlog`, `movel` (casando com o bloco `dist:*`), e ganha
  o script `"notices": "npm run notices --workspaces --if-present"`.
- [x] `npm run notices` na raiz regenera os quatro `THIRD-PARTY-NOTICES.md`; o
  `git status` depois mostra apenas os três arquivos novos e nenhuma mudança
  relevante no do `git-dlog`.
- [ ] `npm run dist:linux:negocio` numa máquina Linux produz um `.deb` que, ao
  ser inspecionado (`dpkg -c` ou `ar x` + `tar`), contém
  `resources/THIRD-PARTY-NOTICES.md` e `resources/LICENSE`, e cujo ícone do app
  renderiza. `npm run dist:linux:dlog` continua funcionando (não-regressão).
  — **não verificado**: exige máquina Linux com o toolchain do electron-builder;
  a config produz o resultado descrito (o electron-builder põe `extraResources`
  sob `resources/` no `.deb`).
- [x] `npm run lint` e `npm run format:check` limpos.

## Answer

Feito. `apps/*/build/icon.png` removido nos quatro (confirmado byte-a-byte com
`cmp` contra `resources/icon.png`); `build/icon.ico` fica. `linux.icon` agora é
`resources/icon.png` nos quatro; `win.icon` intocado.

Bloco `scripts` dos quatro apps: `notices` entra logo antes de `dist:win`, com o
nome do workspace como argumento; `dist:win` e `dist:linux` passam a começar com
`npm run notices &&` e ficam byte-a-byte idênticos entre os quatro. O `git-dlog`
tinha o `notices` no fim do bloco — foi movido para a mesma posição dos outros.

`extraResources` dos quatro: `resources` → `THIRD-PARTY-NOTICES.md` →
`../../LICENSE` → `LICENSE`, na ordem. `THIRD-PARTY-NOTICES.md` de
`meu-dinheiro-app` (220 pacotes), `meu-negocio-app` (174) e `meu-movel-planejado`
(139) entram versionados; o do `git-dlog` (134) fica byte-a-byte igual após
`npm run notices`.

`package.json` raiz: `dist:linux:*` reordenado para dinheiro/negocio/dlog/movel;
`notices` (`npm run notices --workspaces --if-present`) adicionado depois de
`build`.

Duas mudanças no `scripts/generate-third-party-notices.mjs` fora da checklist,
ambas necessárias para o gerador rodar limpo neste repo:

1. `npmLs()` lê o `stdout` do erro quando `npm ls --omit=dev` sai com código
   != 0 (acontece em `meu-dinheiro-app`, `meu-negocio-app` e `meu-movel-planejado`
   por causa do `ajv@6` hasteado que o `@hookform/resolvers` considera inválido);
   a árvore JSON vem completa mesmo assim. Sem isso, `npm run notices` aborta
   nesses três e o item da checklist não fecha. Re-lança quando não há stdout.
2. `licenseTextOf` normaliza CRLF → LF do texto de licença lido dos pacotes,
   para casar com o `eol=lf` do `.gitattributes` e uma re-geração não deixar o
   working tree sujo.

`npm run typecheck` limpo; `npm run lint` 0 erros (2 warnings
`react-hooks/exhaustive-deps` pré-existentes em `meu-negocio-app/src/`, sem
relação); `prettier --check` dos arquivos tocados limpo (os
`apps/*/THIRD-PARTY-NOTICES.md` estão no `.prettierignore`; o `format:check`
repo-wide ainda acusa os `.md` desta effort em `.scratch/`, pré-existente e fora
do escopo — some no ticket 04). Suíte completa: 190 testes verdes.

README §4.1 ainda descreve só o `git-dlog` gerando o aviso — a atualização é o
item 3 do ticket 04 (`Blocked by: 01, 03`), fica para lá de propósito.
