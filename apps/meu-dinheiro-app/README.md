# Meu Dinheiro

App desktop (Electron) de controle financeiro pessoal **organizado por mês**: você cadastra o que se repete todo mês — aluguel, salário, assinaturas — e o app monta cada mês novo sozinho, já com as despesas a pagar e as entradas a receber no lugar. O que sobra para você é a parte que muda: marcar o que foi pago e o que caiu na conta, anexar o comprovante e olhar o saldo.

Tudo roda local: um banco SQLite e uma pasta de comprovantes na sua máquina, sem login, sem servidor e sem nuvem. O backup é seu, num arquivo `.zip` que você exporta quando quiser.

<!-- ![image](cole aqui o link da captura de tela) -->

## 1. Funcionalidades

### 1.1 Manual de uso

O app tem três telas: **Visão Geral** (a inicial, com os meses), **Histórico** (gráficos do ano) e **Configurações** (o que se repete todo mês e os dados do app).

1. Na primeira abertura não há nada cadastrado, e a Visão Geral mostra os três passos a dar em **Configurações**: cadastrar as **contas bancárias**, ajustar as **categorias** (dez já vêm prontas) e cadastrar as **despesas e entradas padrão**.
2. Ainda em Configurações, use **"Adicionar Meses"** para criar de uma vez o intervalo que você quer acompanhar — cada mês nasce já preenchido com os padrões.
3. Volte para a **Visão Geral** e clique em um mês. É ali que o dia a dia acontece: marcar despesas como pagas, entradas como recebidas, adicionar o que não era previsto.
4. Ao pagar, informe a **data**, a **conta** de onde saiu o dinheiro e, se quiser, anexe o **comprovante**. O saldo da conta bancária é atualizado na hora.
5. No fim do mês (ou do ano), o **Histórico** mostra a evolução do saldo mês a mês e para onde o dinheiro foi, por categoria.

O mês corrente é criado sozinho — você não precisa lembrar de virar o mês.

### 1.2 Meses

O mês é a unidade de tudo no app. Ele existe de três formas:

- **Automaticamente**: o app garante o mês corrente ao abrir e sempre que a janela volta ao foco. O segundo caso existe porque um app de controle financeiro costuma ficar aberto por dias — a virada do mês acontece sem reiniciar nada.
- **Em lote**, em Configurações → Adicionar Meses: escolha o intervalo (até **60 meses** por vez) e o app cria todos, **ignorando os que já existem** em vez de falhar. O resumo diz quantos entraram e quais foram pulados.
- **Um a um**, como consequência: criar o próximo mês continua a sequência a partir do último cadastrado.

Excluir um mês apaga junto suas despesas e entradas (cascata no banco), e pede confirmação. Uma sutileza que importa: o app **marca a competência excluída** para não recriar no próximo boot o mês que você acabou de apagar de propósito. Sem isso, excluir o mês corrente seria um gesto inútil — ele voltaria na abertura seguinte.

Cada mês criado copia as **despesas e entradas padrão** vigentes naquele momento. O dia de vencimento vira data real (`2026-08-10`) e as entradas já nascem com a conta bancária vinculada. Alterar um padrão depois não mexe nos meses já criados — eles são fotografias, não referências.

### 1.3 Visão Geral

A tela inicial responde "como estou?" em três alturas, do geral para o específico:

- **Saldo em contas**, a soma de todas as contas bancárias — o número que existe de verdade agora. Só aparece se você cadastrou contas.
- **Realizado, entradas e despesas do período**, cada um com o que ainda não aconteceu na legenda e para onde o indicador caminha até dezembro.
- **Uma linha por mês**, com entradas, despesas, saldo realizado, o quanto já foi pago (barra e `3/8`) e um chip vermelho de **despesas vencidas** quando há.

