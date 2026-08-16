# Meu Negócio

App desktop (Electron) para **gerenciar produtos, pedidos e vendas de um negócio pequeno**: você cadastra o catálogo com preço de custo e de venda, registra os pedidos por cliente e acompanha o que já foi entregue, o que ainda está em aberto e quanto de fato entrou no caixa.

Tudo roda local: um banco SQLite na sua máquina, sem login, sem servidor e sem nuvem. O backup é seu, num arquivo `.json` que você exporta quando quiser.

<!-- ![image](cole aqui o link da captura de tela) -->

# 1. Funcionalidades

## 1.1 Dashboard

Visão geral do período: receita e lucro por mês, produtos mais vendidos, distribuição dos pedidos por status, alertas de estoque baixo e as vendas mais recentes. O filtro de meses vale para todos os cards da tela.

## 1.2 Produtos

Catálogo com nome, descrição, categoria, fornecedor, preço de custo, preço de venda, estoque e estoque mínimo. A partir desses valores o app calcula o lucro por unidade, a margem sobre o preço de venda e o capital parado na prateleira. Um produto sem preço de venda aparece com margem **indefinida**, não com margem zero — não ter preço não é o mesmo que vender no prejuízo.

## 1.3 Pedidos

Pedidos por cliente, com itens vindos do catálogo ou um total digitado à mão, percorrendo o fluxo `pendente` → `em andamento` → `concluído`, mais o `cancelado`. O estoque só é baixado quando o pedido é concluído, e a reabertura devolve exatamente o que foi baixado — se o estoque não cobria o pedido inteiro na conclusão, a devolução não inventa unidades que nunca existiram. Um pedido cancelado não pode ser editado.

## 1.4 Vendas

Os pedidos concluídos vistos pelo lado do dinheiro: receita, lucro e situação de pagamento. O valor pago é registrado por pedido, então um pedido entregue e ainda não quitado continua visível como recebível em vez de sumir da conta.

## 1.5 Configurações

Dados da empresa (nome, CNPJ, telefone, endereço), backup e restauração em `.json`, e a versão do app com o caminho do banco em disco.
