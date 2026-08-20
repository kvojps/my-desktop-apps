# Meu Negócio

App desktop para gerenciar produtos, pedidos e vendas de um negócio pequeno.
Este glossário fixa o vocabulário do lado do dinheiro — o que o negócio ainda
tem para receber, e como a espera é medida num modelo que não tem prazo.

## Language

**Conta a receber**:
Pedido concluído cujo saldo devedor é maior que zero. Pedido pendente ou em
andamento não é conta a receber — só a conclusão transforma o pedido em venda.
_Avoid_: recebível, pendência, débito

**Saldo devedor**:
O total do pedido menos o valor já pago, nunca negativo. Pagamento acima do
total não vira crédito: o saldo simplesmente zera.
_Avoid_: valor em aberto, restante, dívida

**Faixa**:
Agrupamento das contas a receber pela idade da venda: 0–15, 16–30, 31–60 e 60+
dias. As quatro existem sempre, mesmo vazias — faixa zerada é informação, não
ausência de informação.
_Avoid_: bucket, categoria, intervalo

**Dias desde a venda**:
Dias corridos entre a data do pedido (`createdAt`, que é a data pela qual a
venda é contabilizada) e hoje. Mede **idade**, não atraso.
_Avoid_: dias em aberto, dias de atraso, aging

**Ausência de vencimento**:
O modelo não tem data de vencimento, e portanto nenhuma conta está formalmente
atrasada. A cor de alerta na faixa de 60+ dias é convenção do negócio sobre
quanto tempo é tempo demais — não a violação de um prazo acordado.
_Avoid_: vencido, em atraso, inadimplente

**Posição de hoje**:
Recorte que ignora o filtro de período da tela e olha o histórico inteiro. É o
recorte das contas a receber, porque um saldo devido não pertence ao mês em que
a venda aconteceu — ele existe até ser pago.
_Avoid_: saldo atual, snapshot
