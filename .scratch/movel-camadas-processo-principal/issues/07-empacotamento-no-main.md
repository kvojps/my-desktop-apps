Status: resolvido
Blocked by: 01, 06

# Meu Móvel Planejado: o empacotamento vai para o main

O ticket que o ADR-0003 encomendou. A regra de domínio que roda no renderer — 765 linhas em
`shared/nesting/` mais o `planSnapshot` — passa para o `main`, `plans:save` dá lugar a
`plans:generate`, e o comentário do precedente revogado sai do código.

É o único ticket da leva com **mudança de comportamento observável**, e o único que toca o
renderer. Move, canal e renderer vão **no mesmo commit**: separá-los deixa a árvore vermelha
entre tickets (spec, decisão 9).

## O move

| De                                            | Para                                    |
| --------------------------------------------- | --------------------------------------- |
| `shared/nesting/packCuttingPlan.ts` (+ teste) | `main/domain/nesting.ts` (+ teste)      |
| `shared/nesting/maxRects.ts`                  | `main/domain/maxRects.ts`               |
| `shared/nesting/types.ts`                     | dissolve-se nas entidades de `domain/`  |
| `shared/plan/planSnapshot.ts` (+ teste)       | `main/domain/planSnapshot.ts` (+ teste) |

**Ficam em `shared/`**, e é deliberado: `nesting/fit.ts`, `plan/planOutdated.ts`,
`plan/usableArea.ts` e `units/`.

`domain/` continua **plana**, sem subpasta — como nos três apps migrados. `nesting` é termo do
`CONTEXT.md` ("nesting livre"), não um nome inventado para a pasta.

## O import relativo (restrição, não estilo)

`vitest.config.ts` da raiz cobre `apps/*/src/**/*.test.ts` **sem alias**: quatro apps declaram
`@shared` para pastas diferentes, e não há alias de raiz possível. `domain/nesting.ts` precisa
de `fitsPackable`/`packableSize`/`usableSize` e de `tenthsMm2ToSquareMeters` — os quatro por
**valor**.

Então `domain/nesting.ts` importa por caminho relativo (`../../shared/nesting/fit`,
`../../shared/units/area`), com o comentário que `packCuttingPlan.ts:24-27` já carrega, adaptado
ao novo caminho.

**A armadilha:** um `@shared/` escrito por engano ali só quebra em `npm run test` — passa no
`typecheck` e no build. Rodar a suíte é obrigatório neste ticket, não opcional.

Import **de tipo** (`import type`) de `@shared` continua seguro em qualquer lugar: o transform o
apaga.

## O canal

`plans:save(projectId, PlanInput)` é **apagado** e nasce:

```
plans:generate(projectId) → Plan
```

O `plansService.generate(projectId)`:

1. carrega projeto (404), peças e chapas dos repositórios;
2. monta o `CuttingPlanInput` (peças, chapas, kerf, refile — o empacotamento só depende da
   geometria do corte);
3. chama `packCuttingPlan` de `domain/nesting.ts`;
4. passa por `domain/planSnapshot.ts`, com o `project.updatedAt` **lido antes de empacotar** —
   é comparando com ele que a tela saberá que o papel na bancada ficou para trás;
5. `repos.transaction(() => repos.plans.replaceForProject(…))`;
6. devolve o `PlanEntity`, que o `plansController` mapeia por `plan.response.ts`.

Continua **fora** de `READ_ONLY_CHANNELS`: é escrita, e é o aviso dela que atualiza a tela de
Projeto. `plansService.save` (provisório do ticket 05) desaparece.

Some junto: `controllers/schemas/plans.schema.ts` na parte de `planInputSchema` (75 linhas de
zod), e `PlanInput` deixa de ser tipo de contrato — vira tipo interno do main. O que o renderer
manda passa a ser um id, e `parseId` dá conta.

## A entidade que difere do response

`CuttingPlanEntity` — o que `packCuttingPlan` devolve — carrega `pieceId` e `sheetId`;
`planSnapshot` os descarta de propósito, e no lugar do primeiro vai o **rótulo copiado** da
peça. É a tradução em código de "plano é snapshot, não derivação": uma peça excluída amanhã não
pode apagar a folha que já foi impressa.

É o `stock_applied` deste app — o caso para o qual o README §2.5 foi escrito. Antes ela era
defendida por um comentário; agora é estrutura.

## O renderer

Um arquivo, e só ele: `renderer/src/hooks/plan/useGeneratePlan.ts`.

