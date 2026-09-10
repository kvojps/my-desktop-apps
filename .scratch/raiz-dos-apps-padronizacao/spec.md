Status: ready-for-agent

# Limpeza e padronização da raiz dos apps

## Problem Statement

O monorepo tem quatro apps Electron (`git-dlog`, `meu-dinheiro-app`,
`meu-negocio-app`, `meu-movel-planejado`). As camadas internas de cada um
(`src/main`, `src/renderer`, a fronteira de IPC) já foram refatoradas, mas a
**raiz de cada app** acumulou ruído que atrapalha a legibilidade e faz o
mantenedor hesitar sobre o que é intencional e o que é resíduo:

- `apps/*/tsconfig.json` é **byte-idêntico nos quatro** (só `extends`, `paths`,
  `include`) — quatro cópias de um mesmo arquivo.
- `apps/*/package.json` diverge de formas que parecem acidentais: só o `git-dlog`
  declara `license`; só ele tem `appId` no formato `com.gitdlog.desktop` (os
  outros usam `com.<nome>.app`); a ordem de chaves do bloco `build` varia entre
  apps; há scripts (`dev:renderer`) que não são usados em lugar nenhum.
- O aviso de licença de terceiros (`THIRD-PARTY-NOTICES.md`) é gerado e
  empacotado só para o `git-dlog`, embora os outros três também distribuam
  binários com dependências MIT e a fonte Inter sob SIL OFL 1.1 — a mesma
  obrigação de licença se aplica a eles.
- `apps/*/build/icon.png` é uma cópia byte-a-byte de `apps/*/resources/icon.png`
  em todos os apps — o mesmo PNG versionado duas vezes por app.
- O README raiz e `docs/agents/domain.md` afirmam coisas que já não são
  verdadeiras (quais apps têm `CONTEXT.md`, como o `tsconfig` de app é montado,
  qual app gera o aviso de terceiros).

## Solution

Reduzir a redundância e padronizar apenas a **divergência acidental**, sem
apagar a divergência que é decisão de produto, e mantendo a filosofia do repo:
apps não compartilham *código de domínio*, mas a raiz do monorepo carrega
toolchain e config (README §2).

Do ponto de vista do mantenedor, depois desta mudança:

- Abrir o `tsconfig.json` de qualquer app mostra uma linha só; a configuração de
  compilação mora inteira em `tsconfig.base.json`.
- Os quatro `package.json` de app têm a mesma forma — mesmas chaves, mesma ordem,
  mesmos scripts — e as três diferenças que sobram (`version` do movel,
  `productName` sem acento do movel, `category` do `git-dlog`) são propositais e
  explicáveis.
- Todo app gera e empacota seu `THIRD-PARTY-NOTICES.md` da mesma maneira, e
  `npm run notices` na raiz regenera todos de uma vez.
- Cada ícone existe uma vez só por app.
- README raiz e `docs/agents/domain.md` descrevem o repo como ele é.

Nada em `src/` é tocado. A prosa de produto (`README.md` e `CONTEXT.md` de cada
app) fica fora; só o README **raiz** recebe correções factuais pontuais.

## User Stories

1. Como mantenedor do monorepo, quero que o `tsconfig` de cada app seja um
   `extends` de uma linha, para que exista um único lugar onde a configuração de
   compilação (target, libs, `paths`, `include`) é definida e revisada.
2. Como mantenedor, quero que `tsc --noEmit` continue rodando por workspace via
   `npm run typecheck`, para que a checagem de tipos por app não dependa de eu
   passar flags manualmente.
3. Como mantenedor, quero que os aliases `@/` e `@shared/` continuem resolvendo
   para dentro do diretório de cada app depois de subir os `paths` para a base,
   para que os imports existentes não quebrem.
4. Como mantenedor, quero que os quatro `package.json` de app tenham a mesma
   ordem de chaves e o mesmo conjunto de scripts, para que comparar dois apps
   lado a lado revele só as diferenças que importam.
5. Como mantenedor, quero que todo app declare `"license": "MIT"` no seu
   `package.json`, para que o binário empacotado carregue a licença explícita e o
   `electron-builder` a leia sem cair em `UNKNOWN`.
6. Como mantenedor, quero que o `appId` do `git-dlog` siga o mesmo padrão
   `com.<nome>.app` dos outros três, para que a identidade dos apps seja
   previsível.
7. Como mantenedor, quero remover o script `dev:renderer` dos quatro apps, porque
   ele não é referenciado em nenhum doc, script ou fluxo e só polui a lista.
8. Como mantenedor, quero manter o script `preview` nos quatro apps, porque é o
   comando padrão do `electron-vite` para smoke-test manual de um build de
   produção.
