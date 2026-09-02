Status: aberto
Blocked by: 02

# Git Dlog: conformar o renderer

Primeiro app a rodar o padrão. É o menor e o mais limpo dos quatro — três telas, oito
componentes compartilhados, nenhuma pendência estrutural grave —, então ele valida o
**processo** com risco baixo. Não valida a regra inteira: não tem zod, nem `react-hook-form`,
nem gráfico. Isso é do ticket 04, e é por isso que ele não é opcional.

Nenhuma mudança de comportamento é esperada. Se algum hunk não for movimentação ou import, o
escopo vazou.

## Componentes deixam de ser pasta

Nove pastas em `apps/git-dlog/src/renderer/src/components/`, cada uma com um único
`index.tsx`: `AppSnackbar`, `ConfirmDialog`, `DataTable`, `EmptyState`, `ErrorState`,
`Layout`, `Modal`, `PageHeader`, `StatusChip`. Viram `<Nome>.tsx`.

**Nenhum import muda** — `@/components/DataTable` resolve para o arquivo do mesmo jeito que
resolvia para a pasta (`moduleResolution: "Bundler"`). O diff é renomeação pura.

## `hooks/scanPaths/` → `hooks/scan-paths/`

Casing. Duas referências a atualizar (`pages/directories/DirectoriesPage.tsx` e
`pages/repos/ReposPage.tsx`).

## `utils/pullRequest.ts` se desfaz

O módulo mistura três coisas e nenhuma delas pertence a `utils/` como o padrão agora o define.

- **Seletores puros** — `getOpenPrs`, `getCurrentBranchPr`, `needsAction`. Consumidos só pela
  tela de repositórios (`ReposPage.tsx`, `RepoCard.tsx`, `PullRequestList.tsx`). Descem para
  `pages/repos/utils/`.
- **`openExternal`** — não é seletor, são três linhas guardando `api.openExternal` contra url
  vazia, e é o que fazia o módulo importar o `api`. A guarda pertence à fachada: absorver em
  `api/client.ts` e os três call sites (`RepoCard.tsx`, `PullRequestList.tsx`,
  `SettingsPage.tsx`) passam a chamar `api.openExternal` direto. Some o módulo que era
  seletor e chamador de IPC ao mesmo tempo.
- **`countPrsNeedingAction` e `countOpenPrs`** — **não têm nenhum consumidor**. Código morto;
  apagar. Se alguma tela precisar de contagem depois, ela nasce onde for usada.

Reparar que era `openExternal` que fazia o módulo ser "usado por duas telas" — o que sobra é
de uma tela só, e por isso desce. É a regra de promoção funcionando ao contrário, que é o
caso que ela precisa cobrir.

## `App.tsx` passa a usar alias

Ele importa `./routes`, `./pages/…`, `./components/Layout` e `./contexts/…` — todos saem da
própria pasta, então o §2.4 pede `@/`. Vale nos quatro apps; aqui é o único arquivo do Dlog
fora da regra.

## `PullRequestList.tsx` ganha o nome do que exporta

O arquivo exporta `PullRequestRow` e nenhum `PullRequestList` existe. Renomear o arquivo para
`PullRequestRow.tsx` e ajustar o import em `RepoCard.tsx`. Renomear o arquivo, não o export:
o componente renderiza uma linha de PR, e é `RepoCard` que faz a lista.

## Como verificar

- `npm run typecheck` e `npm run lint` limpos.
- `npm run format` sem diff inesperado — se aparecer reordenação estranha, o `importOrder` do
  ticket 02 está incompleto.
- `npm run dev:dlog`: abrir Diretórios, Repositórios e Configurações, alternar tema, rodar uma
  varredura, abrir um PR no navegador (é o caminho do `openExternal` que mudou de casa).
- `git diff --stat`: só renomeação e import. Exceções esperadas, e só elas: a guarda dentro de
  `api/client.ts` e a remoção das duas funções mortas.

## Não fazer

Não quebrar `RepoCard.tsx` (459 linhas) — tamanho de arquivo não é assunto desta effort. Não
tocar na pendência do design system §2.1 (`DataTableColumn<T>` ainda declara `align`, e a
coluna de ações é declarada por `DirectoriesPage.tsx` em vez de pertencer ao componente): é
bug de componente, tem dono próprio, e misturar com movimentação de arquivo tira a
propriedade que torna este ticket verificável.
