# my-desktop-apps

Monorepo dos meus aplicativos desktop, gerenciado com **npm workspaces**. Cada app
é um Electron + React + TypeScript independente, com banco SQLite local, sem
servidor e sem conta de usuário: tudo roda e fica na máquina de quem instalou.

Todos compartilham o mesmo desenho — mesmas camadas, mesmo tratamento de erro,
mesmas convenções de nome — de modo que mexer em um seja suficiente para entender
os outros. O que não é compartilhado é código: cada app tem o seu próprio
`src/shared`, e a raiz do monorepo só concentra toolchain e configuração.

## 1. Apps

| App                                             | Diretório                  | O que faz                                                                                          |
| ----------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| [Meu Dinheiro](apps/meu-dinheiro-app)           | `apps/meu-dinheiro-app`    | Finanças pessoais por mês: entradas, despesas, contas bancárias, categorias, recibos e backup      |
| [Meu Negócio](apps/meu-negocio-app)             | `apps/meu-negocio-app`     | Gestão de produtos, pedidos e vendas, com estoque e relatórios                                     |
| [Git Dlog](apps/git-dlog)                       | `apps/git-dlog`            | Varre pastas locais em busca de repositórios git e acompanha seus PRs via `gh` e `glab`            |
| [Meu Móvel Planejado](apps/meu-movel-planejado) | `apps/meu-movel-planejado` | Planeja o corte de chapas: distribui as peças de um serviço pelo estoque e diz o que falta comprar |

## 2. Decisões de arquitetura

Cada app tem quatro camadas: `src/main`, `src/preload`, `src/renderer` e
`src/shared`.

### 2.1 `src/shared` — o contrato entre main e renderer

Tipos de domínio (`types/`), canais de IPC (`ipc/channels.ts`), a interface
tipada da API (`ipc/api.ts`) e os erros de aplicação (`errors/appError.ts`).

É a única pasta importada pelos dois lados, e por isso não contém nada de
Electron nem de React — só tipos e funções puras. O `appError.ts` vive aqui
porque o código de falha precisa ter o mesmo significado nas duas pontas: ele
define os códigos, o texto que o usuário lê e o par
`encodeAppError`/`decodeAppError`. O IPC do Electron só preserva a _mensagem_ de
um erro, então o main codifica o código dentro dela e o renderer decodifica.

Cada app tem o seu `shared` — o nome não significa "compartilhado entre apps".

### 2.2 `src/main` — processo principal

Quatro camadas de fluxo — **controller**, **service**, **repositório** e
**gateway** —, mais `domain/` ao lado delas. A organização é horizontal, por
camada e não por feature, e o objetivo declarado é legibilidade estrutural: que
a árvore de pastas conte sozinha como o app funciona. Ver
[`docs/adr/0002-camadas-do-processo-principal.md`](docs/adr/0002-camadas-do-processo-principal.md).

```
src/main/
  index.ts                     bootstrap — fora das camadas
  domain/                      entidades: scanPath.ts, repo.ts, pullRequest.ts, …
  controllers/
    registerIpc.ts             compõe as camadas e registra
    handle.ts  notifyDataChanged.ts  windowFor.ts
    scanPathsController.ts  reposController.ts  prsController.ts  systemController.ts
    schemas/                   zod de entrada
    responses/                 mappers de saída (`xToResponse`)
  services/
    scanPathsService.ts  reposService.ts  prsService.ts  settingsService.ts  systemService.ts
  infra/
    database/
      connection.ts            SCHEMA, initDb
      migrations.ts
      index.ts                 makeRepositories(db) + transaction()
      repositories/            reposRepository.ts, settingsRepository.ts, …
    gateways/
      git/  pr/  system/
  utils/
    errors/                    AppError, toIpcError, errorReason
    concurrency.ts  parseId.ts  validate.ts
```

- **`domain/`** — as entidades: o vocabulário que as camadas trocam entre si.
  Entidade é anêmica — `type` mais funções puras, sem classe —, tem sufixo
  `Entity` e nome no singular. `domain/` não fica acima nem abaixo de ninguém:
  não é camada de fluxo, e por isso é a única pasta que qualquer camada pode
  importar.
