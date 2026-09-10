# 02: Forma canônica dos `package.json` de app

**What to build:** Os quatro `apps/*/package.json` passam a ter a mesma forma —
mesma ordem de chaves, mesmo conjunto de scripts, mesma ordem de chaves no bloco
`build` — de modo que comparar dois apps lado a lado revele só as diferenças que
são decisão de produto. As divergências acidentais somem: todo app declara
`license`, o `appId` do `git-dlog` entra no padrão dos outros, e o script que
ninguém usa sai. Não toca ainda em ícone nem em aviso de terceiros (ticket 03).

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Nos quatro `apps/*/package.json`, a ordem de chaves de topo é a mesma:
  `name`, `version`, `private`, `description`, `author`, `homepage`, `main`,
  `license`, `scripts`, `build`, `dependencies`, `devDependencies`.
- [x] `"license": "MIT"` presente nos quatro (hoje só no `git-dlog`).
- [x] `appId` do `git-dlog` passa de `com.gitdlog.desktop` para `com.gitdlog.app`.
- [x] `version` do `meu-movel-planejado` continua `1.0.0`; `productName` continua
  `"Meu Movel Planejado"` sem acento — inalterados de propósito.
- [x] O script `dev:renderer` é removido dos quatro; `preview` é mantido. Ordem
  do bloco `scripts`: `dev`, `preview`, `build`, `typecheck`, `dist:win`,
  `dist:linux` (o `notices` entra no ticket 03).
- [x] O bloco `build` tem a mesma ordem de chaves nos quatro (`appId`,
  `productName`, `directories`, `files`, `asarUnpack`, `extraResources`, `win`,
  `linux`, `nsis`), com `win: { icon, target }` e
  `linux: { icon, target, category, maintainer }`. `linux.category` do `git-dlog`
  continua `"Development"`; dos outros, `"Office"`.
- [x] `npm run typecheck`, `npm run lint` e `npm run format:check` limpos.
- [x] `npm run dev:dinheiro` (e ao menos mais um app) sobe normalmente.
- [x] Nenhum arquivo em `src/` é tocado.

## Answer

Feito nos quatro `apps/*/package.json`. Ordem de chaves de topo, bloco `scripts`
(`dev`, `preview`, `build`, `typecheck`, `dist:win`, `dist:linux`) e bloco
`build` (`appId` … `nsis`, com `win: { icon, target }` e
`linux: { icon, target, category, maintainer }`) agora idênticos entre os apps a
menos de decisão de produto. `dev:renderer` removido dos quatro; `license: "MIT"`
nos quatro; `appId` do `git-dlog` agora `com.gitdlog.app`; `linux.category`
`"Development"` no `git-dlog` e `"Office"` nos outros. `version` e `productName`
do `meu-movel-planejado` intocados.

Não tocado, fica para o ticket 03: `linux.icon` (ainda `build/icon.png`),
`extraResources` (ainda divergente entre os apps) e a posição do script
`notices` — o `git-dlog` mantém seu `notices` no fim do bloco `scripts` e os
`npm run notices &&` nos `dist:*`; o ticket 03 adiciona `notices` aos outros três
e posiciona os quatro de forma uniforme.

`npm run typecheck` limpo; `npm run lint` 0 erros (2 warnings
`react-hooks/exhaustive-deps` pré-existentes em `meu-negocio-app/src/`, sem
relação); `prettier --check apps/*/package.json` limpo (o `format:check`
repo-wide ainda acusa os `.md` desta effort em `.scratch/`, pré-existente e fora
do escopo). `npm run dev:dinheiro` e `npm run dev:dlog` sobem normalmente.
Suíte completa: 190 testes verdes.
