Status: aberto

# Camadas do processo principal: Meu Móvel Planejado

Deriva de uma sessão de `/grill-with-docs` (grilling + domain-modeling) seguida de plan mode.
O `git-dlog`, o `meu-negocio-app` e o `meu-dinheiro-app` já rodam no padrão de quatro camadas
(README §2.2, ADR-0002/0003) — tickets 01–10 de `.scratch/camadas-processo-principal/`, 01–07 de
`.scratch/negocio-camadas-processo-principal/` e 01–07 de
`.scratch/dinheiro-camadas-processo-principal/`, todos resolvidos. O `meu-movel-planejado` é o
**último da fila**, e enquanto ele não migra está divergindo do README — o que é bug do código,
pelo próprio README.

Este app é diferente dos três anteriores num ponto: o ADR-0003 foi escrito para revogar um
precedente que está **neste** código, e diz com todas as letras que "o ticket de migração
daquele app tem de apagá-lo junto com o resto". Hoje 765 linhas de regra de domínio
(`shared/nesting/`) rodam no renderer.

## Problema

| | `git-dlog` | `negocio` | `dinheiro` | **`movel`** |
|---|---|---|---|---|
| `db.transaction(` nas repositories | 0 | 4 | ~11 | **8** — pieces ×3, sheets ×3, plans ×1, backup ×1 |
| Versão do `handle` | A → B (ticket 03) | A → B (ticket 01) | já B | **já B** |
| `CONTEXT.md` | existe | existe | criado na leva | **existe, e é o mais rico do repo** |
| 404 lançado no repositório | não | sim | sim | **sim** — projects, pieces, sheets, plans |
| Import repo→repo | não | sim | sim | **sim** — `pieces`→`projects`+`sheets`, `sheets`→`projects` |
| Regra de negócio no repositório | não | estoque | competência, cascata | **`assertFitsSomeSheet` (422), `touchProject`** |
| Entidade que difere do response | nenhuma | `stock_applied` | nenhuma | **`CuttingPlanEntity`** (`pieceId`/`sheetId`) |

Duas consequências diretas: **não há ticket de conformidade do `handle`** (como no
`meu-dinheiro-app`: `ipc/handle.ts` já dispara `notifyDataChanged`, `shared/ipc/channels.ts` já
tem `READ_ONLY_CHANNELS` + `shouldNotifyDataChanged` + `channels.test.ts`) e **não há ticket de
`CONTEXT.md`** (diferente do `meu-dinheiro-app`: o glossário deste app foi fixado antes de haver
código, e é ele que nomeia tabela, tipo e rótulo de tela).

Frentes medidas no `src/main` e no `src/shared` atuais:

1. **A lógica de domínio no renderer.** `shared/nesting/` são 765 linhas de regra
   (`packCuttingPlan.ts` 398, `maxRects.ts` 163, `types.ts` 111, `fit.ts` 93) mais 570 de teste,
   numa pasta cujo contrato declarado é "só tipos e funções puras, importável pelos dois lados".
   `useGeneratePlan.ts:13-17` carrega, escrito com todas as letras, o comentário do precedente
   que o ADR-0003 revoga; `shared/ipc/api.ts:36-39` repete a afirmação ("o main não empacota").
2. **`assertFitsSomeSheet` dentro do `piecesRepository`** (`piecesRepository.ts:72-79`) — a régua
   da rejeição, com o 422, decidida no repositório. Junto dela, `touchProject` importado de
   `projectsRepository` e `listSheets` de `sheetsRepository`: acoplamento entre repositórios que
   o service deveria mediar.
3. **8 `db.transaction` em repositórios**, todos composição multi-tabela genuína: as três
   escritas de peça e as três de chapa (cada uma é `touchProject` + a escrita, e o carimbo antigo
   com peça nova é exatamente o estado em que o app diria que o plano está em dia quando não
   está), `savePlan` (`DELETE` + quatro `INSERT` em cascata) e `importBackup` (apaga e reescreve
   tudo). `migrations.ts` mantém a sua — plumbing.
