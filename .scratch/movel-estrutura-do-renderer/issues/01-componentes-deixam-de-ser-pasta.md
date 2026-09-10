Status: aberto

# Meu Móvel Planejado: componentes deixam de ser pasta

Primeiro ticket da effort: movimentação pura, nenhuma mudança de comportamento. Se
algum hunk não for renomeação de arquivo ou troca de import, o escopo vazou.

Deriva da `spec.md` desta effort (decisão #3). O padrão está no `README.md` §2.4 e no
ADR-0004; o que os tickets 03 e 04 já provaram está no `## Já provado` da spec e não
se reabre aqui.

## Componentes deixam de ser pasta

As 12 pastas `components/<Nome>/index.tsx` sem vizinho viram `components/<Nome>.tsx`:
`ActionsMenu`, `AppSnackbar`, `ConfirmDialog`, `DataTable`, `EmptyState`,
`ErrorState`, `IconTile`, `Layout`, `Modal`, `PageHeader`, `Pagination`, `StatCard`.

Com `moduleResolution: "Bundler"` (`tsconfig.base.json`), `@/components/<Nome>`
resolve para os dois formatos — nenhum import muda, o diff é movimentação pura.
`components/Layout` sobe um nível ao deixar de ser pasta: conferir se importa `routes`
(ou qualquer coisa) por relativo que passe a resolver fora de `src/` — foi o caso que
os tickets 03 e 04 acharam no Dlog e no Negócio (`'../../routes'` no `Layout`,
`NotFoundPage` e uma `*Page`). Se houver, vira `@/routes` (ou o alias que valha) no
mesmo ticket.

## Como verificar

- `npm run typecheck`, `npm run lint`, `npm run vitest`
- `npm run build -w meu-movel-planejado` — o build prova a resolução de
  `@/components/<Nome>` pelo Vite, não só o `tsc`
- `npm run format`
- `git diff --stat`: só renomeação de arquivo (e, no máximo, o import de `routes` do
  `Layout`). Qualquer hunk de lógica é erro de escopo.

## Não fazer

- Não tocar em `pages/plan/` — é o ticket 02.
- Não promover nem demover nada.
- Não varrer os outros imports relativos aqui (o Móvel parte de 24; a varredura é do
  ticket 02, depois que a reorganização do `plan/` curar a maioria).