9. Como mantenedor, quero que o bloco `build` (config inline do `electron-builder`)
   seja idêntico nos quatro apps a menos das diferenças propositais
   (`productName`, `appId`, `linux.category`), para que o empacotamento seja um
   detalhe que eu leio uma vez.
10. Como mantenedor, quero que cada `apps/*/build/` guarde só o `icon.ico`
    (Windows) e que o ícone Linux e o ícone de runtime venham ambos de
    `apps/*/resources/icon.png`, para que o mesmo PNG não seja versionado duas
    vezes por app.
11. Como usuário que distribui os apps, quero que o `git-dlog` continue
    empacotando `THIRD-PARTY-NOTICES.md` e `LICENSE` junto do executável, para
    não regredir a conformidade de licença que já existe.
12. Como usuário que distribui os apps, quero que `meu-dinheiro-app`,
    `meu-negocio-app` e `meu-movel-planejado` também gerem e empacotem seu
    `THIRD-PARTY-NOTICES.md`, porque eles distribuem dependências MIT e a fonte
    Inter sob OFL 1.1 e têm a mesma obrigação.
13. Como mantenedor, quero um script `notices` em cada `package.json` de app que
    chame o gerador com o nome do workspace, para que regenerar o aviso de um app
    seja um comando curto.
14. Como mantenedor, quero que `dist:win` e `dist:linux` de todo app regenerem o
    aviso de terceiros antes de empacotar, para que o arquivo empacotado nunca
    saia de sincronia com o `package-lock.json`.
15. Como mantenedor, quero um script `notices` agregador no `package.json` raiz
    que regenere o aviso de todos os apps de uma vez, para conferir a
    reprodutibilidade num comando só.
16. Como mantenedor, quero que os `THIRD-PARTY-NOTICES.md` dos três apps novos
    entrem versionados no git, como o do `git-dlog` já é, para que a conformidade
    fique visível sem precisar rodar o gerador.
17. Como mantenedor, quero que o bloco de scripts `dist:linux:*` do
    `package.json` raiz esteja na mesma ordem de apps que o bloco `dist:*`
    (`dinheiro`, `negocio`, `dlog`, `movel`), para que ler os dois blocos não
    exija reconciliar ordens diferentes.
18. Como pessoa lendo o README raiz §3.2, quero ver que existe um alvo de build
    Linux (`npm run dist:linux:<app>` gera `.deb`), para não achar que só há
    instalador Windows.
19. Como pessoa lendo o README raiz §3.3, quero que o bullet do
    `tsconfig.base.json` diga que cada `apps/*/tsconfig.json` só faz `extends` —
    `paths` e `include` moram na base —, para que o texto bata com o arquivo.
20. Como pessoa lendo o README raiz §4.1, quero que ele diga que todos os apps
    geram o aviso de terceiros (não só o `git-dlog`), para que a seção reflita o
    estado do repo.
21. Como agente seguindo `docs/agents/domain.md`, quero que a frase sobre quais
    apps têm `CONTEXT.md` liste os quatro, porque `meu-dinheiro-app` tem um
    `CONTEXT.md` e o `CONTEXT-MAP.md` já o lista.
22. Como mantenedor, quero que `version` do `meu-movel-planejado` continue em
    `1.0.0` e `productName` continue `"Meu Movel Planejado"` sem acento, porque
    são decisões deliberadas e não resíduo.
23. Como mantenedor, quero que `apps/git-dlog/gitdlog.sh` fique onde está, porque
    o README do `git-dlog` §2 o documenta e o referencia por caminho.
24. Como mantenedor, quero rodar `npm run typecheck`, `npm run lint` e
    `npm run format:check` depois da mudança e ver tudo verde, porque é a
    checagem obrigatória de fim de alteração (CLAUDE.md).
25. Como mantenedor, quero empacotar pelo menos um app não-`git-dlog` para Linux
    e inspecionar o `.deb`, para confirmar que a nova wiring de `notices` e o
    `linux.icon` apontando para `resources/icon.png` funcionam de ponta a ponta.

## Implementation Decisions

### `tsconfig` — subir a configuração para a base

- `tsconfig.base.json` (raiz) passa a declarar, além das opções atuais
  (inalteradas): `baseUrl` com o template `${configDir}`, o bloco `paths`
  (`@shared/*` → `src/shared/*`, `@/*` → `src/renderer/src/*`) e `include`
  (`${configDir}/src`, `${configDir}/electron.vite.config.ts`).
- `${configDir}` (TypeScript ≥ 5.5; o repo resolve 5.9.3) expande para o
  diretório do `tsconfig.json` que faz `extends`, não o da base — então
  `paths` e `include` continuam relativos a cada app.
- Cada `apps/*/tsconfig.json` passa a ser exatamente
  `{ "extends": "../../tsconfig.base.json" }`. O arquivo continua existindo
  porque `npm run typecheck` roda `tsc --noEmit` por workspace e lê o
  `./tsconfig.json` local.
