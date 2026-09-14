Status: ready-for-agent

# Meu Móvel Planejado — colapsar Domain Entity + Shared type quando idênticos

## Problem Statement

O ADR `docs/adr/0005-colapso-domain-shared-quando-identico.md` define o
critério de quando colapsar `XEntity` (`main/domain/`) e `X`
(`shared/types/`) num tipo só, e já nomeia `apps/meu-movel-planejado/src/
main/domain/{sheet,project,plan,piece}.ts` como candidatos auditados como
estruturalmente idênticos — mas deixa a auditoria e a execução em si "para
uma rodada futura, entidade por entidade". O piloto (`meu-dinheiro-app`) e
os dois ciclos completos que vieram depois (`git-dlog`, `meu-negocio-app`)
já validaram a receita. Esta spec aplica o mesmo critério aos quatro
candidatos que o ADR nomeia, mais `ThemeMode` — o quinto par que os outros
três apps do monorepo já colapsaram e que aqui ainda não foi tocado.

## Solution

Colapsar `XEntity` + `X` num único tipo, que passa a viver só em
`shared/types/`, para Projeto (`Project`), Peça (`Piece`), Chapa (`Sheet`) e
a árvore de Plano de corte (`Plan`, 5 tipos), mais `ThemeMode`. O
repositório passa a devolver o tipo único diretamente; os arquivos de
`domain/` que ficam puramente duplicados e seus mappers em
`controllers/responses/` são apagados; os controllers consomem o retorno do
service sem mapear de novo.

Diferença em relação aos três apps já migrados: `domain/plan.ts` **não é
apagado**. Ele guarda `PlanInput` — hoje `Omit<PlanEntity, 'id' |
'projectId' | 'generatedAt'>`, depois `Omit<Plan, mesmos três campos>` —, um
tipo que já foi contrato de IPC em `shared/types/plan.ts` até um ticket
anterior mover a geração do plano inteiramente para o main (o renderer
passou a mandar só o id do projeto). Ele nunca mais atravessa o IPC como
está. É um **terceiro tipo de exceção**, diferente de nunca ter tido par
(`EncryptedGithubTokenEntity`, no `git-dlog`) e de mapper com lógica real
(`Month`/`MonthEntity`, no `meu-dinheiro-app`; `isThemeMode`/
`resolveThemeMode`, nos três apps já colapsados): teve par, perdeu por uma
decisão de produto anterior a este ciclo, e hoje só é construído dentro do
main.

`domain/theme.ts` também não é apagado, pelo motivo já conhecido dos outros
três apps: `ThemeModeEntity` colapsa, e as funções `isThemeModeEntity`/
`resolveThemeMode` continuam — a primeira renomeada para `isThemeMode` (o
sufixo `Entity` deixa de fazer sentido: ela passa a guardar o tipo shared,
não mais um tipo de domínio), igual ao `git-dlog` e ao `meu-negocio-app`.

Os tipos internos do empacotador, em `domain/nesting.ts`
(`CuttingPlanEntity`, `CuttingPlanInputEntity`, `NestingSheetEntity`,
`NestingPlacementEntity`, `NestingShortfallEntity`, `NestingDeficitEntity`,
`PackablePieceEntity`, `PackableSheetEntity`), **não colapsam**: nunca
tiveram par em `shared/types/`, carregam `pieceId`/`sheetId` que não
sobrevive à gravação, e são o resultado cru que `planSnapshot.toPlanInput`
traduz para o que se guarda. O arquivo não importa nenhum dos cinco tipos
que colapsam nesta rodada — só os cita em comentários, para explicar por
que o empacotador não os usa direto.

## User Stories

1. Como desenvolvedor do meu-movel-planejado, quero um único tipo para
   Projeto entre domain e shared quando estruturalmente idênticos.
2. Como desenvolvedor, quero o mesmo colapso para Peça.
3. Como desenvolvedor, quero o mesmo colapso para Chapa.
4. Como desenvolvedor, quero o mesmo colapso para a árvore de Plano de
   corte (`PlanEntity` + `PlannedSheetEntity` + `PlacementEntity` +
   `ShortfallEntity` + `DeficitEntity` → `Plan` + `PlanSheet` +
   `PlanPlacement` + `PlanShortfall` + `PlanDeficit`) numa única issue,
   análoga à árvore de Repositório do `git-dlog`.
