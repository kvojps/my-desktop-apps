Status: aberto

# Meu Dinheiro: componentes deixam de ser pasta

Primeiro ticket da effort e o mais barato: movimentação pura, nenhuma mudança de
comportamento. Se algum hunk não for renomeação de arquivo ou troca de import, o
escopo vazou.

Deriva da `spec.md` desta effort (decisões #5 e #6). O padrão está no `README.md`
§2.4 e no ADR-0004; o que os tickets 03 e 04 já provaram está no `## Já provado` da
spec e não se reabre aqui.

## Componentes deixam de ser pasta

As 15 pastas `components/<Nome>/index.tsx` sem vizinho viram `components/<Nome>.tsx`:
`ActionsMenu`, `AppSnackbar`, `CategoryTag`, `ConfirmDialog`, `DataTable`,
`EmptyState`, `ErrorState`, `FileUploadButton`, `IconTile`, `Layout`, `Modal`,
`PageHeader`, `Pagination`, `StatCard`, `StatusChip`.

Com `moduleResolution: "Bundler"` (`tsconfig.base.json`), `@/components/<Nome>`
resolve tanto para `<Nome>.tsx` quanto para `<Nome>/index.tsx` — nenhum import muda, o
diff é movimentação pura. `components/Layout` sobe um nível ao deixar de ser pasta:
conferir que ele não importa `routes` (nem nada) por relativo que passe a resolver
fora de `src/` — foi o caso que os tickets 03 e 04 acharam no Dlog e no Negócio. O
Dinheiro só tem um `from '../'` no renderer inteiro (tratado abaixo), então não deve
haver, mas conferir.

## O único `from '../'` vira alias

`pages/month-detail/components/ItemActionDialogs.tsx` importa `../hooks/useItemActions`.
Passa a `@/pages/month-detail/hooks/useItemActions`. É a forma dupla dos tickets 03 e
04: componente em `components/` que precisa do `hooks/` da própria tela usa alias, não
relativo. Depois disso o renderer fica sem nenhum `from '../…'`.

## Como verificar

- `npm run typecheck`, `npm run lint`
- `npm run vitest`
- `npm run build -w meu-dinheiro-app` — o build prova a resolução de
  `@/components/<Nome>` pelo Vite, não só o `tsc`
- `npm run format` — que o `importOrder` do `.prettierrc.json` não reordena nada
  inesperado
- `git diff --stat`: só renomeação de arquivo e um import. Qualquer hunk de lógica é
  erro de escopo.

## Não fazer

- Não promover, quebrar ou renomear componente nenhum.
- Não tocar em `pages/month-detail/components/expenseColumns.tsx` /
  `incomeColumns.tsx`: têm JSX, ficam em `components/` pelo precedente do ticket 04.
- Não mexer em schema zod (ticket 02) nem em `theme/` (ticket 03).