O **intervalo exibido** fica no cabeçalho, com três atalhos — **3 meses**, **Este ano** (o padrão ao abrir) e **Tudo** — e um seletor "De/Até" para o recorte que os atalhos não dão. A tabela ordena por qualquer coluna, mostra **12 meses por página** e abre do mais recente para o mais antigo. O mês atual leva o chip "Atual".

### 1.4 Realizado e Previsto — os dois saldos

O app calcula sempre os dois, lado a lado, para que nenhuma tela precise escolher (e divergir):

| Saldo         | Fórmula             | Responde                                |
| ------------- | ------------------- | --------------------------------------- |
| **Realizado** | recebido − pago     | O que de fato entrou e saiu até agora   |
| **Previsto**  | entradas − despesas | Onde o mês termina se tudo for cumprido |

O **Realizado** é o número grande, em verde ou vermelho: é o que aconteceu, e não uma promessa. O **Previsto** vem abaixo, menor, porque é a projeção. Nos cards da Visão Geral, onde o espaço é apertado, só o Realizado aparece — o detalhamento fica na tela do mês.

O cálculo aceita as duas formas de dado sem que a tela precise saber qual recebeu: a lista de meses traz totais já agregados pelo SQL, e a tela do mês soma os itens que ela já tem em mãos.

### 1.5 Despesas e entradas do mês

A tela do mês tem duas abas — **Despesas** e **Entradas** —, cada uma mostrando quantas já foram quitadas (`5/12`). As duas funcionam igual: buscar por nome, filtrar por status, ordenar, paginar de 12 em 12. As despesas ganham um filtro a mais, por **categoria**.

Cada despesa ou entrada tem um status, que é o que define a cor do chip e o ícone:

| Status                     | Quando                                     |
| -------------------------- | ------------------------------------------ |
| 🟢 **Paga** / **Recebida** | já quitada                                 |
| 🟡 **Pendente**            | em aberto, ainda no prazo                  |
| 🔴 **Vencida**             | em aberto e com vencimento anterior a hoje |

A cor nunca vem sozinha: o ícone e o texto no tooltip dizem a mesma coisa, para quem não distingue as cores.

As duas abas são **tabelas**, a mesma da Visão Geral: nome, categoria (ou conta bancária, nas entradas), data, status, valor e as ações da linha.

**Ordenar é clicar no cabeçalho** — nome, data ou valor —, e clicar de novo inverte o sentido. A aba abre ordenada pela data crescente: o que vence primeiro é o que a tela existe para resolver. São **12 linhas por página**.

Ícones discretos marcam as despesas e entradas que têm **observação** ou **comprovante** anexado, e clicar na linha (ou dar `Enter` nela) abre o detalhe completo. A data em que a despesa ou entrada foi paga ou recebida fica no tooltip do chip de status — a coluna de data é sempre a do vencimento ou da previsão, porque um cabeçalho de tabela não muda de significado linha a linha.

### 1.6 Pagar e receber

Pagar não é só marcar uma caixinha — é registrar de onde saiu o dinheiro. O diálogo pede a **data do pagamento** (com hoje como padrão e como máximo), a **conta bancária** (opcional), o **comprovante** e uma **observação**. Receber funciona igual, sem o comprovante.

O efeito no saldo da conta é o que amarra as duas telas:

| Ação                        | Efeito na conta bancária                           |
| --------------------------- | -------------------------------------------------- |
| **Pagar** uma despesa       | debita o valor; recusa se o saldo for insuficiente |
| **Desmarcar** o pagamento   | credita o valor de volta e **apaga o comprovante** |
| **Receber** uma entrada     | credita o valor                                    |
| **Desmarcar** o recebimento | debita o valor de volta                            |

Cada uma dessas operações roda em **transação**: ou o saldo muda e a despesa ou entrada é marcada, ou nada acontece. Não existe estado meio-pago.

Duas decisões que valem explicar: desmarcar um pagamento **apaga o comprovante**, porque um comprovante de um pagamento que não existe mais é lixo que confunde; já desmarcar um recebimento **preserva o vínculo com a conta**, porque ali a conta descreve para onde aquela entrada costuma cair — e vira a sugestão do próximo recebimento.

