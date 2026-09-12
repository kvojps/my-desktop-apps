# AGENTS.md

Monorepo npm workspaces com quatro apps Electron + React + TypeScript
(`meu-dinheiro-app`, `meu-negocio-app`, `git-dlog`, `meu-movel-planejado`). Cada
um é independente e tem
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
- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/)
  e são escritos em inglês, independente do idioma da conversa.

## Comandos

```bash
npm install                  # um só install na raiz cobre todos os apps
npm run dev:dinheiro         # dev:negocio, dev:dlog, dev:movel
npm run typecheck            # tsc --noEmit em todos
npm run lint
npm run format
npm test                     # vitest: lógica pura dos quatro apps
npm run build                # build de produção dos quatro
```

Ao terminar uma alteração, rode `npm run typecheck`, `npm run lint` e `npm test`.

## Agent skills

As skills versionadas ficam espelhadas em `.claude/skills/` (Claude Code) e
`.agents/skills/` (harness estilo Codex); as duas árvores são byte-a-byte
idênticas e mantidas pela ferramenta de skills — não editar à mão. O manifesto é
`skills-lock.json` na raiz.

### Issue tracker

Issues e specs vivem como markdown em `.scratch/<feature>/` neste repo — não há
fluxo de GitHub Issues. Ver [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).
Ao resolver uma issue, atualize a linha `Status:` no arquivo correspondente antes
de encerrar a tarefa e marque os itens do checklist que foram resolvidos.

### Domain docs

Multi-context: `CONTEXT-MAP.md` na raiz apontando para o `CONTEXT.md` de cada
app; ADRs do monorepo em `docs/adr/`, ADRs de app em `apps/<app>/docs/adr/`.
Ver [`docs/agents/domain.md`](docs/agents/domain.md).
