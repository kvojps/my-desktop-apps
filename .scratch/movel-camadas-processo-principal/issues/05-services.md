Status: aberto
Blocked by: 04

# Meu Móvel Planejado: camada de serviço

A regra de negócio sai dos repositórios e do `registerIpc.ts` e passa a morar em `services/` —
mesma forma dos tickets 08 do `git-dlog` e 05 do `meu-negocio-app` e do `meu-dinheiro-app`. Cada
service é uma fábrica recebendo `Repositories` e os gateways de que precisa; **nenhum importa
`better-sqlite3` nem `electron`**. É aqui que `repos.transaction()` ganha os call sites reais.

## Services

### `projectsService`
- `list()`, `get(id)` — `get` devolve `null`, e não 404: projeto inexistente é uma tela com saída
  de volta para a lista, não erro (`projectsRepository.ts:44-48`, comentário preservado).
- `create(data)` — aplica `DEFAULT_KERF_TENTHS_MM`/`DEFAULT_TRIM_TENTHS_MM`.
- `update(id, data)`, `updateCuttingParams(id, data)` — `null` do repo vira `AppError(404)`.
- `delete(id)` — `repos.projects.delete(id)` devolve `boolean`; `false` vira `AppError(404)`.
  Continua lançando, como hoje: a lista da tela pode estar velha, e confirmar "Projeto excluído"
  sobre nada diria que o app fez algo que não fez.

### `piecesService`
- `list(projectId)`.
- `create(projectId, data)` / `update(id, data)` — **a régua da rejeição migra para cá**
  (`assertFitsSomeSheet`, hoje em `piecesRepository.ts:72-79`): carrega o projeto, carrega as
  chapas, chama `fitsAnySheet` de `@shared/nesting/fit` e lança `AppError(422,
  PIECE_DOES_NOT_FIT_MESSAGE)` quando não cabe. O 422 é deliberado — `classifyError` o traduz em
  `invalid-input`, o único código cuja mensagem chega inteira à tela.
- Projeto inexistente vira `AppError(404)` **antes** de abrir a transação. Sai de graça: o
  service já carregou o projeto para a régua. É o ganho de brinde da spec (decisão 17) — hoje o
  404 vem do `touchProject` lá dentro.
- `create`/`update`/`delete` abrem `repos.transaction(() => { repos.projects.touch(projectId);
  repos.pieces.…() })`. O carimbo e a escrita são uma transação só: carimbo antigo com peça nova
  é exatamente o estado em que o app diria que o plano está em dia quando não está.

### `sheetsService`
- Mesma forma, sem a régua de rejeição: `list`, `create`, `update`, `delete`, os três últimos
  compondo `touch` + escrita em `repos.transaction`.
- Nota: excluir uma chapa pode tornar rejeitada uma peça que foi aceita no cadastro. É por isso
  que o empacotador classifica de novo (`fit.ts:5-8`) — comportamento de hoje, preservado.

### `plansService`
- `get(projectId)` — `null` quando ninguém mandou gerar; é estado normal de projeto novo, não 404.
- `save(projectId, input)` — confere o projeto (`repos.projects.exists`, `AppError(404)`) e
  chama `repos.plans.replaceForProject` dentro de `repos.transaction`. **Este verbo é
  provisório**: o ticket 07 o substitui por `generate(projectId)`. Escrever `save` agora e
  trocá-lo depois é o preço de manter cada ticket com a árvore verde (spec, decisão 9).
- `print(window)` — pelo gateway `system/printing.ts`. Resolve com `false` quando o usuário
  cancela: cancelar é resposta, não falha.
- `exportPng(window, projectId, bytes)` / `exportPdf(window, projectId)` — a orquestração de
  `export/exportPlanFile.ts`: carrega projeto e plano (404 em cada), pede o nome sugerido a
  `domain/planExportFileName.ts`, abre o diálogo pelo gateway `system/dialogs.ts`, grava pelo
  `system/fileSystem.ts`. Cancelar volta como `ExportResult`, não como exceção. Os códigos
  próprios `export-failed` e `pdf-failed` sobrevivem: sem eles, um `EACCES` da pasta escolhida
  seria classificado como problema da pasta de dados do app.

**A janela nunca chega como `WebContents` cru.** O controller resolve com `windowFor(event)` e
passa ao service um handle de gateway; é o `system/printing.ts` que conhece `printToPDF` e
`webContents.print`. O service não importa `electron`.

