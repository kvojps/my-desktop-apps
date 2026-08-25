Status: aberto

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