- **`controllers/`** — a borda do IPC. `registerIpc.ts` compõe as camadas e
  registra os canais; `handle.ts` embrulha o `ipcMain.handle` e só aceita canal
  que esteja em `IPC_CHANNELS`. Nenhum handler usa `ipcMain.handle` direto, e é
  essa exclusividade que dá ao `handle` as duas responsabilidades que ele tem:
  passar qualquer falha por `toIpcError` antes de devolvê-la, garantindo que o
  renderer nunca receba um erro sem código; e, quando um canal de **escrita**
  termina bem, disparar `notifyDataChanged()` — o evento que mantém as telas em
  dia. Escrita é definido por exclusão:
  `READ_ONLY_CHANNELS`, em `shared/ipc/channels.ts`, enumera os canais que **não
  alteram dado nenhum**, e todo canal fora dela avisa. Quase todos são leituras,
  mas nem todos — imprimir não lê nem grava, e mesmo assim não pode avisar: a
  recarga remontaria o documento no instante em que o diálogo de impressão abre.
  A lista é dos inofensivos de propósito — esquecer de classificar um canal novo
  custa uma recarga a mais, nunca um valor velho na tela.

  O controller também é o lugar da validação e da saída: toda entrada vinda do
  renderer passa por `parseOrThrow` com os schemas zod de
  `controllers/schemas/`, e todo id por `parseId` — porque o preload é código do
  próprio app, mas o contrato de tipos não sobrevive em runtime. O que chega ao
  service é um `Request` já tipado; a entidade que volta vira `Response` (§2.5).
  `Request` e `Response` são os tipos de `src/shared` — o contrato de IPC _é_ o
  contrato do controller.

- **`services/`** — a regra de negócio, e o único lugar dela. O service recebe
  entrada já validada e confia nela, orquestra repositórios e gateways, e é
  quem decide que "não encontrado" é um `AppError`. Não conhece Electron, não
  conhece zod e não importa `better-sqlite3`. Regra de domínio mora aqui mesmo
  quando é função pura que não toca banco nem disco — o critério é o papel dela,
  não o que ela usa, e isso revoga um precedente que estava valendo no Meu Móvel
  Planejado: ver
  [`docs/adr/0003-logica-de-dominio-no-main.md`](docs/adr/0003-logica-de-dominio-no-main.md).
- **`infra/database/`** — SQLite (`better-sqlite3`) em modo WAL com
  `foreign_keys = ON`. `connection.ts` guarda o `SCHEMA` usado em instalações
  novas e o `initDb` que abre a conexão. Não há getter de módulo: a conexão desce
  por parâmetro do `index.ts` até `makeRepositories(db)`, e um `getDb()` global
  seria o atalho para alcançar o banco por fora da unidade de trabalho.
  `migrations.ts` guarda a lista numerada de migrações, aplicada uma única vez
  por banco e registrada em `PRAGMA user_version`. Bancos já instalados começam
  em `user_version = 0`, então **toda migração precisa ser idempotente** e nenhum
  `id` já publicado pode ser reordenado ou reescrito. O `index.ts` da pasta é a
  unidade de trabalho: `makeRepositories(db)` devolve os repositórios prontos mais um
  `transaction()`, e é só isso que o service recebe. Cada domínio tem um
  repositório em `repositories/` (`reposRepository.ts`, `ordersRepository.ts`,
  …), é o único lugar que escreve SQL, expõe `list` / `findById` / `create` /
  `update` / `delete`, e **devolve `null` em vez de lançar**.
- **`infra/gateways/`** — o mundo externo: processos (`git/`, `pr/`), sistema de
  arquivos, diálogos nativos, impressão, `safeStorage`, moldura da janela. É
  irmã de `repositories/` e é chamada pelo service pelos mesmos motivos — tudo
  que sai do processo passa por uma pasta só, e o service continua testável sem
  nada disso.
- **`utils/`** — transversal, não é camada: `errors/` com `AppError` (erro com
  mensagem já escrita para o usuário, mais um `code?: AppErrorCode` opcional
  para quem lança já conhecer a classificação — é o que impede uma recusa que
  não é de dado nenhum de chegar à tela como "falha ao ler os dados locais") e
  `toIpcError`, mais o `errorReason` que arranca o texto técnico de um `catch`
  (que pega qualquer coisa, não só `Error`), mais os helpers de `parseId`,
  `validate` e concorrência. Erro inesperado continua sendo um `Error` cru e é
  classificado por `classifyError` numa descrição genérica; a distinção é o que
  evita vazar detalhe técnico na tela.
