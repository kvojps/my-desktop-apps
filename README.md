# my-desktop-apps

Monorepo dos aplicativos desktop (Electron + React + TypeScript), gerenciado com **npm workspaces**.

## Apps

| App                                   | Diretório               | Product Name | Versão |
| ------------------------------------- | ----------------------- | ------------ | ------ |
| [Meu Dinheiro](apps/meu-dinheiro-app) | `apps/meu-dinheiro-app` | Meu Dinheiro | 2.0.0  |
| [Meu Negócio](apps/meu-negocio-app)   | `apps/meu-negocio-app`  | Meu Negócio  | 1.1.0  |
| [Git Dlog](apps/git-dlog)             | `apps/git-dlog`         | Git Dlog     | 2.0.0  |

Cada app segue a mesma estrutura: `src/main` (processo principal), `src/preload`,
`src/renderer` (React) e `src/shared` (tipos e contratos de IPC compartilhados entre
main e renderer do **mesmo** app).

## Convenções

Os três apps compartilham as mesmas decisões de arquitetura. Ao mexer em um,
vale conferir se o padrão continua valendo para os outros dois.

**Erros.** `src/shared/errors/appError.ts` é idêntico nos três: define os códigos
de falha, o texto que o usuário lê e o par `encodeAppError`/`decodeAppError`. O
IPC do Electron só preserva a _mensagem_ de um erro, então o main codifica o
código dentro dela e o renderer decodifica.

- No main, todo handler é registrado com o `handle` de `src/main/ipc/handle.ts`,
  nunca com `ipcMain.handle` direto — é ele que passa qualquer falha por
  `toIpcError` antes de devolvê-la.
- Erro com mensagem escrita para o usuário é `AppError`; erro inesperado é
  `Error` cru e vira uma descrição genérica classificada por `classifyError`.
- No renderer, o texto exibido sai sempre de `describeAppError`.

**Banco.** SQLite em WAL com `foreign_keys = ON`. `connection.ts` tem o `SCHEMA`
(instalações novas), `initDb`, `getDb` e `getDbPath`; `migrations.ts` tem a lista
numerada de migrações, aplicada uma única vez por banco e gravada em
`PRAGMA user_version`. Bancos já instalados começam em `user_version = 0`, então
toda migração precisa ser idempotente e nenhum `id` publicado pode ser reordenado
ou reescrito.

**Nomes na fronteira.** O banco é snake_case e para nele. Tudo que atravessa o
IPC — tipos de domínio em `src/shared/types/`, payloads e schemas zod — é
camelCase, e a conversão acontece num único lugar: a função `rowToX` do
repositório, que também traduz o 0/1 do SQLite para booleano. Nenhum objeto que
sai de um repositório carrega chave snake_case.

Uma exceção deliberada: o backup exporta e importa as linhas cruas das tabelas,
então o arquivo de backup é snake_case. É o que mantém os backups antigos
importáveis.

**IPC.** Canais em `src/shared/ipc/channels.ts`, contrato tipado em
`src/shared/ipc/api.ts`, implementação no preload. Toda entrada passa por zod
(`parseOrThrow`) e todo id por `parseId`.

**Renderer.** `HashRouter`, MUI com tema em `src/renderer/src/theme`, imports por
alias (`@/` e `@shared/`) sempre que saírem da própria pasta.

- `api/client.ts` é uma fachada tipada com um método por operação. `window.api`
  não aparece em nenhum outro arquivo.
- Domínio consumido por mais de uma tela vira context em `contexts/`, com um
  hook fino em `hooks/<domínio>/` que só o repassa. Estado de uma tela só
  continua no próprio hook da tela. Quem altera um domínio de fora do context
  precisa chamar o `reload` dele.
- Avisos pelo `useSnackbar`: `showSnackbar` para mensagem própria, `showError`
  para erro vindo do IPC. As mensagens entram numa fila, uma por vez.
- Falha de carregamento de tela usa `components/ErrorState`, que oferece tentar
  de novo e abrir a pasta de dados.
- `pages/<tela>/components/` guarda os componentes de uma tela só; o que serve a
  mais de uma sobe para `components/`.
- Ícones vêm de `@mui/icons-material`. Não há conjunto de SVG próprio.
- `utils/date.ts` para datas, `utils/format.ts` para moeda, números e texto. A
  mesma função tem o mesmo nome nos três apps (`formatCurrency`, `formatDate`,
  `formatDateTime`).
- O schema zod de um formulário fica ao lado da lógica desse formulário — junto
  do hook, onde a lógica está num hook; junto dos componentes, onde ela está nos
  componentes.

**Dev.** `electron-vite` define `ELECTRON_RENDERER_URL` ao subir o dev server; é
essa a variável que o `main/index.ts` testa para escolher entre `loadURL` e
`loadFile`.

## Setup

Um único install na raiz cobre todos os apps:

```bash
npm install
```

## Comandos

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

## Configuração compartilhada

Ficam na raiz e valem para todos os apps:

- `.prettierrc.json` / `.prettierignore`
- `eslint.config.mjs`
- `tsconfig.base.json` — cada app tem um `tsconfig.json` que faz `extends` dele e
  declara apenas os seus `paths` (`@shared/*`, `@/*`)
- `.gitignore`
- devDependencies do toolchain (eslint, prettier, typescript)

Fica em cada app (é específico por app):

- `electron.vite.config.ts` — usa `__dirname` para resolver os aliases
- `package.json` — deps de runtime, config do `electron-builder`, versão do Electron
- `build/icon.ico` e `resources/icon.png`
