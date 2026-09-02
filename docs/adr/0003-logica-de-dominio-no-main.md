# Lógica de domínio mora no main, mesmo a que não toca banco nem disco

O ADR-0002 fixa que a regra de negócio mora na camada de serviço. Faltava dizer
o que fazer com a regra que não precisa de nada do main para rodar: função pura,
sem banco e sem sistema de arquivos, que o renderer poderia executar sozinho.
Decidimos que ela também mora no `main`. Isto **revoga um precedente
documentado**, e o precedente está escrito com todas as letras em
`apps/meu-movel-planejado/src/renderer/src/hooks/plan/useGeneratePlan.ts`:

> O empacotador é função pura — sem banco e sem sistema de arquivos —, e o
> precedente do repo é lógica de domínio pura morar fora do main quando ela não
> toca nem um nem outro.

O critério antigo era "o que a função toca". O novo é "o que a função é": se é
regra do domínio, é do main, e o renderer a alcança por IPC como alcança
qualquer outra. O critério antigo tem o defeito de não sobreviver ao tempo — a
regra que hoje é pura ganha uma consulta amanhã, e a mudança de lugar chega
junto com a mudança de comportamento, no pior momento possível. E enquanto ela
vale, a resposta para "onde está a regra?" volta a ser "depende", que é
exatamente o que o ADR-0002 comprou o refactor para eliminar.

## O custo, que não é zero

Registrar a decisão sem registrar o preço seria registrar metade dela.

- **Ida e volta de IPC por regeneração de plano.** Hoje o empacotamento roda no
  renderer e só o resultado atravessa; passa a atravessar o pedido também.
- **O empacotamento passa a rodar no event loop do processo principal.** No
  renderer, ele trava uma janela. No main, trava **todas** — e junto com elas
  todo IPC de todas as janelas, inclusive o que não tem nada a ver com plano.
- **A cessão de controle entre tentativas morre.** `packCuttingPlanAttempts`
  produz doze tentativas (quatro ordenações × três heurísticas), e o
  `useGeneratePlan` cede o controle ao navegador entre uma e outra justamente
  para o rótulo do botão conseguir repintar — o app não tem indicador circular
  de progresso, e esse rótulo é o único sinal de que há trabalho acontecendo. No
  main não há a quem ceder: o `setTimeout` continuaria existindo, mas a janela
  que ele deveria deixar repintar está esperando o IPC do outro lado.

**A decisão foi tomada sem medir `packCuttingPlan`.** Ninguém cronometrou quanto
o empacotamento demora, nem com que tamanho de projeto ele começa a doer. Se
aparecer congelamento de UI no Meu Móvel Planejado, a peça a revisitar é este
ADR, não o código que o obedeceu — e a revisão começa pela medição que não foi
feita.

## `isWorktreeDirty` é o mesmo precedente em escala micro

`isWorktreeDirty`, em `apps/git-dlog/src/shared/types/repoScan.ts`, é o único
helper de runtime daquele arquivo e é chamado dos dois lados:
`apps/git-dlog/src/main/infra/gateways/git/repoScanner.ts` o usa para decidir a
severidade de um repositório, e
`apps/git-dlog/src/renderer/src/pages/repos/components/RepoCard.tsx` para
decidir se mostra a linha de trabalho pendente. É o precedente revogado acima,
só que pequeno o bastante para passar despercebido — e por isso precisa ser
nomeado aqui em vez de ficar como exceção implícita.

**Recomendação: fica onde está.** `isWorktreeDirty` responde "há o que mostrar
sobre esta working tree?", que é predicado de apresentação sobre um tipo do
contrato, não regra de negócio. Ele mora em `shared` como parte do contrato,
pela mesma razão que `describeAppError` mora: é a leitura combinada de um tipo
que as duas pontas trocam. Se um dia ele passar a decidir alguma coisa — e não
só a descrever —, vira entidade em `main/domain/` e o renderer recebe a resposta
pronta.

A distinção que separa os dois casos: **descrever o que já atravessou o IPC é do
renderer; decidir o que atravessa é do main.**

## Alternativas consideradas

- **Manter o critério "toca banco ou disco?".** É o precedente vigente e não
  custa migração nenhuma. Cai pelo motivo do primeiro parágrafo: é um critério
  sobre a implementação de hoje, não sobre o papel da função, e por isso muda de
  resposta sem que ninguém tenha decidido mudá-la.
- **Deixar o empacotador em `shared/nesting/` e chamá-lo do main.** Mantém os
  testes onde estão e evita mover código, mas põe regra de negócio numa pasta
  cujo contrato é "só tipos e funções puras, importável pelos dois lados" — ou
  seja, deixa a porta aberta para o renderer voltar a chamá-lo, que é a situação
  que a revogação existe para fechar. Os testes de `packCuttingPlan` acompanham
  o módulo; o vitest da raiz cobre `apps/*/src/**/*.test.ts` e não se importa
  com a pasta.
- **Worker thread no main para o empacotamento.** Resolve o custo mais caro dos
  três — o event loop bloqueado — sem devolver a regra ao renderer. Fica fora
  desta leva por não ter medição que a justifique: é infraestrutura nova para um
  problema que ninguém confirmou existir. É a saída natural se a medição vier e
  doer.