- O ESLint não é type-aware (não há `parserOptions.project` no
  `eslint.config.mjs`), então não depende dessa mudança.

### `electron.vite.config.ts` — sem mudança

- Os três apps sem Tailwind têm o arquivo byte-idêntico; o do `git-dlog` é o
  mesmo mais o plugin `tailwindcss()`. Não há divergência acidental. Uma factory
  compartilhada foi considerada e descartada: o arquivo tem ~500 bytes, usa
  `__dirname`, e a indireção custaria mais do que a duplicação.

### `package.json` de app — forma canônica única

Aplicada aos quatro, mesma ordem de chaves:
`name`, `version`, `private`, `description`, `author`, `homepage`, `main`,
`license`, `scripts`, `build`, `dependencies`, `devDependencies`.

- **`license`**: `"MIT"` nos quatro (hoje só no `git-dlog`).
- **`version`**: inalterado — `meu-movel-planejado` fica em `1.0.0`, os outros em
  `2.0.0` (marco real de reescrita das camadas).
- **`productName`**: inalterado — `"Meu Movel Planejado"` sem acento é
  proposital (vira caminho de instalação, nome de `.deb` e de instalador NSIS).
- **`appId`**: `git-dlog` passa de `com.gitdlog.desktop` para `com.gitdlog.app`.
- **`scripts`**: remover `dev:renderer` dos quatro; manter `preview`. Ordem
  canônica: `dev`, `preview`, `build`, `typecheck`, `notices`, `dist:win`,
  `dist:linux`.
- **`build`** (config inline do `electron-builder`): bloco idêntico nos quatro a
  menos de `productName`, `appId` e `linux.category` (`git-dlog` mantém
  `"Development"`; os outros `"Office"`). Ordem de chaves: `appId`,
  `productName`, `directories`, `files`, `asarUnpack`, `extraResources`, `win`,
  `linux`, `nsis`. `win: { icon, target }`;
  `linux: { icon, target, category, maintainer }`.
  - `win.icon` continua `build/icon.ico`.
  - `linux.icon` passa de `build/icon.png` para `resources/icon.png`.
  - `extraResources` idêntico nos quatro: `resources` → `resources`,
    `THIRD-PARTY-NOTICES.md` → `THIRD-PARTY-NOTICES.md`,
    `../../LICENSE` → `LICENSE`.

### Aviso de terceiros para todos os apps

- O gerador `scripts/generate-third-party-notices.mjs` já é genérico: recebe o
  nome do workspace, resolve a árvore com `npm ls -w <app> --omit=dev --all` e
  trata o Electron à parte. Não precisa mudar.
- Cada `package.json` de app ganha
  `"notices": "node ../../scripts/generate-third-party-notices.mjs <nome-do-app>"`.
- `dist:win` e `dist:linux` dos três apps que ainda não fazem isso passam a
  começar com `npm run notices &&` (o `git-dlog` já faz). Depois disso os quatro
  `dist:win` ficam idênticos entre si, e os quatro `dist:linux` também.
- O gerador é executado agora para os três apps e os `THIRD-PARTY-NOTICES.md`
  resultantes entram versionados.
- `package.json` raiz ganha
  `"notices": "npm run notices --workspaces --if-present"`.
- `.prettierignore` já tem `apps/*/THIRD-PARTY-NOTICES.md` (glob) — sem mudança.

### `package.json` raiz — scripts

- O bloco `dist:linux:*` é reordenado para `dinheiro`, `negocio`, `dlog`,
  `movel`, casando com o bloco `dist:*`.
- Entra o script `notices` agregador descrito acima.

### Ícones

- `apps/*/build/icon.png` é apagado nos quatro (cópia byte-a-byte de
  `apps/*/resources/icon.png`, confirmado por hash).
- `resources/icon.png` continua sendo o input de runtime
  (`import icon from '../../resources/icon.png?asset'` em `src/main/index.ts`) e
  passa a ser também o `linux.icon` do `electron-builder`.
- `build/` de cada app fica só com `icon.ico`.

### README raiz — correções factuais

- **§3.2**: adicionar a linha dos builds Linux (`npm run dist:linux:<app>` gera
  `.deb`), paralela à do instalador Windows NSIS.
- **§3.3**: o bullet do `tsconfig.base.json` passa a dizer que cada
  `apps/*/tsconfig.json` só faz `extends` — `paths` e `include` moram na base.
- **§4.1**: trocar "O `git-dlog` gera esse aviso" / "Para cobrir outro app…" por
  a formulação de que todos os apps geram, via o script `notices` de cada um e o
  agregador da raiz.

### `docs/agents/domain.md`