5. Como desenvolvedor, quero que `domain/plan.ts` continue existindo só
   para `PlanInput`, que passa a referenciar `Plan` de
   `@shared/types/plan` em vez de `PlanEntity`.
6. Como desenvolvedor, quero o mesmo colapso para `ThemeMode`, mantendo
   `domain/theme.ts` vivo por causa de `isThemeMode`/`resolveThemeMode`
   (a primeira renomeada, sem o sufixo `Entity`).
7. Como desenvolvedor, quero que os tipos internos do empacotador
   (`domain/nesting.ts`) continuem exatamente como estão — nunca tiveram
   par em `shared/types/` e não se qualificam pelo critério do ADR-0005.
8. Como desenvolvedor, quero que os comentários de `domain/nesting.ts`,
   `domain/plan.ts` e dos services que hoje citam `ProjectEntity`/
   `PieceEntity`/`SheetEntity`/`PlanEntity` por nome sejam atualizados para
   os nomes novos (`Project`/`Piece`/`Sheet`/`Plan`), para não referenciar
   tipos que deixaram de existir.
9. Como desenvolvedor, quero que `npm run typecheck` seja o mecanismo que
   aponta todo import quebrado depois de apagar os arquivos de `domain/` e
   `responses/`, em vez de caçar manualmente cada call site.
10. Como desenvolvedor, quero confirmar manualmente no app rodando
    (`npm run dev:movel`) que nada quebrou — criar projeto, cadastrar peça e
    chapa, gerar plano, ver a prancheta, imprimir/exportar PNG e PDF,
    alternar tema, fazer backup e restaurar — já que esta rodada não
    adiciona teste automatizado novo.
11. Como desenvolvedor, quero que nenhuma mudança desta rodada seja visível
    ao usuário final do app — é refactor puro de tipos internos.
12. Como desenvolvedor, quero que o ADR-0005 seja atualizado ao final,
    marcando `meu-movel-planejado` como auditado e registrando as
    exceções confirmadas (as funções de tema e o caso novo do
    `PlanInput`).

## Implementation Decisions

- Colapsar, em qualquer ordem — diferente do `git-dlog` (onde
  `domain/repo.ts` importava `PullRequestEntity`/`RepoRemoteEntity` de
  `domain/pullRequest.ts`), nenhum dos cinco pares depende de outro aqui:
  Projeto, Peça, Chapa e a árvore de Plano não se referenciam entre si nos
  arquivos de `domain/` — o próprio comentário de `domain/plan.ts` é
  explícito ("nada aqui aponta para `PieceEntity` nem para `SheetEntity`") —
  e `ThemeMode` é isolado. Ordem sugerida nas issues, só para acompanhar a
  ordem das telas do app (README §1.1): Projeto → Peça → Chapa → Plano →
  Tema → atualização do ADR.
- Apagar `main/domain/project.ts`, `main/domain/piece.ts`,
  `main/domain/sheet.ts`.
- Apagar `main/controllers/responses/project.response.ts`,
  `piece.response.ts`, `sheet.response.ts`, `plan.response.ts` (os cinco
  mappers de `plan.response.ts` — `placementToResponse`,
  `plannedSheetToResponse`, `shortfallToResponse`, `deficitToResponse`,
  `planToResponse` — eram cópia 1:1 pura, confirmado lendo o arquivo).
- Nos repositórios (`projectsRepository.ts`, `piecesRepository.ts`,
  `sheetsRepository.ts`, `plansRepository.ts`): `rowToX` (e, no caso do
  plano, `rowToPlacement`/`rowToShortfall`/`rowToDeficit`/
  `listPlannedSheets`) e todos os métodos do repositório trocam a
  assinatura de retorno de `XEntity` para `X`, importado de
  `@shared/types/<entidade>`. A conversão dentro de `rowToX`
  (snake_case→camelCase) não muda; `PlacementRow.rotated` (0/1→boolean em
  `rowToPlacement`) também não muda.
- `plansRepository.ts` especificamente: `replaceForProject` continua
  recebendo `PlanInput` (que permanece em `domain/plan.ts`) e passa a
  devolver `Plan`. `PlanRow`, `PlannedSheetRow`, `PlacementRow`,
  `ShortfallRow` (fronteira do banco) não mudam.
- `domain/plan.ts`: depois do colapso, o arquivo fica só com
  `export type PlanInput = Omit<Plan, 'id' | 'projectId' | 'generatedAt'>`,
  importando `Plan` de `@shared/types/plan`. O comentário de topo do
  arquivo é reescrito para explicar por que ele sobrevive (ver Solution).
