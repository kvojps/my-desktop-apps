Status: resolvido
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

### 2026-08-27 — implementado

Oito arquivos novos em `domain/` (`month.ts`, `expense.ts`, `income.ts`, `defaultExpense.ts`,
`defaultIncome.ts`, `bankAccount.ts`, `category.ts`, `theme.ts`) — `type` anêmico, sufixo
`Entity`, sem classe, nome no singular. O comentário-cabeçalho que explica o sufixo mora em
`domain/expense.ts` (o caso "estruturalmente idêntica" mais puro, como `product.ts` no
`meu-negocio-app`); os demais apontam para ele. `MonthEntity` traz os 12 campos de totais
opcionais; `MonthDetailEntity` = `MonthEntity & { expenses: ExpenseEntity[]; incomes:
IncomeEntity[] }`. `CategoryTotalEntity` documenta `categoryId` nulo = "sem categoria".
`domain/theme.ts` levou `ThemeModeEntity`, `THEME_MODE_KEY`, `isThemeModeEntity` e a função
pura `resolveThemeMode(stored, systemPrefersDark)` — assinatura verbatim do ticket, espelhando
`domain/settings.ts` do `git-dlog` / `domain/theme.ts` do `meu-negocio-app`.

`monthNames.ts` já estava em `domain/` (ticket 02) — intocado.

**Mapeamento.** Todo `rowToX` dos sete repositórios de entidade passou a devolver a `*Entity`;
nenhum `import` de `@shared/types/*` restou sob `infra/database/`. `buildMonthDetail(monthRow,
expenseRows, incomeRows)` nasceu como função de módulo em `monthsRepository.ts` — um mapper por
nó-objeto (`rowToMonth` / `rowToExpense` / `rowToIncome`), sem travessia estrutural do objeto
inteiro (README §2.5); `findById` compõe por ele. `setupRepository.runSetup` passou a tipar
`MonthEntity[]`. `categoriesRepository.totalsForYear` ganhou um `rowToCategoryTotal` nomeado no
lugar do `.map((row) => ({...}))` inline — alinhado ao padrão `rowToX` dos irmãos (achado da
revisão).

**Vazamento de `snake_case` fechado.** `expensesRepository.getForFilename` devolvia
`ExpenseRow & { month_label }` cru; passou a devolver `{ name; monthLabel } | null` — as duas
strings que o call site usa, em camelCase. `registerIpc.ts` acompanha (`expense?.monthLabel`).
É o único ponto que não é `rowToX` puro, mas a Verificação ("Nenhuma chave `snake_case` sai de
um repositório") é explícita; o `expensesService.pay()` que reescreve esse caminho é o ticket
05 (decisão 10/14c).

**Gateway de tema.** `themeMode.ts` passou a falar `ThemeModeEntity` (era `ThemeMode` de
`@shared`), como todo `infra/`. A decisão pura saiu para `domain/theme.ts`; o que resta no
gateway é a leitura de `getAppSetting` + `nativeTheme` e o cache de sessão. A função de boot
foi renomeada `resolveThemeMode(db)` → `resolveInitialThemeMode(db)` para não colidir com a
pura homônima do domínio (achado da revisão); `index.ts` acompanha. `THEME_MODE_KEY` deixou de
ser re-exportado pelo gateway — `registerIpc.ts` importa direto de `domain/theme` (tira o
middle-man apontado na revisão).

**O que NÃO entrou** (como o ticket pede): nenhum `xToResponse` — `registerIpc.ts` ainda
devolve a entidade direto e o `tsc` não reclama (iguais em runtime); nenhuma regra migrou
(competência, rollover, cascata, débito/crédito, batch parcial seguem onde estavam);
`backupRepository.ts` intocado; gateways devolvem primitivos.

### Divergências registradas, não resolvidas aqui

- **Entidade atravessa o IPC sem mapper.** `registerIpc.ts` chama `repos.*` direto dentro de
  `handle(...)`; nenhuma delas quebra hoje porque `*Entity` é estruturalmente igual ao tipo de
  `@shared`. O `controllers/responses/` é o ticket 06.
- **`index.ts` ainda declara `ThemeMode` de `@shared`** sobre o que `resolveInitialThemeMode`
  devolve como `ThemeModeEntity` — carve-out de bootstrap (ADR-0002), sem controller a
  atravessar. O split do gateway em objeto (`apply`/`currentMode`/`systemPrefersDark`), como no
  `meu-negocio-app`, é trabalho de camada de sistema do ticket 05.
- **Nomes herdados de `@shared/types/month`**: `totalIncomes`/`receivedIncomes` (contagens) vs
  `totalIncome`/`receivedIncome` (dinheiro) — a semântica anda na pluralização. Recriados
  verbatim no `domain/` novo; a spec manda comportamento idêntico, então só fica o registro.

### Verificação

`npm run typecheck` (4 apps) exit 0. `npm run lint` 0 erros (2 warnings pré-existentes de
`react-hooks/exhaustive-deps` em `OrdersContext.tsx`/`ProductsContext.tsx` do `meu-negocio-app`,
não tocados). `npm run test` 187 passando (21 arquivos). `npx electron-vite build` do
`meu-dinheiro-app`: main, preload e renderer compilam e resolvem. Sem teste novo (ADR-0002;
`channels.test.ts` já existia). `/code-review` (Standards + Spec, sub-agents paralelos): 0
violações duras; achados cosméticos aplicados (doc de `expense.ts`/`income.ts`,
`rowToCategoryTotal`, rename do gateway, middle-man de `THEME_MODE_KEY`).
