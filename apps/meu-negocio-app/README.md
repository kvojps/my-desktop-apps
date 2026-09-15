# Meu Negócio

App desktop (Electron) para **gerenciar produtos, pedidos e vendas de um negócio pequeno**: você cadastra o catálogo com preço de custo e de venda, registra os pedidos por cliente e acompanha o que já foi entregue, o que ainda está em aberto e quanto de fato entrou no caixa.

Tudo roda local: um banco SQLite na sua máquina, sem login, sem servidor e sem nuvem. O backup é seu, num arquivo `.json` que você exporta quando quiser.

<!-- ![image](cole aqui o link da captura de tela) -->

## 1. Funcionalidades

### 1.1 Manual de uso

O app tem cinco telas: **Dashboard** (a inicial, com o resumo do período), **Produtos** (catálogo), **Pedidos** (fluxo de venda), **Vendas** (o lado do dinheiro) e **Configurações** (dados da empresa e backup).

1. Comece em **Produtos** cadastrando o catálogo: nome, categoria, fornecedor, preço de custo, preço de venda, estoque e estoque mínimo.
2. Em **Pedidos**, registre um pedido por cliente com itens vindos do catálogo (ou um total digitado à mão) e acompanhe o fluxo `pendente` → `em andamento` → `concluído`.
3. Ao concluir um pedido, o estoque dos itens é baixado na hora — é esse o momento em que o pedido vira venda de fato.
4. Volte para **Vendas** para registrar o quanto já foi pago de cada pedido concluído e acompanhar o que ainda está em aberto.
5. O **Dashboard** resume o período: receita, lucro, produtos mais vendidos e alertas de estoque baixo.

### 1.2 Dashboard

Visão geral do período em três blocos, cada um com os indicadores no cabeçalho e um seletor **Gráfico/Tabela** que mostra os mesmos dados de duas formas — a tabela é o caminho pelo teclado e traz o que no gráfico só aparece na dica, como a contagem de contas por faixa:

- **Faturamento e Lucro por Mês** — faturamento, lucro com a margem e pedidos pendentes; o gráfico compara os meses do período e a tabela lista mês, faturamento, lucro e margem.
- **Vendas** — total de vendas, ticket médio e produtos com estoque baixo; o gráfico é o ranking dos cinco produtos mais vendidos por quantidade.
- **Cobranças** — total a receber e contas em aberto, por faixa de dias desde a venda.

O filtro de meses vale para os dois primeiros blocos, com **uma exceção deliberada**: **Cobranças** mostra sempre a posição de hoje, sobre o histórico inteiro. Um saldo devido não pertence ao mês em que a venda aconteceu — ele existe até ser pago —, e filtrar por período esconderia justamente a conta mais velha, que é a que importa. O bloco diz isso no próprio subtítulo.

As contas a receber aparecem agrupadas por **faixa de dias desde a venda** (0–15, 16–30, 31–60 e 60+), com o valor de cada faixa em barra e a contagem de contas na dica e na tabela. As quatro faixas aparecem sempre, zeradas inclusive: "nada acima de 60 dias" é informação. Repare que a faixa mede **idade da venda, não atraso** — o app não tem data de vencimento, então nenhuma conta está formalmente atrasada; a cor de alerta em 60+ dias é convenção sobre quanto tempo é tempo demais. Para ver as contas uma a uma, o caminho é a tela de **Vendas**.

### 1.3 Produtos

Catálogo com nome, descrição, categoria, fornecedor, preço de custo, preço de venda, estoque e estoque mínimo. A partir desses valores o app calcula o lucro por unidade, a margem sobre o preço de venda e o capital parado na prateleira. Um produto sem preço de venda aparece com margem **indefinida**, não com margem zero — não ter preço não é o mesmo que vender no prejuízo, e um produto assim fica de fora tanto da margem média quanto da ordenação por margem, em vez de fingir que vale zero e distorcer as duas.

### 1.4 Pedidos

Pedidos por cliente, com itens vindos do catálogo ou um total digitado à mão, percorrendo o fluxo `pendente` → `em andamento` → `concluído`, mais o `cancelado`. Um pedido concluído ou cancelado não pode ser editado diretamente — um concluído precisa ser reaberto primeiro, porque editar os itens de uma venda já baixada no estoque deixaria o saldo sem como voltar.

Duas decisões que valem explicar sobre o estoque: ele só é baixado na conclusão, e **concluir exige estoque suficiente** — o pedido pode ser registrado e editado com saldo a descoberto, mas a conclusão é recusada com a lista do que falta, para o app nunca escriturar uma saída que não aconteceu. Reabrir ou cancelar devolve exatamente o que foi baixado, e não a quantidade do pedido: um produto apagado do catálogo entre a conclusão e a reabertura não tem saldo para onde voltar. Excluir um pedido concluído também devolve o estoque, pelo mesmo motivo.

### 1.5 Vendas

Os pedidos concluídos vistos pelo lado do dinheiro: receita, lucro e situação de pagamento. O pagamento é registrado por pedido como **Total já pago** — o campo guarda o acumulado, e não uma parcela: trocar R$ 100 por R$ 150 deixa R$ 150 pagos, não R$ 250. Assim um pedido entregue e ainda não quitado continua visível como recebível em vez de sumir da conta.

Os indicadores do topo seguem o período escolhido no cabeçalho; a tabela segue também a busca e a situação de pagamento. Limpar os filtros da tabela preserva o período — os dois recortes são independentes de propósito, porque o período é o escopo da tela e a busca é uma pergunta dentro dele.

### 1.6 Configurações

Dados da empresa (nome, CNPJ, telefone, endereço), backup e restauração em `.json`, e a versão do app com o caminho do banco em disco. As três seções — Empresa, Backup e Sobre — ficam numa navegação interna, uma visível por vez; o tema claro/escuro é trocado no rodapé da lateral, não aqui.
