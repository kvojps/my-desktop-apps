Status: aberto
Blocked by: 01

# Meu Dinheiro: schema zod para as pastas de domínio

Dinheiro é o único dos quatro apps com schema zod em
`pages/*/components/formSchemas.ts`, e no plural. O §2.4 (revogando a regra
condicional) manda `<domínio>Schema.ts`, singular, junto do hook. Nenhuma mudança de
comportamento: o mesmo schema, com os mesmos campos e mensagens, noutro arquivo.

Deriva da `spec.md` desta effort (decisões #1 e #2).

## `pages/settings/components/formSchemas.ts` se desfaz

Quatro schemas, quatro domínios, cada um para a pasta do hook que já existe:

- `bankAccountFormSchema` + `BankAccountFormValues` →
  `hooks/bank-accounts/bankAccountSchema.ts`
- `categoryFormSchema` + `CategoryFormValues` → `hooks/categories/categorySchema.ts`
- `defaultExpenseFormSchema` + `DefaultExpenseFormValues` →
  `hooks/default-expenses/defaultExpenseSchema.ts`
- `defaultIncomeFormSchema` + `DefaultIncomeFormValues` →
  `hooks/default-incomes/defaultIncomeSchema.ts`

Os helpers privados (`optionalNumberField`, `optionalDayField`) acompanham o schema
que os usa; se mais de um domínio precisar do mesmo helper, ele é módulo puro de
`utils/` (charter do §2.4). Os quatro formulários (`BankAccountForm`, `CategoryForm`,
`DefaultExpenseForm`, `DefaultIncomeForm`) importam `@/hooks/<domínio>/<domínio>Schema`.

## `pages/month-detail/components/formSchemas.ts` se desfaz

Despesa e entrada são domínio de uma tela só — não há `hooks/expenses/` nem
`hooks/incomes/` no topo, e a lógica de mutação vive em
`pages/month-detail/hooks/useItemActions.ts`. O schema fica junto do hook da tela:

- `expenseFormSchema` + `ExpenseFormValues` **e** `payFormSchema` + `PayFormValues` →
  `pages/month-detail/hooks/expenseSchema.ts`
- `incomeFormSchema` + `IncomeFormValues` **e** `receiveFormSchema` +
  `ReceiveFormValues` → `pages/month-detail/hooks/incomeSchema.ts`

Pagar é ação de despesa e receber é ação de entrada — daí `pay`/`receive` dobrarem
nos arquivos de despesa/entrada em vez de ganharem arquivo próprio. Os seis diálogos
importam `@/pages/month-detail/hooks/<x>Schema`: `AddExpenseDialog`,
`EditExpenseDialog`, `PayDialog` → `expenseSchema`; `AddIncomeDialog`,
`EditIncomeDialog`, `ReceiveDialog` → `incomeSchema`.

## Como verificar

- `npm run typecheck`, `npm run lint`, `npm run vitest`
- `npm run build -w meu-dinheiro-app`, `npm run format`
- `git diff`: só movimentação de schema e troca de import. A forma do schema não muda
  — mesmos campos, mesmas mensagens, mesmo `…FormValues` inferido.

## Não fazer

- Não unificar os schemas de `pay`/`receive` com os de `expense`/`income` além de
  morarem no mesmo arquivo.
- Não criar `hooks/expenses/` nem `hooks/incomes/` no topo — é domínio de uma tela.
- Não mexer no `theme/` (ticket 03).