4. **404 lançado no repositório** em `getProjectOrThrow`, `touchProject`, `deleteProject`,
   `getPieceOrThrow`, `getSheetOrThrow` e no guard de `savePlan`. O ADR-0002 diz que o
   repositório devolve `null` e o 404 é do service.
5. **`backup/`, `export/`, `print/` e `theme/` são camada de serviço em tudo menos no nome** — é
   a linha que a spec original (`../camadas-processo-principal/spec.md`) já registrava sobre este
   app. Os quatro misturam orquestração, diálogo nativo e disco no mesmo arquivo.
6. **O tema entra por closure.** `registerIpcHandlers(db, { onThemeModeChange })` recebe do
   `index.ts` uma função que grava e aplica; `theme/themeMode.ts` guarda estado de módulo
   (`let current`) e mistura banco (`getSetting`), `nativeTheme` e `BrowserWindow`. Nos outros
   dois apps isso terminou como `settingsService` + `infra/gateways/system/themeMode.ts`, sem
   callback.

## Dois achados da sessão

### O ADR-0003 erra dois dos três custos que lista, para este app

O ADR enumera três preços da revogação. Confrontados com o código:

- **Custo 3 ("a cessão de controle entre tentativas morre") está invertido.** O
  `yieldToInterface` de `useGeneratePlan.ts:33` existe porque o empacotamento roda **no
  renderer** e trava o event loop *dele* — é por isso que o rótulo do botão não repintava
  sozinho. Movido para o main, o event loop do renderer fica livre durante toda a operação:
  "Gerando…" pinta e continua pintando, sem ninguém ceder nada. `packCuttingPlanAttempts`,
  `runAttempts` e `yieldToInterface` são **apagados**, não lamentados. O sinal de progresso
  melhora.
- **Custo 2 ("trava todas as janelas") é vazio aqui.** `index.ts:102-108`: o app cria uma janela
  no boot e, no `activate`, só quando `getAllWindows().length === 0`. Nunca há uma segunda
  janela para congelar.

O que de fato degrada, e o ADR não nomeia, é a **moldura nativa** (arrastar, redimensionar,
minimizar) e qualquer IPC concorrente — essas o main é que serve. Sobra também o custo 1, a ida
e volta de IPC, que é o mais barato dos três.

Isso não anula a medição do ticket 01; troca a pergunta dela. Não é "a UI congela?" (o renderer
não congela), é "a moldura nativa trava tempo suficiente para incomodar?".

### O `@shared` não resolve na suíte da raiz

`vitest.config.ts` cobre `apps/*/src/**/*.test.ts` **sem alias nenhum** — quatro apps declaram
`@shared` para pastas diferentes, então não há alias de raiz possível. É por isso que
`packCuttingPlan.ts:24-27` já carrega o comentário e importa `./fit` e `../units/area` por
caminho relativo.

Nenhum dos três apps migrados tem `.test.ts` dentro de `src/main`, então o problema nunca
apareceu. Aqui aparece: são cinco testes em `main/` hoje, e o ticket 07 leva um sexto
(`packCuttingPlan.test.ts`, 461 linhas) para lá.

## Decisões

Sessão de grilling encadeada com plan mode, 18 decisões:

