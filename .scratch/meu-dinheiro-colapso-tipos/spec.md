Status: ready-for-agent

# Meu Dinheiro — colapsar Domain Entity + Shared type quando idênticos

## Problem Statement

O `meu-dinheiro-app` (e, de forma idêntica, os outros 3 apps do monorepo)
mantém quatro camadas de tipo para a mesma entidade de domínio: `shared/types`
(contrato de IPC), schema+response no controller, `domain/` no processo main e
o tipo de linha (`Row`) no repositório. Investigação no código mostrou que,
para Despesa, Entrada, Conta bancária e Categoria, a camada `domain/` (Entity)
e a camada `shared/types` são **estruturalmente idênticas** — mesmos campos,
mesmos tipos — e o mapper `entity → response` no controller só copia valor por
valor, sem nenhuma transformação real. Isso é ceremônia mantida por convenção
documentada (README §2.5, ADR-0002), não um erro, mas o desenvolvedor quer
reduzir essa ceremônia nos casos em que ela não protege nada hoje.

## Solution

Colapsar `XEntity` (domain) e `X` (shared/types) num único tipo, que passa a
viver só em `shared/types/`, sempre que as duas formas forem hoje idênticas e
não houver (nem se preveja) campo que precise ser filtrado antes de atravessar
o IPC. O repositório (`rowToX`) passa a devolver esse tipo único diretamente;
o arquivo de `domain/` e o mapper trivial de `controllers/responses/` são
apagados; o controller consome o retorno do service sem mapear de novo.

Quando uma entidade colapsada precisar, no futuro, de um campo que não deve
sair pelo IPC, ela volta a se dividir em `Entity` + `Response` com mapper
explícito — o padrão de hoje continua disponível, só deixa de ser
obrigatório por padrão. Essa condição e o risco aceito (perda do aviso
automático do `tsc` quando isso acontecer) ficam registrados num ADR novo.

Piloto restrito ao `meu-dinheiro-app`, nas entidades já auditadas como
idênticas: Despesa (`Expense`), Entrada (`Income`), Conta bancária
(`BankAccount`) e Categoria (`Category`/`CategoryTotal`). A fronteira
`Row` (banco) não muda — permanece `interface XRow` + função `rowToX`
convertendo snake_case→camelCase e valores (ex. `is_paid` 0/1→boolean),
exatamente como hoje. Os schemas zod de `controllers/schemas/` também não
mudam — validam formas de entrada diferentes (create/update), não são a
mesma duplicação.

## User Stories

1. Como desenvolvedor do meu-dinheiro-app, quero um único tipo para Despesa
   entre domain e shared quando estruturalmente idênticos, para não manter
   duas declarações e um mapper que só copia campos.
2. Como desenvolvedor, quero o mesmo colapso para Entrada (Income).
3. Como desenvolvedor, quero o mesmo colapso para Conta bancária
   (BankAccount).
4. Como desenvolvedor, quero o mesmo colapso para Categoria (Category).
5. Como desenvolvedor, quero o mesmo colapso para a linha do relatório de
   Categoria (CategoryTotal).
6. Como desenvolvedor, quero que o repositório continue sendo o único lugar
   que converte snake_case do banco para camelCase e 0/1 para boolean, para a
   fronteira do banco continuar exatamente como está.
7. Como desenvolvedor, quero que os campos vindos de JOIN
   (`bankAccountName`, `categoryName`, `categoryColor`) continuem ausentes
   (não `undefined`) quando a consulta não faz o JOIN, preservando o
   comportamento que hoje é garantido pelo mapper de resposta.
8. Como desenvolvedor, quero que o controller pare de chamar um mapper
   trivial e use direto o retorno do service, reduzindo uma camada de
   indireção sem introduzir comportamento novo.
9. Como desenvolvedor, quero que `Month`/`MonthDetail` continue com seu
   próprio mapper — ele faz inclusão condicional real dos totais agregados
   opcionais — para não confundir "cópia pura" com "lógica de fato" e não
   colapsar algo que tem comportamento.
10. Como desenvolvedor, quero que `monthDetailToResponse` pare de chamar
    `.map(expenseToResponse)`/`.map(incomeToResponse)` e passe
    `entity.expenses`/`entity.incomes` direto, já que o repositório passa a
    entregar a forma final.
11. Como desenvolvedor, quero que o critério de quando colapsar (sem campo a
    filtrar) fique registrado num ADR novo, para outras entidades (neste ou
    em outros apps) saberem quando repetir o padrão e quando não.
12. Como desenvolvedor, quero que o novo ADR cite o caso `stock_applied` do
    `meu-negocio-app` como o cenário que esta simplificação não cobre, para
    ficar claro por que aquele app não entra neste piloto.
13. Como desenvolvedor, quero que o README (§2.2 e §2.5) deixe de descrever a
    duplicação Domain↔Shared como sempre obrigatória, para o código
    consolidado não divergir da documentação normativa.
14. Como desenvolvedor, quero que essa mudança fique restrita ao
    meu-dinheiro-app nesta rodada, para validar o padrão antes de replicar
    nos outros 3 apps.
