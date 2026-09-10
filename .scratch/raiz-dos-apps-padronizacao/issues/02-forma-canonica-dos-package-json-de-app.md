# 02: Forma canônica dos `package.json` de app

**What to build:** Os quatro `apps/*/package.json` passam a ter a mesma forma —
mesma ordem de chaves, mesmo conjunto de scripts, mesma ordem de chaves no bloco
`build` — de modo que comparar dois apps lado a lado revele só as diferenças que
são decisão de produto. As divergências acidentais somem: todo app declara
`license`, o `appId` do `git-dlog` entra no padrão dos outros, e o script que
ninguém usa sai. Não toca ainda em ícone nem em aviso de terceiros (ticket 03).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Nos quatro `apps/*/package.json`, a ordem de chaves de topo é a mesma:
  `name`, `version`, `private`, `description`, `author`, `homepage`, `main`,
  `license`, `scripts`, `build`, `dependencies`, `devDependencies`.
- [ ] `"license": "MIT"` presente nos quatro (hoje só no `git-dlog`).
- [ ] `appId` do `git-dlog` passa de `com.gitdlog.desktop` para `com.gitdlog.app`.
- [ ] `version` do `meu-movel-planejado` continua `1.0.0`; `productName` continua
  `"Meu Movel Planejado"` sem acento — inalterados de propósito.
- [ ] O script `dev:renderer` é removido dos quatro; `preview` é mantido. Ordem
  do bloco `scripts`: `dev`, `preview`, `build`, `typecheck`, `dist:win`,
  `dist:linux` (o `notices` entra no ticket 03).
- [ ] O bloco `build` tem a mesma ordem de chaves nos quatro (`appId`,
  `productName`, `directories`, `files`, `asarUnpack`, `extraResources`, `win`,
  `linux`, `nsis`), com `win: { icon, target }` e
  `linux: { icon, target, category, maintainer }`. `linux.category` do `git-dlog`
  continua `"Development"`; dos outros, `"Office"`.
- [ ] `npm run typecheck`, `npm run lint` e `npm run format:check` limpos.
- [ ] `npm run dev:dinheiro` (e ao menos mais um app) sobe normalmente.
- [ ] Nenhum arquivo em `src/` é tocado.