| # | Decisão |
|---|---|
| 1 | **A revogação do ADR-0003 entra nesta leva, medindo antes.** O ticket 01 cronometra `packCuttingPlan` no processo main; o número entra na emenda do ADR seja qual for a faixa. O próprio ADR nomeia a medição ausente como o ponto por onde uma revisão começaria |
| 2 | Spec em diretório-irmão próprio (este), não continuação numerada das specs anteriores |
| 3 | Os 5 testes que já vivem em `main/` acompanham o módulo no ticket 02 (só o caminho do import muda). **Nenhum teste novo** na leva — ADR-0002; o `channels.test.ts`, exceção nos runs anteriores, já existe aqui |
| 4 | `RegisterIpcOptions.onThemeModeChange` some; o `settingsService` assume o tema, e o `index.ts` monta `makeSettingsRepository(db)` direto para o boot (precedente `meu-dinheiro-app`). A closure existia só porque não havia camada de serviço |
| 5 | Commits em inglês, prefixos entre colchetes, dois por ticket (`[refac]:` do código, depois `[docs]: closes ticket NN …`); tickets mecânicos (02) e de limpeza (08) podem ser commit único. `/code-review` (Standards + Spec) após 05, 06 e **07** |
| 6 | **`fit.ts` fica em `shared/`**, nomeada como exceção na emenda do ADR-0003. O main continua sendo quem decide (o 422 na fronteira é a decisão de registro); o renderer só **antecipa** a resposta para explicá-la antes da ida e volta. Mesmo tratamento que o ADR deu ao `isWorktreeDirty` |
| 7 | `plans:save` é **apagado**; nasce `plans:generate(projectId) → Plan`. `schemas/plan.schema.ts` (75 linhas de zod) some e `PlanInput` deixa de ser tipo de contrato. Continua fora de `READ_ONLY_CHANNELS` — é escrita |
| 8 | **Vão** para o main: `nesting/{packCuttingPlan, maxRects, types}` e `plan/planSnapshot` (esta decide o que atravessa: descarta `pieceId`/`sheetId`). **Ficam** em `shared`: `fit.ts` (decisão 6), `planOutdated` (compara dois carimbos que já atravessaram), `usableArea` (geometria de desenho) e `units/` |
| 9 | **Oito tickets.** O 07 é ticket próprio, e não dobrado no 04/05, porque a mudança de pasta, o canal novo e o renderer têm de acontecer **juntos** — separá-los deixa a árvore vermelha entre tickets. É também o único que muda comportamento observável, o que mantém o eixo Spec do `/code-review` limpo nos seis anteriores |
| 10 | **Emenda ao `docs/adr/0003-logica-de-dominio-no-main.md`**, não ADR de app. Tudo a registrar (a medição, a lista de custos corrigida, o `fitsAnySheet` como exceção) é correção e conclusão *daquela* decisão; um documento novo deixaria a lista de custos errada de pé no primeiro |
| 11 | Empacotador em `main/domain/`, **plano**, sem subpasta: `nesting.ts` e `maxRects.ts`. O empacotador não orquestra repositório nem gateway — não faz o que `services/` é descrito para fazer —, e `meu-dinheiro-app/domain/monthNames.ts` e `domain/theme.ts` já provam que `domain/` hospeda regra pura que não é entidade |
| 12 | `domain/nesting.ts` importa `shared/` por **caminho relativo** (`../../shared/…`), não por `@shared/`. É a solução que o repo já usa pelo mesmo motivo; alias por app no `vitest` seria infraestrutura nova para um import |
| 13 | Medição em três tamanhos, com ramificação **pré-comprometida** no caso pesado: `< 500 ms` segue como está; `500 ms – 2 s` segue e o número vira custo aceito na emenda; `> 2 s` faz entrar um ticket de worker thread — a saída que o ADR-0003 já nomeia |
| 14 | `domain/`: `project.ts`, `piece.ts`, `sheet.ts`, `plan.ts` (a árvore), `theme.ts`, mais `nesting.ts`, `maxRects.ts` e `planSnapshot.ts`. **Backup não ganha entidade** — o app exporta linhas cruas por decisão registrada (ADR-0002 do app; o README §2.5 a chama de exceção deliberada) |
| 15 | Seis gateways, todos em `infra/gateways/system/`: `dialogs.ts`, `fileSystem.ts`, `shell.ts`, `themeMode.ts`, `appInfo.ts`, `printing.ts`. Nenhum grupo aqui justifica pasta própria como `git/` e `pr/` justificam no `git-dlog`. `windowFor.ts` fica em `controllers/`, como nos três apps |
| 16 | Os quatro canais `data:*` em `backupService` + `backupController`, precedente do `negocio` e do `dinheiro`. O nome não casa com o prefixo do canal e isso incomoda ao grepar; a consistência com os dois apps mais recentes vale mais |
| 17 | Os 404 sobem para os services; os repositórios devolvem `null` (leituras) ou `boolean` (`touch`, `delete`). **Sem mudança observável** — diferente do `meu-negocio-app`, onde deletes silenciosos passaram a lançar; aqui eles já lançam. Ganho de brinde: `piecesService.create` confere o projeto **antes** de abrir a transação, e a conferência sai de graça porque `fitsAnySheet` já carrega o projeto |
| 18 | O ticket 08 apaga os dois comentários do precedente revogado, ajusta a frase do README §2.2 que manda regra pura para `services/` (hoje contradiz o que os três apps migrados fizeram) e troca o parágrafo "só `meu-movel-planejado` na fila" — a leva fecha os quatro apps. `CONTEXT.md` e o README do app **não mudam** |

