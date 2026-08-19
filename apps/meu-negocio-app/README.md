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

Visão geral do período: receita e lucro por mês, produtos mais vendidos, distribuição dos pedidos por status, alertas de estoque baixo e as vendas mais recentes. O filtro de meses vale para todos os cards da tela.

### 1.3 Produtos

Catálogo com nome, descrição, categoria, fornecedor, preço de custo, preço de venda, estoque e estoque mínimo. A partir desses valores o app calcula o lucro por unidade, a margem sobre o preço de venda e o capital parado na prateleira. Um produto sem preço de venda aparece com margem **indefinida**, não com margem zero — não ter preço não é o mesmo que vender no prejuízo, e um produto assim fica de fora tanto da margem média quanto da ordenação por margem, em vez de fingir que vale zero e distorcer as duas.

### 1.4 Pedidos

Pedidos por cliente, com itens vindos do catálogo ou um total digitado à mão, percorrendo o fluxo `pendente` → `em andamento` → `concluído`, mais o `cancelado`. Um pedido concluído ou cancelado não pode ser editado diretamente — um concluído precisa ser reaberto primeiro, porque editar os itens de uma venda já baixada no estoque deixaria o saldo sem como voltar.

Duas decisões que valem explicar sobre o estoque: ele só é baixado na conclusão, e reabrir ou cancelar devolve exatamente o que foi baixado — se o saldo não cobria o pedido inteiro na conclusão, a devolução não inventa unidades que nunca existiram. Excluir um pedido concluído também devolve o estoque, pelo mesmo motivo.

### 1.5 Vendas

Os pedidos concluídos vistos pelo lado do dinheiro: receita, lucro e situação de pagamento. O valor pago é registrado por pedido, então um pedido entregue e ainda não quitado continua visível como recebível em vez de sumir da conta.

### 1.6 Configurações

Dados da empresa (nome, CNPJ, telefone, endereço), backup e restauração em `.json`, e a versão do app com o caminho do banco em disco.
