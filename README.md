# my-desktop-apps

Monorepo dos meus aplicativos desktop, gerenciado com **npm workspaces**. Cada app
é um Electron + React + TypeScript independente, com banco SQLite local, sem
servidor e sem conta de usuário: tudo roda e fica na máquina de quem instalou.

Os três compartilham o mesmo desenho — mesmas camadas, mesmo tratamento de erro,
mesmas convenções de nome — de modo que mexer em um seja suficiente para entender
os outros dois. O que não é compartilhado é código: cada app tem o seu próprio
`src/shared`, e a raiz do monorepo só concentra toolchain e configuração.

## 1. Apps

| App                                   | Diretório               | O que faz                                                                                     |
| ------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| [Meu Dinheiro](apps/meu-dinheiro-app) | `apps/meu-dinheiro-app` | Finanças pessoais por mês: entradas, despesas, contas bancárias, categorias, recibos e backup |
| [Meu Negócio](apps/meu-negocio-app)   | `apps/meu-negocio-app`  | Gestão de produtos, pedidos e vendas, com estoque e relatórios                                |
| [Git Dlog](apps/git-dlog)             | `apps/git-dlog`         | Varre pastas locais em busca de repositórios git e acompanha seus PRs via `gh` e `glab`       |

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

- **`db/`** — SQLite (`better-sqlite3`) em modo WAL com `foreign_keys = ON`.
  `connection.ts` guarda o `SCHEMA` usado em instalações novas, mais `initDb`,
  `getDb` e `getDbPath`; `migrations.ts` guarda a lista numerada de migrações,
  aplicada uma única vez por banco e registrada em `PRAGMA user_version`. Bancos
  já instalados começam em `user_version = 0`, então **toda migração precisa ser
  idempotente** e nenhum `id` já publicado pode ser reordenado ou reescrito. Cada
  domínio tem um repositório (`productsRepository.ts`, `monthsRepository.ts`, …)
  e é o único lugar que escreve SQL.
- **`ipc/`** — `registerIpc.ts` registra os handlers e `handle.ts` embrulha o
  `ipcMain.handle`. Nenhum handler usa `ipcMain.handle` direto, e é essa
  exclusividade que dá ao `handle` as duas responsabilidades que ele tem: passar
  qualquer falha por `toIpcError` antes de devolvê-la, garantindo que o renderer
  nunca receba um erro sem código; e, quando um canal de **escrita** termina bem,
  disparar `notifyDataChanged()` — o evento que mantém as telas em dia.
  Escrita é definido por exclusão: `READ_ONLY_CHANNELS`, em
  `shared/ipc/channels.ts`, enumera as **leituras**, e todo canal fora dela
  avisa. A lista é das leituras de propósito — esquecer de classificar um canal
  novo custa uma recarga a mais, nunca um valor velho na tela.
- **`schemas/`** — schemas zod por domínio. Toda entrada vinda do renderer passa
  por `parseOrThrow` e todo id por `parseId`, porque o preload é código do próprio
  app mas o contrato de tipos não sobrevive em runtime.
- **`errors/`** — `AppError` (erro com mensagem já escrita para o usuário) e
  `toIpcError`. Erro inesperado continua sendo um `Error` cru e é classificado por
  `classifyError` numa descrição genérica; a distinção é o que evita vazar detalhe
  técnico na tela.
- **`utils/`** e pastas de domínio — `git/` e `pr/` no Git Dlog, `files/` no Meu
  Dinheiro. Integração com o mundo externo (processos, sistema de arquivos) fica
  fora dos repositórios.

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
anatomia de uma tela — é comum aos três e está em
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
  mesma função tem o mesmo nome nos três apps (`formatCurrency`, `formatDate`,
  `formatDateTime`).
- **Formulários** — `react-hook-form` com zod; o schema fica ao lado da lógica do
  formulário: junto do hook, quando a lógica está num hook; junto dos componentes,
  quando está neles.
- **Ícones** — sempre `@mui/icons-material`. Não há conjunto de SVG próprio.

### 2.5 Nomes na fronteira

O banco é snake_case e para nele. Tudo que atravessa o IPC — tipos em
`shared/types/`, payloads e schemas zod — é camelCase, e a conversão acontece num
único lugar: a função `rowToX` do repositório, que também traduz o 0/1 do SQLite
para booleano. Nenhum objeto que sai de um repositório carrega chave snake_case.

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

npm run dist:dinheiro    # gera o instalador Windows (NSIS)
npm run dist:negocio
npm run dist:dlog

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