15. Como desenvolvedor, quero que o `tsc` seja o mecanismo que aponta todo
    import quebrado depois de apagar os arquivos de `domain/` e
    `responses/`, em vez de caçar manualmente cada call site.
16. Como desenvolvedor, quero confirmar manualmente no app rodando (criar,
    editar, pagar e despagar uma Despesa; criar e editar uma Entrada; criar e
    editar uma Conta bancária; criar e editar uma Categoria; abrir o
    relatório de Histórico; abrir o detalhe de um Mês) que nada quebrou, já
    que esta rodada não adiciona teste automatizado novo.
17. Como desenvolvedor, quero que os schemas zod de `controllers/schemas/`
    não sejam tocados, porque validam formas de entrada diferentes
    (create/update), não duplicam o mesmo tipo que colapsou.
18. Como desenvolvedor, quero que a `interface XRow` do banco continue
    existindo exatamente como está hoje — colapsar essa fronteira foi
    considerado e descartado nesta rodada por ser uma mudança de escopo
    maior (tocaria todo SQL ou introduziria conversão implícita).
19. Como desenvolvedor, quero que nenhuma mudança desta rodada seja visível
    ao usuário final do app — é refactor puro de tipos internos.

## Implementation Decisions

- Colapsar `XEntity` (`main/domain/`) + `X` (`shared/types/`) num tipo só
  para: Despesa, Entrada, Conta bancária, Categoria e CategoryTotal, no
  `meu-dinheiro-app`.
- Apagar `main/domain/expense.ts`, `main/domain/income.ts`,
  `main/domain/bankAccount.ts`, `main/domain/category.ts`.
- Apagar `main/controllers/responses/expense.response.ts`,
  `income.response.ts`, `bankAccount.response.ts`, `category.response.ts`
  (as funções `expenseToResponse`, `incomeToResponse`,
  `bankAccountToResponse`, `categoryToResponse`, `categoryTotalToResponse`
  eram cópias 1:1 puras — confirmado lendo os cinco arquivos).
- Nos repositórios (`expensesRepository.ts`, `incomesRepository.ts`,
  `bankAccountsRepository.ts`, `categoriesRepository.ts`): `rowToX` e todos
  os métodos do repositório (`findById`, `list*`, `create`, `update`,
  `delete`, `pay`, `unpay`, etc.) trocam a assinatura de retorno de `XEntity`
  para `X`, importado de `@shared/types/<entidade>`. A lógica de conversão
  dentro de `rowToX` (renomeação snake_case→camelCase, `is_paid` 0/1→boolean,
  campos condicionais de JOIN) não muda.
- Nos controllers (`expensesController.ts`, `incomesController.ts`,
  `bankAccountsController.ts`, `categoriesController.ts`,
  `reportsController.ts`): remover os imports e chamadas de `xToResponse` —
  o retorno do service já é o tipo final.
- Nos services correspondentes: trocar o tipo de retorno de `XEntity` para
  `X`, ajustando o import. Usar o `tsc` (após apagar os arquivos de
  `domain/`) para encontrar todos os call sites que precisam de ajuste, em
  vez de mapear manualmente.
- Em `main/domain/month.ts`: `MonthDetailEntity.expenses` e
  `MonthDetailEntity.incomes` passam a referenciar `Expense[]`/`Income[]` de
  `@shared/types/expense`/`@shared/types/income`, em vez de
  `ExpenseEntity[]`/`IncomeEntity[]` de `./expense`/`./income` (arquivos que
  deixam de existir). `MonthEntity`/`Month` **não colapsam** — o mapper
  `monthToResponse` mantém a inclusão condicional dos 12 campos de totais
  opcionais, que é lógica real, não cópia.
- Em `main/controllers/responses/month.response.ts`: `monthDetailToResponse`
  para de chamar `.map(expenseToResponse)`/`.map(incomeToResponse)` — passa
  `entity.expenses`/`entity.incomes` direto.
- Critério a documentar no ADR novo: colapsar apenas quando não há, nem se
  prevê, campo que deva parar antes do IPC. A partir do momento em que
  existir esse campo, a entidade volta a se dividir em `Entity` + `Response`
  com mapper explícito — o padrão de hoje segue disponível para esse caso.
