# Meu Móvel Planejado

App desktop que planeja o **corte de chapas**: dadas as peças de um serviço e as
chapas de que se dispõe, diz onde cada peça cai, quanto se aproveita e quanto
material falta comprar. Ele não desenha o móvel — planeja a etapa seguinte, o
corte da chapa.

Este glossário existe porque a linguagem de oficina confunde três pares que o app
precisa manter separados: chapa disponível e chapa desenhada, peça que não coube e
peça que não cabe, sobra de um plano e retalho de estoque.

## Language

### O projeto

**Projeto de corte**:
Um serviço a planejar: um material, as peças que precisam ser cortadas e as chapas
de que se dispõe. É a unidade que o app cria, lista, renomeia e exclui.
_Avoid_: serviço, obra, job, orçamento

**Material**:
Rótulo livre do projeto que descreve a chapa bruta (`MDF 15 mm branco`). Peça e
chapa não declaram material — dois materiais são dois projetos.
_Avoid_: tipo de chapa, espessura, acabamento

**Peça**:
Retângulo que precisa ser cortado, com comprimento, largura, quantidade e um
rótulo opcional. É demanda, não resultado: a peça já cortada não existe no modelo.
_Avoid_: item, corte, pedaço

**Chapa**:
Retângulo de matéria-prima disponível no projeto, com medida e quantidade. É
sempre disponibilidade — nunca o desenho do resultado, que é a chapa planejada.
_Avoid_: folha, placa, painel

**Retalho**:
Chapa pequena, sobrada de um serviço anterior; no modelo é uma chapa como qualquer
outra, distinguida só pelo tamanho. Designa estoque, nunca o que sobra de um plano
deste app.
_Avoid_: resto, sucata

**Estoque do projeto**:
O conjunto das chapas de um projeto. Pertence ao projeto, não à oficina: é o
retrato do que havia no momento do planejamento, e o app não observa a máquina
para saber quando a chapa foi de fato consumida.
_Avoid_: inventário, almoxarifado, estoque (sem qualificar)

### Geometria do corte

**Kerf**:
Largura de material que a fresa consome a cada contorno, aparecendo como folga
entre peças vizinhas **e** entre peça e borda útil. Parte de 0,3 mm, que é medida
de fresa — disco de serra fica em 3–4 mm.
_Avoid_: espessura da fresa, sangria, folga

**Refile**:
Margem descartada em cada borda da chapa antes de planejar: material que existe
mas não será usado. Parte de zero, porque nem toda oficina refila.
_Avoid_: margem, aparo, borda

**Área útil**:
A chapa menos o refile dos dois lados: o material de que o plano dispõe, e a base
de que o aproveitamento é fração. O retângulo acrescido de um kerf sobre o qual o
empacotamento roda é artifício de cálculo, não área útil.
_Avoid_: área da chapa, área bruta

**Nesting livre**:
Arranjo de retângulos alinhados aos eixos, sem restrição de guilhotina. Pressupõe
corte em CNC ou tupia; por isso o plano **não** tem sequência de cortes, que é
conceito de serra esquadrejadeira.
_Avoid_: otimização de corte, sequência de cortes, plano guilhotinado

**Décimo de milímetro**:
A unidade em que toda medida trafega e é persistida, sempre como inteiro
(2750 mm = 27500). Milímetro com uma casa decimal existe só na digitação e na
formatação de tela.
_Avoid_: mm (como unidade de armazenamento)

### O plano

**Geração**:
O ato explícito de produzir um plano de corte a partir do projeto, substituindo o
plano vigente. Sempre pedida pelo usuário, nunca disparada por alteração de peça ou
de chapa.
_Avoid_: cálculo, otimização, recálculo

**Plano de corte**:
O resultado salvo de uma geração — as chapas planejadas, o que ficou de fora e a
data —, um por projeto. É snapshot, não derivação: só muda quando o usuário manda
gerar de novo.
_Avoid_: resultado, layout, nesting, otimização

**Chapa planejada**:
Uma chapa do estoque já desenhada no plano, com as colocações que caíram nela, seu
aproveitamento e sua sobra. É a chapa vista do lado do resultado.
_Avoid_: chapa (sem qualificar), folha do plano

**Colocação**:
A posição e a orientação de uma peça dentro de uma chapa planejada — origem e se
ela foi girada em 90°. Uma peça de quantidade quatro produz até quatro colocações.
_Avoid_: alocação, posicionamento, encaixe, instância

**Aproveitamento**:
Fração da área útil ocupada pelas peças em si, sem o kerf que cada uma consome ao
redor. Medido por chapa planejada e para o plano inteiro.
_Avoid_: eficiência, rendimento, ocupação

**Sobra**:
O que resta da área útil de uma chapa planejada depois das colocações. Em nesting
livre é uma região poligonal, não um retângulo: esta versão a mede como percentual
e **não** promete reaproveitá-la.
_Avoid_: retalho, resto, refugo

**Plano desatualizado**:
Plano gerado antes da última alteração do projeto que o originou, detectado por
carimbo de tempo. Continua sendo o plano vigente e continua visível — o que muda é
o aviso de que o papel na bancada não corresponde mais ao projeto.
_Avoid_: plano inválido, obsoleto, sujo

### Quando falta material

**Peça não alocada**:
Peça que caberia em alguma chapa do projeto, mas ficou de fora porque o estoque
acabou. Resolve-se comprando chapa, e é ela que entra no déficit.
_Avoid_: peça de fora, peça faltante

**Peça rejeitada**:
Peça maior que qualquer chapa do projeto: não cabe em nenhuma, e comprar mais
chapas não muda isso — por isso fica fora do déficit, e tratá-la como não alocada
faria o app recomendar uma compra inútil. É barrada no cadastro, e o plano ainda
assim a classifica, porque a chapa que a comportava pode ter sido excluída depois.
_Avoid_: peça inválida, peça grande demais

**Déficit**:
Área que falta para alocar as peças não alocadas, em m², contando cada peça já
acrescida do kerf. Peça rejeitada não entra nessa conta.
_Avoid_: falta, saldo negativo

**Chapa equivalente**:
A tradução do déficit em número de chapas do maior formato do projeto. Como a
conta por área ignora encaixe, é **limite inferior**: a tela diz "pelo menos N
chapas", nunca "N chapas".
_Avoid_: chapas necessárias, chapas faltantes