- **`index.ts`** — bootstrap, e o único carve-out: janelas, ciclo de vida do
  app e a leitura do tema direto do repositório, antes de existir camada para
  atravessar (§5.1 do design system, e o ADR-0002).

Nenhuma camada é pulável, nem quando o service só repassa uma linha ao
repositório. As pastas de domínio ad-hoc que o §2.2 sancionava antes — `git/` e
`pr/` no Git Dlog, `files/` no Meu Dinheiro — e as que nunca chegou a mencionar
têm destino fixo:

| Pasta antiga        | Onde passa a viver                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `db/`               | `infra/database/` e `infra/database/repositories/`                                                         |
| `ipc/`, `schemas/`  | `controllers/` e `controllers/schemas/`                                                                    |
| `errors/`           | `utils/errors/`                                                                                            |
| `git/`, `pr/`       | `infra/gateways/git/` e `infra/gateways/pr/` — o que é orquestração (`prService.ts`) sobe para `services/` |
| `files/`            | `infra/gateways/`                                                                                          |
| `theme/`            | `infra/gateways/system/` (moldura nativa e `nativeTheme`) mais `services/settingsService.ts`               |
| `backup/`           | `services/backupService.ts`; diálogo e disco em `infra/gateways/`                                          |
| `export/`, `print/` | `services/` mais `infra/gateways/`                                                                         |
| `constants/`        | `domain/` — `monthLabel` é vocabulário, não configuração                                                   |

A migração é por app, na ordem `git-dlog` → `meu-negocio-app` → os dois
restantes. Enquanto ela não termina, app que ainda não foi convertido está
divergindo deste documento, e a divergência é bug do código.

### 2.3 `src/preload` — a ponte

Um arquivo só, que implementa a interface `ElectronApi` de `@shared/ipc/api` com
`ipcRenderer.invoke` e a expõe por `contextBridge`. `contextIsolation` fica ligado
e o renderer não tem acesso a Node: tudo que ele pode fazer está enumerado aqui.

Uma única entrada não é `invoke`: `onDataChanged`, que assina um `ipcRenderer.on`
e devolve a função de cancelamento. Ela existe porque o main precisa poder falar
primeiro — nem toda mudança nasce de uma ação da tela, e o mês corrente criado no
foco da janela é o exemplo. Ver
[`docs/adr/0001-invalidacao-por-broadcast.md`](docs/adr/0001-invalidacao-por-broadcast.md).

### 2.4 `src/renderer` — React

`HashRouter` (necessário no `file://` do build), MUI com tema em `theme/`, imports
por alias (`@/` e `@shared/`) sempre que saírem da própria pasta.

O padrão visual — paleta, raios, tipografia, vocabulário de componentes e a
anatomia de uma tela — é comum a todos e está em
[`docs/design-system.md`](docs/design-system.md). Como código não é compartilhado
entre os apps, é aquele documento que faz o papel do pacote `ui` que não existe:
alteração de UI começa por ele.

- **`api/client.ts`** — fachada tipada com um método por operação. É o único
  arquivo que conhece `window.api` e o formato do erro que atravessa o IPC; o
  resto do renderer chama métodos comuns.
- **`contexts/`** — domínio consumido por mais de uma tela vira context, com um
  hook fino em `hooks/<domínio>/` que só o repassa. Estado que interessa a uma
  tela só continua no hook da própria tela. **A invalidação é automática**:
  quem guarda dado assina `useDataChanged(reload)` e o main avisa a cada
  gravação, de modo que nenhuma mutação precisa lembrar de recarregar nada.
  O context expõe `reload` para esse aviso e `retry` para o `ErrorState` (a
  distinção entre os dois está no design system, §5.3).
- **`components/`** vs **`pages/<tela>/components/`** — o componente nasce na
  pasta da tela e só sobe para `components/` quando uma segunda tela precisa dele.
- **Avisos e erros** — `useSnackbar` com `showSnackbar` para mensagem própria e
  `showError` para erro vindo do IPC, numa fila de uma mensagem por vez. Falha ao
  carregar uma tela usa `components/ErrorState`, que oferece tentar de novo e
  abrir a pasta de dados. O texto exibido sai sempre de `describeAppError`.
