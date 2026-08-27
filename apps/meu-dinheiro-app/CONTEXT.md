# Meu Dinheiro

App desktop de finanças pessoais organizado mês a mês: cada Mês guarda as
suas despesas e entradas, nascidas de modelos que se repetem. Este glossário
fixa o vocabulário desse arranjo — a que mês um fato pertence, o que é modelo
e o que é cópia, e a fronteira entre o que já aconteceu e o que ainda é
projeção.

## Language

**Competência**:
A que Mês um fato financeiro pertence, dado por ano + mês. Onde é preciso uma
string, representa-se como `AAAA-MM` — a string é a representação, não o
conceito.
_Avoid_: período, mês de referência, competency

**Mês**:
O contêiner ano-mês em torno do qual o app inteiro se organiza; guarda as
despesas e as entradas daquela Competência.
_Avoid_: período

**Mês corrente**:
O Mês cuja Competência é a de hoje. O app garante que ele existe ao abrir e
sempre que a janela volta ao foco.
_Avoid_: mês atual, current month

**Despesa padrão / Entrada padrão**:
Modelo do que se repete todo mês — nome, valor, dia de vencimento ou
previsão, categoria ou conta. Todo Mês novo nasce com uma cópia das vigentes
no momento da criação.
_Avoid_: default, recorrente, template, assinatura

**Cópia / fotografia**:
A relação entre um item de um Mês e o padrão de onde veio: um retrato tirado
na criação, não uma referência viva. Editar o padrão depois nunca mexe nos
meses já criados.
_Avoid_: vínculo, referência

**Cascata**:
A propagação da exclusão de um Mês para as suas despesas e entradas, feita
pelo banco. Reservada para exclusão — a cópia de padrões para dentro de um
Mês novo não é cascata.

**Realizado**:
`recebido − pago`. O dinheiro que de fato entrou e saiu até agora. É o número
de destaque.
_Avoid_: saldo real, efetivo

**Previsto**:
`entradas − despesas`. Onde o Mês termina se tudo for cumprido. É a projeção.
_Avoid_: orçado, estimado

**Comprovante**:
A imagem ou PDF anexada a uma despesa no momento do pagamento. Apagada junto
com a despesa e ao desmarcar o pagamento.
_Avoid_: anexo, recibo

**Valor variável**:
Uma despesa padrão sem valor fixo, preenchido na hora do pagamento (água,
luz).
_Avoid_: valor em aberto

**Conta bancária**:
O elo entre uma despesa ou entrada e o dinheiro real: pagar debita, receber
credita. Excluir uma não desfaz movimentos passados.
_Avoid_: carteira

**Categoria**:
Classifica despesas para o Histórico. Excluir uma deixa as despesas "sem
categoria", nunca as apaga. Distinta de `categoria` no Meu Negócio.
_Avoid_: etiqueta, tag, grupo