### 1.7 Comprovantes

O comprovante é anexado no momento do pagamento: **imagem (jpg, png, gif) ou PDF, até 10MB**. O arquivo é gravado na pasta de dados do app com um nome derivado do mês, do nome da despesa e do **id** — o id está ali porque duas despesas de mesmo nome no mesmo mês não podem sobrescrever o comprovante uma da outra.

Do detalhe da despesa, **"Abrir comprovante"** entrega o arquivo ao programa padrão do sistema — o app não tem visualizador próprio, e nem precisa. O arquivo é excluído junto com a despesa e ao desmarcar o pagamento.

### 1.8 Contas bancárias e categorias

**Contas bancárias** têm nome e saldo, e são o elo entre uma despesa a pagar e o dinheiro real. Excluir uma conta **não desfaz pagamentos**: as despesas e entradas que a referenciavam apenas deixam de apontar para ela — o diálogo de confirmação diz exatamente isso antes.

**Categorias** classificam as despesas e são a matéria-prima da aba de categorias do Histórico. Dez já vêm criadas na primeira execução (Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Assinaturas, Compras, Contas e Serviços, Outros), cada uma com sua cor — é um ponto de partida para ajustar, não uma lista fechada. Excluir uma categoria deixa as despesas dela **sem categoria**, em vez de excluí-las.

### 1.9 Despesas e entradas padrão

São os modelos do que se repete: nome, valor, dia de vencimento (ou dia previsto) e, conforme o caso, categoria ou conta bancária. **Todo mês novo nasce com uma cópia deles** — é o que faz o app valer a pena a partir do segundo mês.

O valor pode ficar em branco quando muda todo mês (luz, água): a despesa é criada mesmo assim, aparece como **"Valor variável"** e você preenche na hora de pagar. É melhor do que não cadastrar e esquecer.

Excluir um padrão só afeta o futuro: os meses já criados continuam intactos.

### 1.10 Histórico

O Histórico trabalha sobre **um ano por vez**, escolhido no seletor com setas no topo. Três indicadores resumem o ano: **Previsto do ano**, **Total de entradas** e **Total de despesas** — os dois últimos com a **variação percentual contra o ano anterior**, sinalizada conforme o sentido de cada um (gastar mais é ruim, receber mais é bom).

Duas abas, cada uma alternável entre **gráfico** e **tabela**:

- **Comparativo** — a linha do saldo previsto mês a mês, com o mês atual destacado por uma faixa de fundo. Cada ponto é verde ou vermelho conforme o sinal do saldo, e clicar nele (ou na linha da tabela) abre aquele mês.
- **Categorias** — barras horizontais com o total gasto por categoria no ano, da maior para a menor, cada uma na sua cor. O gráfico mostra as **sete maiores** e agrupa o resto em "Outras categorias", porque uma barra de 1% não informa nada e ainda achata as demais; a tabela mostra todas, com valor, percentual e quantidade de despesas.

Despesas sem categoria não somem: aparecem como "Sem categoria", em cinza neutro.

### 1.11 Backup: exportar e importar

**Exportar** gera um `.zip` (via diálogo nativo de salvar, com nome sugerido `export-meu-dinheiro-AAAA-MM-DD.zip`) contendo um `data.json` com todas as tabelas e a pasta `uploads` com os comprovantes. É o backup completo — não há nada do app fora dele.

**Importar** faz o caminho inverso e **substitui todos os dados atuais**, o que o diálogo de confirmação avisa em negrito antes de abrir o seletor de arquivo. A importação roda em transação: um ZIP inválido é recusado com mensagem própria e o banco fica como estava.

O importador é **tolerante com backups antigos**: arquivos gerados antes da renomeação "contas" → "despesas", ou antes de existirem entradas, contas bancárias e categorias, continuam sendo aceitos — as chaves que faltam entram vazias. Um backup que você fez há um ano ainda restaura hoje.
