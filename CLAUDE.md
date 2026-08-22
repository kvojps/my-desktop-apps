# CLAUDE.md

Monorepo npm workspaces com três apps Electron + React + TypeScript
(`meu-dinheiro-app`, `meu-negocio-app`, `git-dlog`). Cada um é independente e tem
o seu próprio `src/shared` — **os apps não compartilham código de propósito**.

## Antes de mexer

- **Qualquer alteração de UI** — tema, cor, componente, layout, tela nova,
  carregamento, estado vazio, foco, janela do Electron:
  leia [`docs/design-system.md`](docs/design-system.md) primeiro. Ele é normativo
  e é a própria referência: não há app canônico, e divergência entre o documento
  e o código é bug do código.
- **Arquitetura, camadas, IPC, banco, convenções de nome:** [`README.md`](README.md), §2.
- **Regra de negócio e vocabulário de domínio de um app específico:** o `README.md`
  daquele app — é ele que documenta o produto, não a arquitetura.

## Estrutura dos READMEs de app

Título → parágrafo de pitch → screenshot → `## 1. Funcionalidades`, com
`### 1.1 Manual de uso` sempre primeiro, seguido das demais seções do produto.
Mesmo nível de heading do README raiz (título é o único `#`).

## Regras que não se descobrem lendo o código

- Cor da paleta usada como **texto** precisa de par por modo; nenhuma cor única
  passa em AA nos dois. `warning` e `text.disabled` são só preenchimento, nunca
  texto. Detalhes e medições em
  `docs/design-system.md`, §1.
- A preferência de tema pertence ao banco, não ao `localStorage`: o processo main
  precisa dela para pintar a janela antes de existir renderer (§5.1).
- Migração de banco precisa ser **idempotente**, e nenhum `id` já publicado pode
  ser reordenado ou reescrito — bancos já instalados começam em `user_version = 0`.
- Nenhum handler usa `ipcMain.handle` direto: sempre o wrapper `handle`, que passa
  a falha por `toIpcError`.
- SQL vive só nos repositórios de `main/db/`. `snake_case` para no banco; a
  conversão para camelCase acontece no `rowToX` do repositório.

## Comandos

```bash
npm install                  # um só install na raiz cobre os três apps
npm run dev:dinheiro         # dev:negocio, dev:dlog
npm run typecheck            # tsc --noEmit em todos
npm run lint
npm run format
```

Ao terminar uma alteração, rode `npm run typecheck` e `npm run lint`.

## Agent skills

### Issue tracker

Issues e specs vivem como markdown em `.scratch/<feature>/` neste repo — não há
fluxo de GitHub Issues. Ver [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Domain docs

Multi-context: `CONTEXT-MAP.md` na raiz apontando para o `CONTEXT.md` de cada
app; ADRs do monorepo em `docs/adr/`, ADRs de app em `apps/<app>/docs/adr/`.
Ver [`docs/agents/domain.md`](docs/agents/domain.md).