- A frase que lista `git-dlog`, `meu-negocio-app` e `meu-movel-planejado` como os
  apps com `CONTEXT.md` passa a listar os quatro.

## Testing Decisions

Esta mudança não adiciona código de produção com lógica: não há função nova para
cobrir com teste unitário. O `vitest.config.ts` raiz coleta apenas
`apps/*/src/**/*.test.ts` (módulos puros), e nada em `src/` é tocado — então
nenhum teste automatizado novo é criado.

O que caracteriza "passou" aqui é comportamento externo observável pelos comandos
que já existem, no seam mais alto possível (os scripts npm da raiz):

- **Seam 1 — toolchain da raiz (preferido, único ponto):**
  - `npm run typecheck` passa nos quatro apps. É o que valida o hoist do
    `tsconfig`: se os `paths` não resolvessem para dentro de cada app, os imports
    `@/` e `@shared/` quebrariam a checagem de tipos.
  - `npm run lint` sem regressão.
  - `npm run format` seguido de `npm run format:check` limpo (os `package.json` e
    `tsconfig.json` reescritos precisam sair já no formato do Prettier).
  - `npm run notices` (script agregador novo) regenera os quatro; `git status`
    depois mostra os três `THIRD-PARTY-NOTICES.md` novos e o do `git-dlog` sem
    mudança relevante — confirma reprodutibilidade.
- **Seam 2 — pipeline de empacotamento (verificação manual de ponta a ponta):**
  - `npm run dev:dlog` e `npm run dev:negocio`: cada app sobe e a janela abre com
    o ícone certo (valida `resources/icon.png?asset` intacto).
  - `npm run dist:linux:negocio` numa máquina Linux: empacota; inspecionar o
    `.deb` (`dpkg -c` ou `ar x` + `tar`) e confirmar que ele contém
    `resources/THIRD-PARTY-NOTICES.md` e `resources/LICENSE`, e que o ícone do
    app renderiza — isto exercita a wiring nova de `notices` e o `linux.icon`
    apontando para `resources/icon.png`.
  - Repetir com `npm run dist:linux:dlog` para o app que já tinha a wiring, como
    controle de não-regressão.

**Prior art:** não há testes de config/empacotamento no repo hoje; a checagem de
fim de alteração canônica é a combinação `npm run typecheck` + `npm run lint`
descrita em `CLAUDE.md`, e é ela que serve de baseline aqui.

## Out of Scope

- Qualquer coisa dentro de `src/` de qualquer app.
- `electron.vite.config.ts` — permanece por app, sem mudança.
- `apps/git-dlog/gitdlog.sh` — permanece na raiz do app.
- `apps/*/docs/` (os `orca-*.md`, `empacotamento.md`, os ADRs de app) — são docs
  de arquitetura vivos e referenciados; não são artefato a limpar.
- A assimetria de existir `apps/*/docs/` só em `git-dlog` e `meu-movel-planejado`
  — é ausência de doc, não artefato redundante.
- `README.md` e `CONTEXT.md` **dos apps** — prosa de produto, fora do escopo.
- `version` do `meu-movel-planejado`, `productName` sem acento do
  `meu-movel-planejado`, `appId` no formato `.app` dos outros três — decisões
  deliberadas, mantidas.
- Introduzir CI (não existe `.github/` hoje e este spec não cria).
- Deduplicar `THIRD-PARTY-NOTICES.md` do versionamento (foi decidido mantê-lo
  commitado).

## Further Notes

- Origem: sessão de grilling (`/grill-with-docs`) sobre limpeza da raiz dos apps.
  As 15 perguntas de design foram respondidas pelo mantenedor; as decisões acima
  são a consolidação delas.
- Ordem sugerida de execução: (1) `tsconfig`; (2) `package.json` de app —
  forma canônica, `license`, `appId`, scripts, bloco `build`, `extraResources`;
  (3) `package.json` raiz — reordenar `dist:linux:*`, adicionar `notices`
  agregador; (4) gerar os três `THIRD-PARTY-NOTICES.md` e apagar os
  `build/icon.png`; (5) README raiz e `docs/agents/domain.md`; (6) rodar o
  Seam 1 inteiro; (7) Seam 2.
- Ponto de atenção no `linux.icon`: o `electron-builder` procura o `icon`
  primeiro em `buildResources` (`build/`) e só depois relativo à raiz do
  projeto. Com `resources/icon.png` (que não está em `build/`) ele cai no
  fallback relativo à raiz. Funciona, mas é exatamente o que o Seam 2 confirma
  ao inspecionar o `.deb`.
- Nenhum ADR é necessário: as escolhas são reversíveis, não surpreendem um
  leitor futuro e são padronização, não trade-off arquitetural. A convenção de
  `tsconfig` que muda está documentada no README raiz §3.3, que este spec
  atualiza.
