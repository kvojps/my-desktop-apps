# 03: Empacotamento uniforme — ícone e aviso de terceiros em todos os apps

**What to build:** O empacotamento fica idêntico nos quatro apps. Cada ícone
existe uma vez só por app (o PNG duplicado em `build/` some, e o instalador Linux
passa a usar o mesmo `resources/icon.png` que o runtime já usa). Todo app — não
só o `git-dlog` — gera seu `THIRD-PARTY-NOTICES.md` e o empacota junto do
executável com o `LICENSE`, cumprindo a obrigação das licenças MIT e da fonte
Inter (OFL 1.1) que os quatro distribuem. `npm run notices` na raiz regenera
todos de uma vez.

**Blocked by:** 02 (edita os mesmos `apps/*/package.json`)

**Status:** ready-for-agent

- [ ] `apps/*/build/icon.png` é removido nos quatro apps (é cópia byte-a-byte de
  `apps/*/resources/icon.png`).
- [ ] Nos quatro `apps/*/package.json`, `linux.icon` aponta para
  `resources/icon.png`; `win.icon` continua `build/icon.ico`.
- [ ] Cada `apps/*/package.json` ganha o script
  `"notices": "node ../../scripts/generate-third-party-notices.mjs <nome-do-app>"`,
  posicionado antes de `dist:win` no bloco `scripts`.
- [ ] `dist:win` e `dist:linux` dos três apps que ainda não fazem isso passam a
  começar com `npm run notices &&`; depois disso os quatro `dist:win` são
  idênticos entre si e os quatro `dist:linux` também.
- [ ] `extraResources` dos quatro `apps/*/package.json` inclui, na mesma ordem:
  `resources` → `resources`,
  `THIRD-PARTY-NOTICES.md` → `THIRD-PARTY-NOTICES.md`,
  `../../LICENSE` → `LICENSE`.
- [ ] Os `THIRD-PARTY-NOTICES.md` de `meu-dinheiro-app`, `meu-negocio-app` e
  `meu-movel-planejado` são gerados pelo script e entram versionados no git
  (como o do `git-dlog` já é).
- [ ] `package.json` raiz: o bloco `dist:linux:*` é reordenado para
  `dinheiro`, `negocio`, `dlog`, `movel` (casando com o bloco `dist:*`), e ganha
  o script `"notices": "npm run notices --workspaces --if-present"`.
- [ ] `npm run notices` na raiz regenera os quatro `THIRD-PARTY-NOTICES.md`; o
  `git status` depois mostra apenas os três arquivos novos e nenhuma mudança
  relevante no do `git-dlog`.
- [ ] `npm run dist:linux:negocio` numa máquina Linux produz um `.deb` que, ao
  ser inspecionado (`dpkg -c` ou `ar x` + `tar`), contém
  `resources/THIRD-PARTY-NOTICES.md` e `resources/LICENSE`, e cujo ícone do app
  renderiza. `npm run dist:linux:dlog` continua funcionando (não-regressão).
- [ ] `npm run lint` e `npm run format:check` limpos.