- `domain/theme.ts`: remover `export type ThemeModeEntity = 'light' |
  'dark'`. `isThemeModeEntity` → `isThemeMode`; `resolveThemeMode` mantém o
  nome. Ambas passam a usar `ThemeMode` importado de
  `@shared/types/theme`.
- Nos controllers (`projectsController.ts`, `piecesController.ts`,
  `sheetsController.ts`, `plansController.ts`): remover os imports e
  chamadas de `projectToResponse`, `pieceToResponse`, `sheetToResponse`,
  `planToResponse` — o retorno do service já é o tipo final.
- Nos services correspondentes (`projectsService.ts`, `piecesService.ts`,
  `sheetsService.ts`, `plansService.ts`, `settingsService.ts`): trocar o
  tipo de retorno/parâmetro de `XEntity` para `X`, ajustando o import.
  `piecesService.ts` importa hoje tanto `PieceEntity` quanto
  `ProjectEntity` (o segundo só para o parâmetro de `assertFits`); os dois
  trocam.
- `infra/gateways/system/themeMode.ts`: `Record<ThemeModeEntity, string>`
  e as três assinaturas de `ThemeModeGateway`/`ThemeModeSystemGateway`
  trocam `ThemeModeEntity` por `ThemeMode`.
- `main/index.ts`: `createWindow(mode: ThemeModeEntity)` e o import de
  `domain/theme.ts` trocam para `ThemeMode`.
- `domain/nesting.ts`: nenhum import muda — o arquivo não importa nenhum
  dos cinco tipos que colapsam, só os cita em comentário. Atualizar esses
  comentários (linhas que mencionam `PieceEntity`, `ProjectEntity`,
  `SheetEntity`, `PlanEntity` por nome) para os nomes novos.
- `domain/nesting.test.ts` e `domain/planSnapshot.test.ts`: confirmado por
  leitura que nenhum dos dois importa `PieceEntity`/`SheetEntity`/
  `ProjectEntity`/`PlanEntity` — só os tipos que `nesting.ts` declara
  (`CuttingPlanEntity`, `PackablePieceEntity`, etc.), que não mudam.
  Nenhuma alteração esperada nesses dois arquivos; usar `npm test` para
  confirmar.
- Sem mudança de vocabulário de domínio — `CONTEXT.md` do
  meu-movel-planejado não muda.
- Sem teste automatizado novo — mesmo padrão dos três apps já migrados:
  `typecheck` + `lint` + `test` (suíte de lógica pura, que não toca
  `Entity`/`Response`) + QA manual documentada como pendente por limitação
  de sandbox (sem `xvfb`/driver para Electron).

## Out of Scope

- Colapsar a fronteira `Row` ↔ tipo do banco.
- Colapsar os tipos internos do empacotador (`CuttingPlanEntity` e
  companhia, em `domain/nesting.ts`) — nunca tiveram par em
  `shared/types/`, não se qualificam pelo critério do ADR-0005.
- Mover `PlanInput` para `shared/types/plan.ts` — decisão explícita de
  mantê-lo em `domain/plan.ts` (ver Solution).
- Introduzir teste de repository/service com banco real.
- Qualquer mudança de comportamento visível ao usuário final do app.
- Criar ADR novo — a atualização é no ADR-0005 existente.

## Further Notes

Investigação: leitura direta de `main/domain/{project,piece,sheet,plan,
theme,nesting}.ts`, `shared/types/{project,piece,sheet,plan,theme,
rectangle}.ts`, `controllers/responses/{project,piece,sheet,plan}.
response.ts`, `controllers/{projects,pieces,sheets,plans}Controller.ts`,
`infra/database/repositories/{projects,pieces,sheets,plans,settings}
Repository.ts`, `services/{projects,pieces,sheets,plans,settings}
Service.ts`, `infra/gateways/system/themeMode.ts` e `main/index.ts`, mais
grep por todo call site de cada `XEntity`. Confirmou os quatro pares
nomeados pelo ADR-0005 como idênticos hoje, achou o quinto (`ThemeMode`, já
esperado pelo padrão dos outros três apps) e achou o caso novo do
`PlanInput`.

Esta spec deve virar tickets de implementação em
`.scratch/meu-movel-planejado-colapso-tipos/issues/`, seguindo a numeração
`NN-<slug>.md` a partir de `01`.
