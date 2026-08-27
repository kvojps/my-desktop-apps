Status: aberto
Blocked by: 03

# Meu Dinheiro: entidades de persistência e de gateway

Um ticket só, como o ticket 04 do `meu-negocio-app` — divisível se inchar (months é o nó mais
pesado; se ele sozinho passar do razoável, sai em ticket próprio). `domain/` ganha os `type`
anêmicos e as funções puras; os `rowToX` passam a devolvê-los.

## Entidades

Todas: `type` + funções puras, **sem classe**, sufixo `Entity`, nome no singular
(`domain/month.ts`, não `months.ts`).

| Arquivo | Conteúdo |
|---|---|
| `domain/month.ts` | `MonthEntity` (campos do mês + os 12 campos de totais opcionais que o `listMonths` agrega) e `MonthDetailEntity` (`MonthEntity` + `expenses: ExpenseEntity[]` + `incomes: IncomeEntity[]`) |
| `domain/expense.ts` | `ExpenseEntity` (+ campos de join opcionais: nome da conta, nome e cor da categoria) |
| `domain/income.ts` | `IncomeEntity` (+ nome da conta) |
| `domain/defaultExpense.ts` | `DefaultExpenseEntity` |
| `domain/defaultIncome.ts` | `DefaultIncomeEntity` |
| `domain/bankAccount.ts` | `BankAccountEntity` |
| `domain/category.ts` | `CategoryEntity` e `CategoryTotalEntity` (linha do relatório de Histórico; `categoryId` nulo = "sem categoria") |
| `domain/theme.ts` | `ThemeModeEntity`, `THEME_MODE_KEY`, e a função pura `resolveThemeMode(stored: string | null, systemPrefersDark: boolean): ThemeModeEntity` — extraída de `themeMode.ts` (precedente `meu-negocio-app`) |
| `domain/monthNames.ts` | já movido no ticket 02; hospeda `MONTH_NAMES`, `monthLabel`, `formatDueDate` — vocabulário, não configuração |

## Mapeamento

`rowToX` (no repositório) passa a traduzir `snake_case` → `camelCase` e `0/1` → `boolean`
devolvendo a **entidade**, não o tipo de `@shared`. Nenhuma chave `snake_case` sai de um
repositório.

`MonthDetailEntity` é aninhada: **um mapper por nó-objeto** (README §2.5) —
`rowToMonth` / `rowToExpense` / `rowToIncome`, e `buildMonthDetail(monthRow, expenseRows,
incomeRows)` compõe. Sem atravessar o objeto inteiro por identidade estrutural.

O sufixo `Entity` existe para o `tsc` quebrar quando alguém troca `MonthEntity` por `Month`
(de `@shared`) no mapper do controller — as duas formas são estruturalmente iguais hoje.

## O que NÃO entra aqui

- **Nenhum `xToResponse`.** A conversão entidade → tipo de `@shared` é no controller, ticket
  06. Aqui `registerIpc.ts` ainda devolve a entidade direto (são iguais em runtime); o `tsc`
  não reclama até o controller tipar a saída.
- **Nenhuma regra migra** — ticket 05.
- **Gateways devolvem primitivos.** `receipts.ts` devolve o nome do arquivo (string);
  export/import de backup são formas planas. Não há "entidade de gateway" a separar como no
  `git-dlog` (que tinha a árvore `RepoScanResult`).

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`. `npm run dev:dinheiro`:
comportamento idêntico.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisão 11).
