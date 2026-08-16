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
