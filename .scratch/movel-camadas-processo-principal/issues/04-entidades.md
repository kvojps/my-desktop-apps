Status: resolvido
Blocked by: 03

# Meu Móvel Planejado: entidades

`domain/` ganha o vocabulário que as camadas trocam entre si. Entidade anêmica — `type` mais
funções puras, sem classe —, sufixo `Entity`, nome de arquivo no singular, pasta **plana**, como
nos três apps migrados.

Mesma forma dos tickets 06/07 do `git-dlog` e do 04 do `meu-negocio-app` e do `meu-dinheiro-app`
(que colapsaram persistência e gateway num ticket só, como este).

## Os arquivos

| Arquivo | Conteúdo |
|---|---|
| `domain/project.ts` | `ProjectEntity` |
| `domain/piece.ts` | `PieceEntity` |
| `domain/sheet.ts` | `SheetEntity` |
| `domain/plan.ts` | `PlanEntity`, `PlannedSheetEntity`, `PlacementEntity`, `ShortfallEntity`, `DeficitEntity` |
| `domain/theme.ts` | `resolveThemeMode` (a regra "o que está no banco, ou o do sistema"), fechando o `TODO` do ticket 02 |
| `domain/backupFileName.ts` | já movido no 02; sem mudança |
| `domain/planExportFileName.ts` | já movido no 02; sem mudança |

`domain/nesting.ts`, `domain/maxRects.ts` e `domain/planSnapshot.ts` **não nascem aqui** — são do
ticket 07, junto com o canal e o renderer, porque a mudança de pasta só pode acontecer no mesmo
commit que reaponta quem os chama (spec, decisão 9).

## O `rowToX`

A primeira travessia do README §2.5 (`row → entity`, no repositório) já existe neste app e está
correta: `rowToProject`, `rowToPiece`, `rowToPlan` e companhia já traduzem `snake_case` para
camelCase e o 0/1 do SQLite para booleano. O que muda é o **tipo de saída**: eles passam a
devolver `XEntity` em vez do tipo de `shared/types/`.

`rowToPlan` continua sendo a exceção que precisa do `db` (`plansRepository.ts:132-136`): o plano
é uma árvore em quatro tabelas e não há `PlanEntity` sem as chapas planejadas. O comentário que
explica isso acompanha.

## Backup não ganha entidade

O app exporta e importa **linhas cruas** das tabelas, com as chaves em `snake_case`. É decisão
registrada em `apps/meu-movel-planejado/docs/adr/0002-backup-como-linhas-cruas.md`, e o README
§2.5 a nomeia como a exceção deliberada da fronteira. `BackupRow` e `BackupFile` continuam sendo
o que são; inventar entidade ali seria desfazer a decisão que mantém backups antigos
importáveis.

## A entidade que difere do response

Este app tem a que o `git-dlog` e o `meu-dinheiro-app` não tinham, e ela chega no ticket 07:
`CuttingPlanEntity` — o resultado do empacotador — carrega `pieceId` e `sheetId`, e
`planSnapshot` os **descarta de propósito** antes de gravar, porque plano é snapshot e uma peça
excluída amanhã não pode apagar a folha que já foi impressa e levada à bancada
(`planSnapshot.ts:3-8`).

É o caso exato para o qual o README §2.5 foi escrito — o `stock_applied` deste app. Vale
registrar aqui, no ticket das entidades, para que o 07 não o descubra do zero.

## O que NÃO entra aqui

- Regra saindo de repositório para service — ticket 05.
- `xToResponse` e `controllers/responses/` — ticket 06. Neste ticket a entidade ainda atravessa
  o IPC inteira, como hoje.
- O empacotador e o snapshot — ticket 07.

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`, `npx electron-vite build` no app.
Nenhum arquivo de `domain/` importa `better-sqlite3` nem `electron`. `domain/` é plana — nenhuma
subpasta, como nos três apps migrados.

`npm run dev:movel`: tudo igual — este ticket é de tipos, e o que o renderer recebe não mudou.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 11 e 14).

### Resolvido

Cinco arquivos novos em `domain/`, pasta plana, forma dos três apps migrados —
`type` anêmico, sufixo `Entity`, sem import de `@shared/types/` por valor:

- `project.ts` (`ProjectEntity`), `piece.ts` (`PieceEntity`), `sheet.ts`
  (`SheetEntity`).
- `plan.ts` (`PlanEntity`, `PlannedSheetEntity`, `PlacementEntity`,
  `ShortfallEntity`, `DeficitEntity`). `PlanSheet` virou `PlannedSheetEntity` —
  não `PlanSheetEntity` — para o nome carregar a diferença entre a chapa
  planejada (resultado) e a `SheetEntity` disponível; o cabeçalho do arquivo
  explica. `referenceSheet` de `DeficitEntity` ficou inline como
  `{ lengthTenthsMm; widthTenthsMm } | null` (= `Rectangle | null` do shared).
- `theme.ts` (`ThemeModeEntity`, `THEME_MODE_KEY`, `isThemeModeEntity`,
  `resolveThemeMode`), espelho byte a byte do `domain/theme.ts` de
  `meu-negocio-app`/`meu-dinheiro-app` (decisão 10 do ticket: "mesma forma").

`rowToProject`/`rowToPiece`/`rowToSheet` e toda a família de `rowToX` de
`plansRepository` (`rowToPlan`, `rowToPlacement`, `rowToShortfall`,
`rowToDeficit`, `listPlannedSheets`, …) passaram a devolver `XEntity` em vez do
tipo de `shared/types/`; os verbos e os `const x: XEntity` locais acompanham. Os
`*Input` e as constantes continuam vindo do shared. `settingsRepository` não tem
`rowToX` e não foi tocado.

`rowToPlan` mantém o `db` (`plansRepository.ts`): a árvore em quatro tabelas não
tem `PlanEntity` sem as chapas planejadas. Comentário atualizado (`Plan` →
`PlanEntity`).

`TODO(ticket 04)` de `infra/gateways/system/themeMode.ts` fechado: a regra "o que
está no banco, ou o do sistema" saiu para `domain/theme.ts`; o gateway faz as
duas leituras (`settings` + `nativeTheme.shouldUseDarkColors`) e delega a
decisão. `THEME_MODE_KEY` foi para `domain/theme.ts` também, então o gateway
deixou de importá-lo de `services/settingsService.ts` (a aresta provisória que o
ticket 02 previu). `settingsService` importa a chave de `domain/theme.ts`. O
`let current`, `getThemeMode` e `applyThemeMode` do gateway continuam como
estavam — o redesenho para o objeto `themeMode` (como nos irmãos) é do ticket 05.

Backup não ganhou entidade (`backupRepository.ts` intacto). Nada de renderer,
`shared` ou controller; nenhum `xToResponse`; nenhum teste novo (decisão 3).

Verificação: `typecheck` (4 apps, 0 erros), `lint` (0 erros; 2 warnings
pré-existentes em `meu-negocio-app`), `test` (187 passando), `electron-vite
build` do app (main, preload, renderer sem erro). `domain/` plana, nenhum arquivo
de `domain/` importa `better-sqlite3` nem `electron`.

`/code-review` (Standards + Spec em paralelo): Spec limpo; Standards sem violação
dura — quatro notas de julgamento, todas "note only" ou dissolvidas pelo ticket
05 (o alias `resolveThemeModeRule` no gateway, `ThemeModeEntity` à frente dos
consumidores). A nota sobre o cabeçalho de `plan.ts` subestimar o rename de
`PlanSheet` foi aplicada.
