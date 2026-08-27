Status: resolvido
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

As linhas da tabela foram executadas com `git mv`: 19 arquivos renomeados, marcados `R`/`RM`
no `git status`, histórico preservado. Fora deles só `index.ts` e `utils/validate.ts` mudaram,
e só em import — nenhuma assinatura, nenhum comportamento.

`theme/themeMode.ts` foi movido inteiro para `infra/gateways/system/themeMode.ts`, sem separar
a parte de regra (`THEME_MODE_KEY`, `resolveThemeMode`, `getThemeMode`, o `current` cacheado) da
parte de moldura nativa (`applyThemeMode`, `themeBackground`, `nativeTheme`). O ticket já avisa
que a parte de regra "fica para o ticket 5, junto com `settingsService.ts`" — ler isso como "não
faça o split agora" e não como "deixe a regra em outro lugar nesta ticket", porque separar as
duas metades exigiria inventar a interface de gateway que é o próprio trabalho do ticket 5/6
(comparar com o `infra/gateways/system/theme.ts` final do `git-dlog`, que só existe depois do
`settingsService.ts`). Fazer isso aqui seria decisão de desenho disfarçada de `git mv`.

Sem alias `@main`: o `tsconfig.json` do app só define `@shared/*` e `@/*`, e os três alvos do
electron-vite só aliasam `@shared`/`@`. Nada resolve para dentro de `src/main`, então os
repositórios que moveram dois níveis (`db/` → `infra/database/repositories/`) trocaram
`../errors/AppError` por `../../../utils/errors/AppError` — import relativo de três níveis,
resultado mecânico correto na ausência de alias.

Verificação: `typecheck` (0 erros), `lint` (0 erros, 2 warnings pré-existentes em
`OrdersContext.tsx`/`ProductsContext.tsx`, não tocados), `test` (8 passando), `electron-vite
build` do app — main, preload e renderer compilam e o bundle sobe sem erro de resolução.
`prettier --write` reordenou os imports quebrados em múltiplas linhas nos dois arquivos que
ganharam import mais longo (`registerIpc.ts`, `index.ts`).
