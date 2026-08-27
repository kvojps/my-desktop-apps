Status: aberto
Blocked by: 01

# Meu Negócio: mover arquivos

Reposiciona a árvore de `src/main` para o esqueleto do README §2.2, sem mudar comportamento
nenhum. Espelha
`.scratch/camadas-processo-principal/issues/04-dlog-mover-arquivos.md`.

## O que fazer

| De | Para |
|---|---|
| `db/` | `infra/database/` (conexão, migrations, unit of work) + `infra/database/repositories/` |
| `ipc/`, `schemas/` | `controllers/` + `controllers/schemas/` |
| `errors/` | `utils/errors/` |
| `theme/` | `infra/gateways/system/` (moldura nativa/`nativeTheme`) — a parte de regra
  (`THEME_MODE_KEY`, persistência) fica para o ticket 5, junto com `settingsService.ts` |
| `utils/parseId.ts`, `utils/validate.ts` | ficam em `utils/`, sem mudar |

Sem `git/`, `pr/` nem `files/` neste app — não há pasta de domínio ad-hoc a redistribuir além
de `theme/`.

## Verificação

`npm run typecheck`, `npm run lint`, `npm run test`, `electron-vite build` do
`meu-negocio-app` — nenhum deve quebrar, é só reposicionamento de arquivo e ajuste de import.

## Comments