### `backupService`
- Serve os quatro canais `data:*` (spec, decisão 16).
- `export(window)` — diálogo save → `repos.backup.exportRows()` → grava indentado pelo
  `fileSystem`. O arquivo é do usuário e fica no pen drive dele; legível é o que permite
  recuperar à mão o que o app não conseguir mais importar.
- `import(window)` — diálogo open → lê → `readBackupFile` (a conferência, com
  `BACKUP_REFUSAL_MESSAGES` e o `AppError(400)` que faz a mensagem própria chegar inteira à
  tela) → `repos.transaction(() => repos.backup.importRows(file))`. A promessa de "nada foi
  alterado" na recusa é o que torna a ação irreversível oferecível.
- `appInfo()` — versão pelo gateway `system/appInfo.ts` (não pelo `package.json` importado: em
  produção quem sabe a versão instalada é o Electron) e `dbPath` pelo `infra/database`.
- `openDataFolder()` — pelo `system/shell.ts`.

### `settingsService`
- Assume o tema, e o `RegisterIpcOptions.onThemeModeChange` **some** (spec, decisão 4).
- `setThemeMode(mode)` — grava via `repos.settings.set(THEME_MODE_KEY, mode)` e aplica pelo
  gateway `system/themeMode.ts`. É o que a closure do `index.ts` fazia.
- O `let current` de estado de módulo passa para o gateway, onde ele pertence: depois do boot,
  quem responde o modo é o `nativeTheme`, não o banco. Mesmo desenho que o `meu-negocio-app` e o
  `meu-dinheiro-app` chegaram, e o comentário de `themeMode.ts:20-32` (por que `resolveThemeMode`
  roda uma vez só) acompanha o gateway.

## Bootstrap

`index.ts` continua sendo o carve-out do ADR-0002 e **não passa a chamar service** — diferente
do `meu-dinheiro-app`, este app não tem operação de negócio no boot. O que muda:

- `registerIpcHandlers(db)` perde o segundo parâmetro.
- Para pintar a janela antes de existir renderer (design system §5.1), o `index.ts` monta
  `makeSettingsRepository(db)` **direto**, lê `THEME_MODE_KEY`, passa por `resolveThemeMode` de
  `domain/theme.ts` e aplica pelo gateway — antes de `createWindow`. É o precedente do
  `meu-dinheiro-app`, e é instância do carve-out, não princípio novo.
- A ordem do boot não muda: ler o banco → aplicar o tema → criar a janela.

## Os 404 que sobem

Sem mudança observável — as mensagens são as de hoje, e os deletes deste app já lançam
(diferente do `meu-negocio-app`, onde passaram a lançar):

| Hoje | Passa a ser |
|---|---|
| `getProjectOrThrow` (`projectsRepository.ts:54`) | `findById` → `null` → 404 no service |
| `touchProject` (`projectsRepository.ts:129`) | `touch` → `boolean` → 404 no service |
| `deleteProject` (`projectsRepository.ts:147`) | `delete` → `boolean` → 404 no service |
| `getPieceOrThrow` (`piecesRepository.ts:51`) | `findById` → `null` → 404 no service |
| `getSheetOrThrow` (`sheetsRepository.ts:49`) | `findById` → `null` → 404 no service |
| guard de `savePlan` (`plansRepository.ts:184`) | `repos.projects.exists` → 404 no service |
| `assertFitsSomeSheet` 422 (`piecesRepository.ts:78`) | regra do `piecesService` |
| `AppError(400)` de `insertRows` (`backupRepository.ts:86`) | fica — é recusa do **arquivo**, não do banco; sobe do repo pelo mesmo motivo de hoje |

## O que NÃO entra aqui

- Controllers, `parseOrThrow`, `xToResponse`, `handle` estreitado — ticket 06. `registerIpc.ts`
  continua como controller provisório (validação inline, saída como entidade), só que agora fala
  com services.
- O empacotador, `plans:generate` e o renderer — ticket 07.
- Teste novo — adiado (ADR-0002).

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`, `npx electron-vite build` no app.
`grep -rn "better-sqlite3\|from 'electron'" src/main/services` sem import de valor (tipo é
apagado pelo transform, então `import type` passa).

`npm run dev:movel`: cadastrar peça maior que qualquer chapa continua barrada com a mensagem
inteira na tela (o 422, agora vindo do service); excluir projeto que já não existe continua
dizendo que não existe; peça e chapa continuam movendo o carimbo do projeto (o aviso de plano
desatualizado aparece quando deve); imprimir, exportar PNG e PDF, exportar e importar backup,
alternar tema — todos iguais, inclusive a barra de título acompanhando o modo.

`/code-review` (Standards + Spec em paralelo) sem achados abertos.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 4, 15, 16, 17).