- ADR novo: `docs/adr/0005-colapso-domain-shared-quando-identico.md`, no
  mesmo formato dos ADRs existentes (problema, decisão, alternativas
  consideradas, consequências). Referencia o ADR-0002 (seção "Nenhuma camada
  é pulável") e nomeia explicitamente o risco aceito: perda do aviso
  automático do `tsc` quando um campo interno futuro precisar parar de
  atravessar o IPC numa entidade colapsada. Cita o caso `stock_applied` do
  `meu-negocio-app` como o cenário que esta regra não cobre — por isso
  aquele app não entra neste piloto.
- `README.md` §2.2 (descrição de `domain/`): anotar que uma entidade só
  precisa de arquivo em `domain/` quando tem campo que não deve atravessar o
  IPC, ou função pura de domínio; quando é puro contêiner de dados idêntico
  ao contrato, o tipo mora só em `shared/types/`.
- `README.md` §2.5 ("Nomes na fronteira"): a trava de `entity → response`
  deixa de ser incondicional — passa a valer só quando há campo a filtrar.
  A regra de `row → entity` (`rowToX`) não muda.
- Fronteira `Row` (banco) sem alteração: `interface XRow` e `rowToX`
  continuam existindo exatamente como hoje, em cada arquivo de repositório.
- Schemas zod de `main/controllers/schemas/` sem alteração.

## Testing Decisions

- Decisão confirmada com o desenvolvedor: **sem teste automatizado novo**
  nesta rodada. A verificação é: (a) `npm run typecheck` — que vai falhar
  primeiro por causa dos imports quebrados pelos arquivos apagados, servindo
  de checklist para achar todo call site de `XEntity`; corrigir até passar
  limpo; (b) `npm run lint`; (c) `npm test` (suíte de lógica pura, não deve
  ser afetada); (d) QA manual no app rodando (`npm run dev:dinheiro`),
  cobrindo os fluxos da User Story 16.
- Não introduzir teste de repository/service com banco real nesta rodada,
  mesmo sendo tecnicamente o momento oportuno (ADR-0002 convida a isso). O
  desenvolvedor optou por manter a norma atual do monorepo — `vitest` só para
  lógica pura (`AGENTS.md`: "vitest: lógica pura dos quatro apps").
- Prior art: nenhum app do monorepo tem hoje teste de repository/service com
  banco real, nem o `meu-movel-planejado` (o único com testes). Os únicos
  testes existentes no `meu-dinheiro-app` são de lógica pura
  (`src/shared/ipc/channels.test.ts`,
  `src/renderer/src/theme/labelOn.test.ts`) e não são afetados por esta
  mudança.
- Bons testes, se algum dia forem adicionados aqui, verificariam
  comportamento observável do service (shape do objeto devolvido, presença
  condicional dos campos de JOIN, `isPaid` como boolean) — nunca a estrutura
  interna dos tipos em si.

## Out of Scope

- Replicar o mesmo colapso em `git-dlog`, `meu-negocio-app` e
  `meu-movel-planejado` — fica para uma rodada futura, entidade por entidade,
  aplicando o mesmo critério.
- `meu-negocio-app` especificamente não qualifica para este critério de
  colapso (caso `stock_applied` em `OrderItem`) — mantém a divisão em 3
  camadas.
- Colapsar a fronteira `Row` ↔ `Entity` do banco. Foi considerado e
  descartado nesta rodada por ser uma mudança de escopo bem maior — tocaria
  toda `SELECT` do repositório com aliases, ou introduziria uma conversão
  implícita de driver que reabriria o mesmo risco do caso `stock_applied`, um
  nível abaixo.
- Modelar a conversão `Row → Entity/Shared` como classe com método de
  instância — avaliado e descartado: exigiria repetir a lista de campos no
  construtor e no método, ou um truque de `Object.assign`/prototype com
  pegadinha conhecida de `useDefineForClassFields`. Mantém-se a função solta
  (`rowToX`) como está hoje.
- Introduzir teste de repository/service com banco real — decisão explícita
  de manter a norma atual do repo nesta rodada.
- Qualquer mudança de comportamento visível ao usuário final do app.
- Mudança nos schemas zod de `controllers/schemas/`.
- Colapso de `MonthEntity`/`Month` — mapper mantém lógica real (inclusão
  condicional de totais), não é cópia pura.

## Further Notes

A investigação (3 agentes exploratórios, mais leitura direta dos arquivos de
`domain/`, `controllers/responses/` e `infra/database/repositories/` do
`meu-dinheiro-app`) confirmou que o mesmo padrão de 4 camadas se repete
idêntico em `git-dlog`, `meu-negocio-app` e `meu-movel-planejado`, e que é uma
convenção documentada (`README.md` §2.2/§2.5, `docs/adr/0002-camadas-do-processo-principal.md`),
não um acidente de código. No `meu-dinheiro-app`, das 3 entidades auditadas em
detalhe (Despesa, Conta bancária, Categoria/CategoryTotal), 5 de 6 pares
Domain↔Shared eram estruturalmente idênticos; a única transformação de valor
real encontrada em toda a investigação foi `is_paid` (0/1 no SQLite) →
`isPaid` (boolean), que continua acontecendo no `rowToX` e não é afetada por
este colapso.

O desenvolvedor decidiu conscientemente aceitar o trade-off de perder, nas
entidades colapsadas, o aviso automático do `tsc` que hoje impede um campo
novo de vazar pro IPC sem decisão explícita — sabendo que o caso que motivou
essa trava (`stock_applied`, no `meu-negocio-app`) continua coberto porque
aquele app fica fora do piloto.

Esta spec deve virar tickets de implementação em
`.scratch/meu-dinheiro-colapso-tipos/issues/`, seguindo a numeração
`NN-<slug>.md` a partir de `01`, antes de a implementação começar.
