Status: resolvido
Blocked by: 07

# Meu Móvel Planejado: limpezas

O que sobra depois que as camadas estão de pé: apagar o que descreve um mundo que já não existe,
e acertar o README, que passa a poder falar no passado.

Com este ticket a migração do ADR-0002 fecha nos **quatro apps**.

## Comentários do precedente revogado

Os dois são citados nominalmente pelo ADR-0003 ("o ticket de migração daquele app tem de
apagá-lo junto com o resto"). Se o ticket 07 já os levou junto com o código que descreviam,
confirmar; se sobrou resíduo, é aqui que sai:

- `renderer/src/hooks/plan/useGeneratePlan.ts:13-17` — "o empacotamento roda **aqui**, no
  renderer… o precedente do repo é lógica de domínio pura morar fora do main".
- `shared/ipc/api.ts:36-39` — "O empacotamento roda lá: é função pura, e o main não empacota".

Varredura final: `grep -rn 'main não empacota\|precedente' apps/meu-movel-planejado/src` sem
ocorrência que ainda afirme o revogado.

## README §2.2, duas frases

**1. A frase que manda regra pura para `services/`.** Sob o bullet de `services/`:

> Regra de domínio mora aqui mesmo quando é função pura que não toca banco nem disco — o
> critério é o papel dela, não o que ela usa…

O contraste que ela queria fazer é **main × renderer**, e esse continua valendo. Mas lida como
está, ela também diz `services/` × `domain/` — e aí contradiz o que os quatro apps fazem:
`meu-dinheiro-app/domain/monthNames.ts`, `domain/theme.ts` e agora
`meu-movel-planejado/domain/nesting.ts` são regra pura que **não é entidade** e mora em
`domain/`. Reescrever para que o critério fique explícito: regra pura é do **main**; dentro do
main, o que orquestra repositório e gateway é `services/`, e o que é vocabulário ou cálculo do
domínio é `domain/`.

**2. O parágrafo de status da migração.** Hoje:

> A migração é por app: `git-dlog`, `meu-negocio-app` e `meu-dinheiro-app` já convertidos, só
> `meu-movel-planejado` na fila. Enquanto ela não termina, app que ainda não foi convertido está
> divergindo deste documento, e a divergência é bug do código.

Passa a registrar que os quatro estão convertidos. A frase sobre divergência ser bug do código
**fica** — ela vale para sempre, não só durante a migração; o que sai é a lista de pendentes.

## `handle` estreitado

Se o ticket 06 não chegou a estreitar `handle(channel: string)` para `handle(channel:
IpcChannel)`, é aqui. Canal fora de `IPC_CHANNELS` deixa de compilar.

## Varreduras finais

- `grep -rn 'db.transaction' src/main` — só `infra/database/migrations.ts`.
- `grep -rn 'ipcMain.handle' src/main` — só `controllers/handle.ts`.
- `grep -rn "from 'better-sqlite3'\|from 'electron'" src/main/services src/main/domain` — nenhum
  import de valor.
- `src/main/db/`, `src/main/ipc/`, `src/main/schemas/`, `src/main/errors/`, `src/main/backup/`,
  `src/main/export/`, `src/main/print/`, `src/main/theme/` — nenhuma delas existe mais.
- Nenhum arquivo órfão em `src/shared/` (`nesting/types.ts` foi dissolvido; `nesting/` fica só
  com `fit.ts` e o teste dele).

## O que NÃO muda

- **`apps/meu-movel-planejado/CONTEXT.md`** — nada nesta leva criou vocabulário novo. Os termos
  que os nomes de entidade e de service usam (projeto de corte, peça, chapa, plano de corte,
  chapa planejada, colocação, nesting livre) já estavam todos no glossário, fixados antes de
  haver código.
- **`apps/meu-movel-planejado/README.md`** — ele documenta o produto, e o produto não mudou.
- **`CONTEXT-MAP.md`** — os contextos e a ausência de relação entre eles seguem iguais.

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`, `npx electron-vite build` no app.
`npm run dev:movel` uma última vez, passando pelas cinco telas.

Leitura final do README §2.2 contra a árvore real de `apps/meu-movel-planejado/src/main`: cada
pasta que o documento nomeia existe, e nenhuma que ele não nomeia existe. É o teste do objetivo
declarado da leva — que a árvore de pastas conte sozinha como o app funciona.

Limpeza: **commit único** (spec, decisão 5).

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisão 18).

Fecha a migração do `docs/adr/0002-camadas-do-processo-principal.md` nos quatro apps.

### Resolvido

Quase tudo já tinha saído nos tickets 06 e 07 — este ticket confirmou e fechou o
resíduo.

- **Comentários do precedente revogado**: já apagados no ticket 07.
  `useGeneratePlan.ts:9-22` e `shared/ipc/api.ts` descrevem o mundo novo (o
  empacotamento roda no main, ADR-0003). A varredura
  `grep -rn 'main não empacota\|precedente' apps/meu-movel-planejado/src` não
  acha nenhuma ocorrência que ainda afirme o revogado — `index.ts:91` cita o
  precedente **válido** do `meu-dinheiro-app` (boot monta `makeSettingsRepository`
  direto), não o do ADR-0003.
- **README §2.2, frase de regra pura**: reescrita. Antes dizia "regra de domínio
  mora [em `services/`] mesmo quando é função pura", o que contradizia
  `meu-dinheiro-app/domain/monthNames.ts`, `domain/theme.ts` e
  `meu-movel-planejado/domain/nesting.ts`. Agora o critério é explícito: regra
  pura é do **main**, não do renderer; dentro do main, orquestração é `services/`
  e vocabulário/cálculo do domínio é `domain/`.
- **README §2.2, parágrafo de status**: os quatro apps passam a constar como
  convertidos; a lista de pendentes some. A frase sobre divergência ser bug do
  código ficou — ela vale para sempre.
- **`handle` estreitado**: já feito no ticket 06 —
  `handle(channel: IpcChannel, …)`, canal fora de `IPC_CHANNELS` não compila.
- **Resíduo extra**: `infra/database/index.ts` ainda trazia um comentário do
  estado provisório do ticket 03 ("quem compõe ainda é o `registerIpc.ts`
  provisório; o ticket 05 move a composição para os services"). Reescrito para o
  estado final, no molde do `meu-dinheiro-app`.

Varreduras finais, todas limpas: `db.transaction` em `src/main` só em
`migrations.ts` e na própria costura da unidade de trabalho (`index.ts`, idêntico
ao `meu-dinheiro-app`); `ipcMain.handle` só em `controllers/handle.ts`; nenhum
import de valor de `better-sqlite3`/`electron` em `services/` ou `domain/`;
nenhuma das pastas antigas (`db/`, `ipc/`, `schemas/`, `errors/`, `backup/`,
`export/`, `print/`, `theme/`) existe; `shared/nesting/` só com `fit.ts` e o teste
dele.

Verificação: `npm run typecheck` (4 apps), `npm run lint` (0 erros, 2 warnings
pré-existentes no `meu-negocio-app`), `npm run test` (187 testes, 21 arquivos),
`npx electron-vite build` no app (main, preload, renderer) — todos verdes. A
passada manual de `dev:movel` pelas cinco telas não foi refeita: esta leva não
mudou nenhum código de runtime (só comentários e o README), e o ticket 07 já a
tinha feito.

Leitura final do README §2.2 contra a árvore de `apps/meu-movel-planejado/src/main`:
cada pasta que o documento nomeia (`domain/`, `controllers/` com `schemas/` e
`responses/`, `services/`, `infra/database/` com `repositories/`,
`infra/gateways/`, `utils/`) existe, e nenhuma que ele não nomeia existe.

Commit único (spec, decisão 5). Com este ticket a migração do ADR-0002 fecha nos
quatro apps e o README §2.2 deixa de descrever um estado futuro.