## Ordem

1. Medir o empacotador
2. Mover arquivos
3. Unit of work
4. Entidades
5. Services
6. Controllers
7. Empacotamento no main
8. Limpezas

O 01 não tem dependência com ninguém — precisa só estar resolvido antes do 07, e executa na
ordem do número. 02→03→04→05→06→07→08 são sequenciais, cada um bloqueia o próximo: mesma ordem
de dependência dos três apps anteriores (estrutura de pastas antes do unit of work, entidades
antes de services, services antes de controllers), com o 07 depois do 06 porque ele precisa das
camadas prontas para receber o empacotador.

## Riscos

- **A medição pode virar um nono ticket.** Se o caso pesado passar de 2 s, worker thread entra
  na leva (decisão 13) e o ticket 07 cresce. É o único ponto em que o escopo desta spec não está
  fechado — de propósito, porque fechá-lo agora seria repetir o erro que o ADR-0003 cometeu.
- **O ticket 07 é o único com mudança de comportamento observável** e o único que toca o
  renderer. E toca **um arquivo só**: `useGeneratePlan.ts`. O `fit.ts` ficando em `shared`
  (decisão 6) poupa `usePieceForm.ts`, `PieceFormModal.tsx` e `utils/cuttingGeometry.ts`, que
  seriam os outros três.
- **`fitsAnySheet` é exceção nomeada, não regra.** O risco é ela ser lida como permissão geral
  para pôr regra em `shared`. A emenda do ADR-0003 precisa nomeá-la como o ADR nomeou o
  `isWorktreeDirty`, e pela mesma razão: exceção escrita é exceção que alguém pode contestar,
  exceção implícita é precedente silencioso.
- **`registerIpc.ts` tende a crescer** — 6 domínios (projects, pieces, sheets, plans, backup,
  settings) contra os 4 do `meu-negocio-app` e os ~11 do `meu-dinheiro-app`. Vigiar no ticket 06;
  se doer, o que sai é a composição, não o registro (mesma pendência que os dois registraram).
- **`backupController` serve canais `data:*`.** Desconforto de grep herdado dos dois apps
  anteriores, aceito por consistência (decisão 16).
- **A árvore do plano são cinco mappers** em `controllers/responses/plan.response.ts`
  (`PlanEntity`, `PlannedSheetEntity`, `PlacementEntity`, `ShortfallEntity`, `DeficitEntity`) —
  o maior item isolado do ticket 06, análogo ao `RepoScanResult` do `git-dlog`.
- **O import relativo da decisão 12 é frágil por natureza.** Um `@shared/` escrito por engano em
  `domain/nesting.ts` só quebra em `npm run test`, não em `npm run typecheck` nem no build. O
  ticket 07 precisa rodar a suíte, não só o typecheck.

## Fora de escopo

- A migração em si — é trabalho dos oito tickets, um por vez.
- Qualquer mudança de UI além da que o ticket 07 obriga (o rótulo do botão de gerar continua o
  que é; some só o mecanismo que o fazia repintar).
- `CONTEXT.md` e o `README.md` do app: nada nesta leva cria vocabulário novo, e o produto não
  muda.
- Worker thread para o empacotamento — só entra se a medição do ticket 01 o exigir.

## Comments

Spec e tickets gerados a partir de uma sessão de `/grill-with-docs` (grilling + domain-modeling,
18 decisões em 4 rodadas) seguida de plan mode. O plano completo está em
`C:\Users\josef\.claude\plans\quero-padronizar-o-backend-majestic-sunset.md`.

Esta é a última spec da migração do ADR-0002: com ela fechada, os quatro apps rodam no mesmo
padrão e o README §2.2 deixa de descrever um estado futuro.
