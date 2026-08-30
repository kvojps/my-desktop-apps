Status: aberto

# Meu Móvel Planejado: mover arquivos

A reorganização mecânica de `src/main` para a árvore do README §2.2. **Só caminho de arquivo e
de import muda** — nenhuma assinatura, nenhum comportamento, nenhuma regra trocando de camada.
As camadas ganham as pastas; o conteúdo delas é trabalho dos tickets 03–07.

Mesma forma do ticket 04 do `git-dlog` e do 02 do `meu-negocio-app` e do `meu-dinheiro-app`.

## O mapa

| Hoje | Passa a viver em |
|---|---|
| `db/connection.ts`, `db/migrations.ts` | `infra/database/` |
| `db/{projects,pieces,sheets,plans,settings,backup}Repository.ts` | `infra/database/repositories/` |
| `ipc/registerIpc.ts`, `ipc/handle.ts`, `ipc/notifyDataChanged.ts`, `ipc/windowFor.ts` | `controllers/` |
| `schemas/*.schema.ts` | `controllers/schemas/` |
| `errors/{AppError,toIpcError,errorReason}.ts` | `utils/errors/` |
| `utils/{parseId,validate}.ts` | ficam onde estão |
| `backup/backupFile.ts` | `services/backupService.ts` |
| `backup/{backupRows,readBackupFile}.ts` (+ testes) | `infra/database/` |
| `backup/backupFileName.ts` (+ teste) | `domain/backupFileName.ts` |
| `export/exportPlanFile.ts` | `services/plansService.ts` |
| `export/planExportFileName.ts` (+ teste) | `domain/planExportFileName.ts` |
| `print/printDocument.ts` | `infra/gateways/system/printing.ts` |
| `theme/themeMode.ts` | parte em `infra/gateways/system/themeMode.ts`, parte em `services/settingsService.ts` |

`windowFor.ts` fica em `controllers/` — é onde os três apps migrados o têm, e faz sentido: ele
traduz um `IpcMainInvokeEvent`, que é objeto da borda.

`backupFileName` e `planExportFileName` vão para `domain/` pelo precedente de
`meu-dinheiro-app/domain/monthNames.ts`: regra pura de nomeação, que não é entidade e não
orquestra nada.

`readBackupFile` e `backupRows` ficam junto do banco, não em `controllers/schemas/`: eles
conferem um **arquivo**, não entrada de IPC. É o desenho que o `meu-dinheiro-app` chegou
(`parseBackupData` em `infra/database`).

## Os cinco testes

`backupFileName.test.ts`, `backupRows.test.ts`, `readBackupFile.test.ts`,
`planExportFileName.test.ts` e `backup.schema.test.ts` acompanham os seus módulos. Verificado:
**nenhum dos quatro sujeitos importa `@shared` por valor**, então a suíte da raiz continua
resolvendo tudo depois do move (o alias só morde no ticket 07). Só a profundidade dos caminhos
relativos muda.

## Divisão dentro de `theme/themeMode.ts`

O arquivo mistura três coisas. O corte é preparatório — o ticket 05 é que monta o
`settingsService` de verdade:

- `BACKGROUND`, `themeBackground`, `applyThemeMode`, `nativeTheme`, `BrowserWindow` →
  `infra/gateways/system/themeMode.ts`
- `THEME_MODE_KEY`, `getSetting`/`setSetting` → chamadores em `services/settingsService.ts`
- `resolveThemeMode` (a regra "o que está no banco, ou o do sistema") → `domain/theme.ts` no
  ticket 04; neste ticket pode ficar provisoriamente no gateway, com um `TODO` apontando o 04

O `let current` de estado de módulo e o `RegisterIpcOptions.onThemeModeChange` **continuam de pé
neste ticket** — quem os desmonta é o 05 (spec, decisão 4). Mover não é redesenhar.

## O que NÃO entra aqui

- `makeRepositories`/`transaction` — ticket 03.
- Entidades e `rowToX` — ticket 04.
- Qualquer regra saindo de repositório — ticket 05.
- `parseOrThrow`/`xToResponse` — ticket 06. `registerIpc.ts` continua fazendo as vezes de
  controller, com a validação inline que já tem.
- `shared/nesting/` e `shared/plan/` — ticket 07. Este ticket não toca `src/shared` nem
  `src/renderer`.

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test` (os cinco testes movidos passando),
`npx electron-vite build` no app. `npm run dev:movel`: criar projeto, cadastrar peça e chapa,
gerar plano, imprimir, exportar PNG e PDF, exportar e importar backup, alternar tema — tudo
igual a antes, porque nada além de caminho mudou.

`git diff --stat` deve ser quase inteiramente renomeações; um diff de conteúdo grande aqui é
sinal de que o ticket saiu do escopo.

Mecânico: **commit único** (spec, decisão 5).

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 3, 14, 15).