- **`utils/`** — `date.ts` para datas, `format.ts` para moeda, números e texto. A
  mesma função tem o mesmo nome em todos os apps (`formatCurrency`, `formatDate`,
  `formatDateTime`).
- **Formulários** — `react-hook-form` com zod; o schema fica ao lado da lógica do
  formulário: junto do hook, quando a lógica está num hook; junto dos componentes,
  quando está neles.
- **Ícones** — sempre `@mui/icons-material`. Não há conjunto de SVG próprio.

### 2.5 Nomes na fronteira

O banco é snake_case e para nele. Tudo que atravessa o IPC — tipos em
`shared/types/`, payloads e schemas zod — é camelCase. Entre uma ponta e outra
há **duas travessias**, cada uma com o seu mapeamento explícito:

- **`row → entity`, no repositório.** A função `rowToX` traduz snake_case para
  camelCase e o 0/1 do SQLite para booleano. Nenhum objeto que sai de um
  repositório carrega chave snake_case.
- **`entity → response`, no controller.** A função `xToResponse` monta o tipo de
  `shared/types/` que o renderer vai receber, e vive em `controllers/responses/`
  — irmã de `schemas/`, uma pasta para cada sentido da fronteira. Nenhuma
  entidade atravessa o IPC inteira só porque já estava pronta. Há um mapper por
  nó que é **objeto**: união de literais atravessa por atribuição direta, porque
  aí o `tsc` já quebra sozinho quando uma variante nova aparece de um lado só —
  com objeto ele não quebra, e o mapper é a única trava.

O segundo mapeamento não existe por legibilidade — mapper trivial não se lê.
Existe para que nada chegue ao renderer sem alguém ter decidido que chega. O
caso que motivou a regra é o `stock_applied` do Meu Negócio: é escrituração
interna, fica fora do `OrderItem` de propósito, e hoje quem defende isso é um
comentário. Com a segunda travessia, vira estrutura — o campo só sai se alguém
escrever a linha que o coloca no response.

Uma exceção deliberada: o backup exporta e importa as linhas cruas das tabelas,
então o arquivo de backup é snake_case — é o que mantém backups antigos
importáveis.

### 2.6 Dev vs. produção

`electron-vite` define `ELECTRON_RENDERER_URL` ao subir o dev server, e é essa a
variável que o `main/index.ts` testa para escolher entre `loadURL` e `loadFile`.
A distribuição é feita com `electron-builder` (NSIS, Windows).

## 3. Guia de desenvolvimento

### 3.1 Install

Um único install na raiz cobre todos os apps. O `postinstall` baixa o Electron e
recompila o `better-sqlite3` para a ABI dele:

```bash
npm install
```

### 3.2 Comandos

Da raiz:

```bash
npm run dev:dinheiro     # roda o Meu Dinheiro em modo dev
npm run dev:negocio      # roda o Meu Negócio em modo dev
npm run dev:dlog         # roda o Git Dlog em modo dev
npm run dev:movel        # roda o Meu Móvel Planejado em modo dev

npm run dist:dinheiro    # gera o instalador Windows (NSIS)
npm run dist:negocio
npm run dist:dlog
npm run dist:movel

npm run build            # build de todos os apps
npm run typecheck        # tsc --noEmit em todos os apps
npm run lint             # eslint em todo o monorepo
npm run format           # prettier --write em todo o monorepo
npm run format:check
```

Para rodar qualquer script de um app específico:

```bash
npm run <script> -w <nome-do-app>
```

### 3.3 Configurações compartilhadas

Ficam na raiz e valem para todos os apps:

- `.prettierrc.json` / `.prettierignore`
- `eslint.config.mjs`
- `tsconfig.base.json` — cada app tem um `tsconfig.json` que faz `extends` dele e
  declara apenas os seus `paths` (`@shared/*`, `@/*`)
- `.gitignore`
- devDependencies do toolchain (eslint, prettier, typescript)

Fica em cada app, porque é específico dele:

- `electron.vite.config.ts` — usa `__dirname` para resolver os aliases
- `package.json` — deps de runtime, config do `electron-builder`, versão do Electron
- `build/icon.ico` e `resources/icon.png`