- `runAttempts`, `yieldToInterface` e o import de `packCuttingPlanAttempts` são **apagados**.
- `generate` vira `await api.generatePlan(project.id)`; `toPlanInput` sai do renderer junto.
- `isGenerating`, `canGenerate`, `blockedReason` e a navegação condicional (`planPath`, para não
  empilhar histórico quando já se está na tela de Plano) ficam como estão.
- O comentário de `useGeneratePlan.ts:13-17`, que descreve o precedente revogado, sai.
- `api/client.ts`: `savePlan` → `generatePlan`.
- `shared/ipc/api.ts`: `PlansApi.save` → `PlansApi.generate`, e a frase "o main não empacota"
  (`api.ts:36-39`) sai.

**`packCuttingPlanAttempts` morre como API pública**, como o ADR-0003 previu: a cessão de
controle existia para a tela repintar, e do lado do main não há tela. O que atravessa é um plano
só. `packCuttingPlan` mantém o laço das doze tentativas internamente.

`usePieceForm.ts`, `PieceFormModal.tsx` e `utils/cuttingGeometry.ts` **não mudam** — é o que
`fit.ts` ficando em `shared` compra.

## A emenda ao ADR-0003

`docs/adr/0003-logica-de-dominio-no-main.md` ganha uma seção nova (não um ADR novo — um segundo
documento deixaria a lista de custos errada de pé no primeiro). Três coisas:

1. **A medição do ticket 01**, com os três números e a faixa em que caiu.
2. **A lista de custos corrigida.** O custo 3 ("a cessão de controle morre") está **invertido**:
   o `yieldToInterface` existia porque o empacotamento travava o event loop do _renderer_; no
   main o renderer fica livre e o rótulo repinta sozinho. O custo 2 ("trava todas as janelas") é
   **vazio** neste app: `index.ts:102-108` cria uma janela e, no `activate`, só quando não há
   nenhuma. O que de fato paga é a **moldura nativa** e o IPC concorrente, que o ADR não nomeia.
3. **`fitsAnySheet` como exceção nomeada**, do mesmo modo que o ADR nomeou `isWorktreeDirty`:
   fica em `shared` porque o main continua sendo quem decide — o 422 na fronteira é a decisão de
   registro — e o renderer só **antecipa** a resposta para explicá-la ao vivo, com
   `describeFitRule` e os números do projeto, antes da ida e volta. Levá-la ao main trocaria um
   `Alert` explicativo por um submit falhado, numa tela cuja razão de existir é separar rejeição
   de falta de estoque.

Exceção escrita é exceção que alguém pode contestar; exceção implícita é precedente silencioso.

## Se a medição pedir worker thread

Se o ticket 01 caiu na faixa `> 2 s`, o ticket `09-worker-thread.md` vem antes deste e
`plansService.generate` chama o worker em vez da função direto. O resto deste ticket não muda.

## Verificação

`npm run typecheck` (4 apps), **`npm run test`** (obrigatório — é o único que pega o `@shared`
escrito por engano; `packCuttingPlan.test.ts` e `planSnapshot.test.ts` passando do novo lugar),
`npm run lint`, `npx electron-vite build` no app.

`grep -rn '@shared' src/main/domain/nesting.ts` vazio. `grep -rn 'packCuttingPlan\|planSnapshot'
src/renderer src/shared` vazio. `grep -rn 'plans:save\|savePlan' src` vazio.

`npm run dev:movel`, com um projeto de tamanho realista:

- gerar plano da tela de Projeto leva ao desenho; da tela de Plano, gera sem empilhar histórico;
- o rótulo "Gerando…" aparece e **continua pintado** durante toda a operação;
- arrastar e redimensionar a janela durante a geração — é aqui que se confirma na mão o que o
  ticket 01 mediu;
- o plano gerado é idêntico ao de antes para a mesma entrada (o empacotador é determinístico);
- peça sem rótulo continua aparecendo pela medida no desenho; a legenda mantém a numeração;
- cadastrar peça grande demais continua barrado **ao vivo**, com o `Alert` e a explicação de
  `describeFitRule`;
- o aviso de plano desatualizado aparece depois de alterar peça ou chapa, e **não** aparece logo
  após gerar.

`/code-review` (Standards + Spec em paralelo) sem achados abertos.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 1, 6, 7, 8, 9, 10, 11, 12) e do
`docs/adr/0003-logica-de-dominio-no-main.md`, que o encomendou nominalmente.

### Resolvido

O empacotador roda no main. Move, canal e renderer no commit `[refac]` só; a emenda ao
ADR-0003 junto (é artefato da mudança, não da conclusão do ticket).

