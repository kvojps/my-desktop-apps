Status: resolvido

# CONTEXT.md do Meu Negócio: escrituração de estoque

Acrescentar ao `apps/meu-negocio-app/CONTEXT.md` o termo que a sessão de modelagem isolou.

**Escrituração de estoque** — o registro de quanto saiu de fato do estoque quando uma venda
foi concluída, que não é a mesma coisa que a quantidade pedida no item. Quando o saldo não
cobria o pedido, sai menos do que foi pedido, e é o que saiu que precisa voltar se a venda
for reaberta, cancelada ou excluída.

A distinção existe no código (`stock_applied`, coluna de `order_items`) e é defendida hoje só
por um comentário em `apps/meu-negocio-app/src/main/db/ordersRepository.ts:34-44`:

> Colunas de controle de estoque do item. Ficam fora de `OrderItem` de propósito: são
> escrituração interna do processo principal, não fazem parte do pedido que o renderer
> manipula.

É o caso concreto que justifica a regra de mapeamento explícito da spec: um campo que existe
no domínio e não pode aparecer no response.

Seguir o formato do arquivo existente. Sem termo de arquitetura — ver ticket 01.

## Comments

Feito: `apps/meu-negocio-app/CONTEXT.md` ganhou o termo **Escrituração de estoque** ao fim da
seção Language, no formato do arquivo (definição + `_Avoid_`). Nenhum outro arquivo tocado —
sem termo de arquitetura, como o ticket pede.

Três coisas que o ticket não previa:

1. **O parágrafo de abertura foi ajustado.** Ele dizia que o glossário "fixa o vocabulário do
   lado do dinheiro"; com um termo de estoque dentro, a frase passava a ser falsa. Reescrito
   para o que a venda concluída põe em jogo — o que há para receber, como a espera é medida,
   e o que a conclusão tirou do estoque. Foi o menor ajuste que mantinha o arquivo honesto;
   se a preferência for manter o recorte antigo, o termo é que precisa de outro lugar.
2. **A definição incorpora o teto em zero.** O ticket diz "sai menos do que foi pedido" sem
   dizer por quê; o porquê está em `adjustProductStock`
   (`src/main/db/productsRepository.ts:103-123`), que para o estoque em zero em vez de
   deixá-lo negativo e devolve `appliedDelta`. Sem essa cláusula o termo descreve um sintoma
   sem causa.
3. **"De fato" não vale para banco antigo, e o termo não diz isso.** A migração
   `backfillStockAppliedForCompletedOrders` (`src/main/db/migrations.ts:37-45`) escreve
   `stock_applied = quantity` nos pedidos já concluídos, e o próprio comentário admite que
   "não há como saber quanto foi realmente baixado". Para essas linhas o valor é presumido,
   não observado. Ficou fora do glossário de propósito: é limitação de um dado histórico, não
   do conceito, e já está documentada no ponto onde a suposição é feita. Fica registrado aqui
   caso alguém venha a tratar `stock_applied` como fato para qualquer linha.

O `_Avoid_` lista `quantidade do item` e `baixa de estoque` — esta última qualificada como
ação, não registro, porque o código usa "baixa" para o ato em `deductStockForOrder`
(`ordersRepository.ts:216-220`) e o glossário não deveria proibir a palavra, só a confusão. O
parêntese destoa dos seis `_Avoid_` deste arquivo, que são listas secas, mas tem precedente no
`apps/git-dlog/CONTEXT.md` ("sincronizar (usado para o estado da branch, não para a ação)").

A definição abre com "quando o pedido foi concluído" e fecha com "se a venda for reaberta".
A troca é deliberada e segue **Conta a receber**, que já usa "Pedido concluído" e fixa que "só
a conclusão transforma o pedido em venda": conclui-se um pedido, reabre-se uma venda.

Alteração só de markdown: `prettier --check` limpo, `npm run typecheck`, `npm run lint` (os
mesmos 2 warnings pré-existentes de `react-hooks/exhaustive-deps` no Meu Negócio) e
`npm run test` (19 arquivos, 173 testes) passam.