## Consequências

A revogação só produz mudança de código quando o Meu Móvel Planejado for
migrado, e ele é o último da fila do ADR-0002. Até lá, `useGeneratePlan.ts`
continua rodando o empacotamento no renderer, e o comentário citado acima
continua no arquivo descrevendo um precedente que já não vale — o ticket de
migração daquele app tem de apagá-lo junto com o resto.

Quando a migração acontecer, `packCuttingPlanAttempts` deixa de fazer sentido
como API pública: a cessão de controle entre tentativas existia para a tela
repintar, e do lado do main não há tela. O que atravessa o IPC é um plano só.

## Emenda: a migração aconteceu (setembro de 2026)

O Meu Móvel Planejado migrou
(`.scratch/movel-camadas-processo-principal/`, ticket 07). O empacotador
(`packCuttingPlan`, `maxRects`) e o `planSnapshot` moram agora em
`apps/meu-movel-planejado/src/main/domain/`; `plans:save` deu lugar a
`plans:generate(projectId)`, e os dois comentários que descreviam o precedente
revogado saíram do código. Três coisas que este ADR deixou em aberto ou errou, e
que a migração fecha.

### A medição que faltava

O ticket 01 cronometrou `packCuttingPlan` inteira — as doze tentativas —, mediana
de cinco execuções após uma descartada, em AMD Ryzen 5 5625U / Windows 11 / Node
v24.15.0 via `npx tsx`, sem Electron (a função não toca banco, disco, relógio nem
aleatoriedade, então o número transfere para o V8 do main):

| projeto                     | instâncias | chapas | mediana     |
| --------------------------- | ---------- | ------ | ----------- |
| pequeno                     | 15         | 2      | **0,6 ms**  |
| típico de cozinha           | 200        | 8      | **3,5 ms**  |
| pesado (uma cozinha e meia) | 500        | 20     | **10,6 ms** |

**Faixa: `< 500 ms` — segue como está.** O caso pesado é quase cinquenta vezes
abaixo do limiar. O custo cresce perto do quadrático: o limiar de 500 ms fica em
torno de 5000 instâncias em 200 chapas, um projeto dez vezes maior que o caso
pesado. `MAX_QUANTITY` é 999 por lote, então a entrada é alcançável no papel; na
prática não é um serviço de marcenaria. **Nenhum worker thread** — a saída que a
seção "Alternativas consideradas" nomeia só entra se a medição vier e doer, e ela
não doeu.

### A lista de custos, corrigida para este app

Confrontados com o código, dois dos três custos acima estão errados para o Meu
Móvel Planejado:

- **O custo 1 (ida e volta de IPC) permanece**, e é o mais barato dos três: um
  pedido a mais por regeneração de plano.
- **O custo 2 ("trava todas as janelas") é vazio aqui.** `index.ts` cria uma
  janela no boot e, no `activate`, só quando não há nenhuma. Nunca existe uma
  segunda janela para congelar.
- **O custo 3 ("a cessão de controle entre tentativas morre") está invertido.**
  O `yieldToInterface` existia porque o empacotamento travava o event loop do
  **renderer** — é por isso que o rótulo "Gerando…", o único sinal de progresso
  do app, não repintava sozinho. No main o event loop do renderer fica livre
  durante toda a operação: o rótulo pinta e continua pintando, sem ninguém ceder
  nada. `packCuttingPlanAttempts`, `runAttempts` e `yieldToInterface` foram
  **apagados**, não lamentados — o sinal de progresso melhorou.

O que de fato degrada, e este ADR não nomeia, é a **moldura nativa** (arrastar,
redimensionar, minimizar) e qualquer **IPC concorrente** — essas o main é que
serve. Com 10,6 ms no pior caso realista, o bloqueio é indistinguível de um
clique normal.

### `fitsAnySheet` fica em `shared`, como exceção nomeada

`fitsAnySheet` (com `fitsPackable`, `packableSize`, `usableSize` e a mensagem
`PIECE_DOES_NOT_FIT_MESSAGE`), em
`apps/meu-movel-planejado/src/shared/nesting/fit.ts`, responde "esta peça cabe em
alguma chapa do projeto?". É a régua da **rejeição** — o 422 que separa "a peça
não serve" de "faltou chapa". Ela é chamada dos dois lados: `piecesService`
(`main`) a aplica na fronteira de confiança, e o cadastro de peça no renderer a
consulta para barrar a peça grande demais **ao vivo**, com `describeFitRule` e os
números do projeto, antes da ida e volta do IPC.

**Recomendação: fica onde está**, pelo mesmo critério que manteve `isWorktreeDirty`
em `shared`: o main continua sendo quem **decide** — o 422 na fronteira é a
decisão de registro —, e o renderer só **antecipa** a resposta para explicá-la.
Levá-la ao main trocaria um `Alert` explicativo por um submit falhado, numa tela
cuja razão de existir é separar rejeição de falta de estoque. Se um dia
`fitsAnySheet` passar a decidir alguma coisa que o main não reavalie, vira
entidade em `main/domain/` e o renderer recebe a resposta pronta.

Exceção escrita é exceção que alguém pode contestar; exceção implícita é
precedente silencioso.