- **Move**, com histórico: `shared/nesting/packCuttingPlan.ts` → `main/domain/nesting.ts`
  (+ teste `nesting.test.ts`), `maxRects.ts` → `main/domain/` **verbatim**,
  `shared/plan/planSnapshot.ts` → `main/domain/` (+ teste). `shared/nesting/types.ts`
  dissolveu-se em `nesting.ts`. Ficaram em `shared/`: `nesting/fit.ts` (+ teste),
  `plan/planOutdated.ts`, `plan/usableArea.ts`, `units/`.
- **Nomes de entidade** (README §2.2): os tipos dissolvidos ganharam o sufixo `Entity`
  como todo tipo de `domain/`. `Nesting*` (`NestingPlacementEntity`, `NestingSheetEntity`,
  `NestingShortfallEntity`, `NestingDeficitEntity`) marca o resultado cru do empacotador —
  o que carrega `pieceId`/`sheetId` —, distinto das entidades de snapshot de
  `domain/plan.ts`; `Packable*` (`PackablePieceEntity`, `PackableSheetEntity`) o que ele
  lê; `CuttingPlanInputEntity` a entrada. `CuttingPlanEntity` manteve o nome que a spec
  lhe deu — a entidade que difere do response (README §2.5).
- **Import relativo** (`../../shared/…`) para os quatro valores que `nesting.ts` precisa;
  `grep -rn '@shared' src/main/domain/nesting.ts` vazio. O comentário da restrição foi
  adaptado ao novo caminho, sem citar o alias literalmente.
- **Canal**: `plans:save` apagado, `plans:generate(projectId) → Plan` nascido.
  `plansService.generate` carrega projeto (404), peças e chapas, monta o
  `CuttingPlanInputEntity`, chama `packCuttingPlan`, passa por `planSnapshot` com o
  `project.updatedAt` lido antes de empacotar, e grava em `repos.transaction`. Fora de
  `READ_ONLY_CHANNELS`. `controllers/schemas/plans.schema.ts` (75 linhas de zod) apagado;
  `PlanInput` virou tipo interno do main (`Omit<PlanEntity, 'id' | 'projectId' |
'generatedAt'>` em `domain/plan.ts`) e `Plan` de `@shared/types/plan` deixou de
  estendê-lo. `projectsRepository.exists` foi junto — o único caller era `save`.
- **O laço das doze tentativas** roda inline em `packCuttingPlan`;
  `packCuttingPlanAttempts` morreu como API pública (ADR-0003), e o comentário do
  precedente revogado que ele carregava saiu com ele.
- **Renderer**, um arquivo de lógica: `useGeneratePlan.ts` — `runAttempts`,
  `yieldToInterface`, os imports de `packCuttingPlanAttempts`/`toPlanInput` e o comentário
  de `:13-17` apagados; `generate` = `await api.generatePlan(project.id)`. O parâmetro
  `sheets`, agora morto, saiu da assinatura do hook, o que forçou remover um argumento nos
  dois call sites (`PlanPage.tsx`, `ProjectPage.tsx`) — `no-unused-vars` acusa o parâmetro
  final não usado, e `npm run lint` está na verificação; manter parâmetro morto seria pior.
  `api/client.ts` `savePlan`→`generatePlan`; `shared/ipc/api.ts` `save`→`generate` e a
  frase "o main não empacota" removida; preload atualizado. O cross-check de `fit.test.ts`
  contra o empacotador passou para `nesting.test.ts` (o empacotador está no main agora);
  `channels.test.ts` seguiu o rename do canal.
- **Emenda ao ADR-0003** (seção nova, não ADR novo): a medição do ticket 01 (medianas 0,6
  / 3,5 / 10,6 ms, faixa `< 500 ms`, sem worker thread, com hardware e versão do Node), a
  lista de custos corrigida (custo 2 vazio — uma janela só; custo 3 invertido — o event
  loop do renderer fica livre; o que paga é a moldura nativa e o IPC concorrente), e
  `fitsAnySheet` nomeada como exceção que fica em `shared`, como `isWorktreeDirty`.

Verificação: `npm run typecheck` (4 apps), `npm run test` (187), `npm run lint` (0 erros),
`npx electron-vite build` — verdes. Os três greps (`@shared` em `nesting.ts`;
`packCuttingPlan`/`planSnapshot` em `src/renderer src/shared`; `plans:save`/`savePlan` em
`src`) vazios. `/code-review` (Standards + Spec): sem achados abertos — a mudança dos dois
call sites do renderer e o rename para `*Entity` ficaram registrados como consequência
forçada (lint) e alinhamento de convenção (README §2.2), não como defeito.
