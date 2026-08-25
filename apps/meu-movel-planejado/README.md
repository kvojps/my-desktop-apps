# Meu Móvel Planejado

App desktop (Electron) que planeja o **corte de chapas**: você cadastra as peças
de um serviço e as chapas de que dispõe, e o app diz onde cada peça cai, quanto
se aproveita e quanto material falta comprar — antes de a máquina ligar. Ele não
desenha o móvel; planeja a etapa seguinte, o corte da chapa. O arranjo que ele
produz é **nesting livre**, e isso pressupõe **corte em CNC**: o plano não é
executável em serra esquadrejadeira, que é a limitação mais importante do
produto ([§1.2](#12-o-plano-é-para-cnc--e-não-para-serra-esquadrejadeira)).

Tudo roda local: um banco SQLite na sua máquina, sem login, sem servidor e sem
nuvem. O backup é seu, num arquivo `.json` que você exporta quando quiser.

<!-- ![image](cole aqui o link da captura de tela) -->

## 1. Funcionalidades

### 1.1 Manual de uso

O app tem quatro telas: **Projetos** (a inicial), **Projeto** (onde o serviço é
descrito), **Plano** (a prancheta) e **Configurações**.

1. Em **Projetos**, crie um projeto com nome e **material**
   (`MDF 15 mm branco`). Um projeto é um serviço a planejar, e o material é um
   só — dois materiais são dois projetos
   ([§1.3](#13-projetos--um-material-por-projeto)).
2. Dentro do projeto, cadastre as **peças**: comprimento, largura, quantidade e
   um rótulo opcional (`lateral do armário`).
3. Cadastre as **chapas** de que você dispõe, com medida e quantidade. Retalhos
   de serviços anteriores entram aqui como chapas menores, e são consumidos
   antes das inteiras ([§1.5](#15-chapas--o-retalho-antes-da-chapa-inteira)).
4. Confira os **parâmetros de corte** — kerf e refile. O kerf já vem em 0,3 mm,
   que é medida de fresa; quem corta com disco de serra precisa mudar
   ([§1.6](#16-parâmetros-de-corte--kerf-e-refile)).
5. Clique em **Gerar plano**. O app procura o melhor arranjo em várias
   tentativas e abre a prancheta com as chapas desenhadas em escala.
6. **Imprima** (uma chapa por página) ou exporte em **PNG** e **PDF** para levar
   o plano à bancada.

As duas áreas no topo da tela de Projeto — área das peças e área em chapas —
são a conta de olho que antecede tudo isso: cabe ou não cabe no que eu tenho.

### 1.2 O plano é para CNC — e não para serra esquadrejadeira

O app arranja retângulos alinhados aos eixos **sem restrição de guilhotina**:
uma peça pode ficar cercada por outras, e o corte que a libera começa e termina
no meio da chapa. É o que uma CNC ou uma tupia fazem naturalmente.

Uma serra esquadrejadeira, não. Ela só faz **cortes passantes**, de borda a
borda, e o plano deste app quase sempre exige um corte que para no meio do
material. **A restrição é mecânica, não de precisão**: não é caprichar no corte,
é que a máquina não faz aquele corte.

Pela mesma razão o plano **não traz sequência de cortes**. Sequência de cortes é
conceito de corte guilhotinado — a ordem em que a chapa é partida em tiras —, e
aqui não existe partição em tiras a ordenar. O que o plano entrega é a posição
de cada peça na chapa.

### 1.3 Projetos — um material por projeto

Um projeto é um serviço a planejar: **um material**, as peças e as chapas. O
material é um rótulo livre (`MDF 15 mm branco`, `compensado 18 mm`), porque a
lista de materiais de uma oficina é dela, não do app.

**Peça e chapa não declaram material.** Dois materiais no mesmo móvel são dois
projetos. A limitação é deliberada e tem uma contrapartida concreta: como não há
material a conferir dentro do projeto, o app nunca planeja uma peça de 6 mm numa
chapa de 15 mm. Material como dimensão do estoque arrastaria agrupamento por
toda a interface — cadastro, plano, impressão — para resolver um caso que dois
projetos já resolvem.

A lista traz o material e a data da última alteração, e é ordenável pelas três
colunas. Excluir um projeto apaga junto as suas peças, as suas chapas e o seu
plano; o app diz isso antes de confirmar.

### 1.4 Peças

Comprimento, largura, quantidade e um rótulo opcional. A peça é **demanda**: o
que precisa ser cortado, não o que já foi. Uma peça de quantidade quatro vira
até quatro retângulos no desenho.

Peça sem rótulo não é dado faltando — ela se identifica pela medida, e é assim
que aparece na tabela, no desenho e na lista de compra.

**Peça maior que qualquer chapa do projeto é barrada no cadastro**, com a razão
escrita no próprio formulário: cada lado precisa caber no lado da chapa,
descontados o refile e o kerf **em cada borda**. Barrar na hora existe para essa
peça não ser descoberta depois no plano como se fosse falta de estoque —
comprar mais chapas do mesmo tamanho não a faria caber
([§1.9](#19-quando-falta-material)).

### 1.5 Chapas — o retalho antes da chapa inteira

O estoque é do **projeto**, não da oficina: é o retrato do que havia no momento
do planejamento. O app não observa a máquina, então não sabe quando a chapa foi
de fato consumida e não dá baixa em nada sozinho — um inventário global passaria
a mentir sobre o que existe encostado na parede.

Vários tamanhos convivem no mesmo projeto, que é como um estoque real é: algumas
chapas inteiras mais os retalhos dos serviços anteriores. Retalho e chapa
inteira são a mesma coisa no modelo, distinguidos só pelo tamanho.

**As chapas menores são consumidas primeiro.** O plano gasta o retalho antes de
abrir a chapa nova, para que a chapa nova sobreviva íntegra ao serviço. Esta é a
**única regra do plano que privilegia o serviço seguinte em vez do atual**: ela
pode custar um pouco de aproveitamento hoje em troca de uma chapa inteira
amanhã. Empate de área é desfeito pelo lado mais longo e, depois dele, pela
ordem de cadastro — sem isso dois formatos de mesma área trocariam de lugar
entre gerações, e o plano deixaria de ser reproduzível.

### 1.6 Parâmetros de corte — kerf e refile

**Kerf** é a largura de material que a ferramenta consome a cada contorno. O
default é **0,3 mm**, que é medida de fresa; quem corta com disco de serra
precisa subir para 3–4 mm, e é para isso que o campo é editável.

**Refile** é a margem descartada em cada borda da chapa antes de planejar. Vem
**zerada**, porque nem toda oficina refila.

**O kerf vale também contra a borda da chapa**, e não só entre peças vizinhas —
é a regra que mais muda a conta de quantas peças cabem. A fresa cobra a folga
dela na peça mais externa como cobra entre duas peças; ignorar isso faz a última
peça de cada chapa ser justamente a que não cabe na hora do corte.

A consequência prática costuma parecer erro do app: **uma peça de 100 mm não
cabe numa chapa de 100 mm**. O limite não é 100, nem 100 − 0,3: é
100 − 0,3 − 0,3, porque são duas bordas por eixo. Quando isso acontece, tanto o
cadastro quanto o plano escrevem a conta com os números do projeto, em vez de
mandar você conferir uma medida que costuma estar certa.

Toda medida é digitada e exibida em milímetros com uma casa decimal. Como a
regra da borda é modelada sem caso especial está em
[ADR-0001](docs/adr/0001-kerf-como-deslocamento-unico.md).

### 1.7 Gerar o plano

Gerar é **sempre um pedido explícito** — nenhuma alteração de peça ou de chapa
dispara o cálculo sozinha. É o que permite cadastrar o serviço inteiro sem o
resultado mudando debaixo de você.

O que acontece no clique:

- **Rotação de 90° é sempre permitida.** Não há veio no modelo, e girar aproveita
  mais material.
- **Doze tentativas**, combinando quatro ordenações das peças com três critérios
  de encaixe. Vence a que deixa menos material de fora; empatadas nisso, a que
  usa menos chapas; empatadas nisso, a de maior aproveitamento.
- **Determinístico**: sem aleatoriedade e sem relógio. O mesmo projeto gera
  sempre o mesmo plano — o que muda o resultado é você ter mudado o projeto.
- O botão troca o rótulo para **"Gerando..."** enquanto trabalha; é o único
  indicador de ação em andamento do app.

**As peças que ficam de fora — as não alocadas — são as menores.** Isso é
decisão declarada, não acaso: todas as quatro ordenações põem a peça grande
primeiro, então, quando o estoque acaba, o que restou na fila é o menor. O que
fica para a próxima compra é sempre a ponta pequena do serviço, e não uma peça
grande no meio dele.

O passo a passo do empacotador está em
[`docs/empacotamento.md`](docs/empacotamento.md).

### 1.8 A prancheta

Cada chapa do plano desenhada **em escala**, com as peças no lugar, e navegação
entre elas. Dentro de cada retângulo vão o número da peça, o rótulo e a medida
**como ela foi desenhada** — numa peça girada, a medida cadastrada contradiria o
que está à vista.

O rótulo só aparece quando **cabe**, e caber é medido, não estimado. Quando não
cabe, fica o número; quando nem o número cabe, quem identifica a peça é a
**legenda ao lado** do desenho. O número vale para o plano inteiro: "peça 3" é a
mesma peça na chapa 1 e na chapa 4, na tela e no papel.

A **sobra** aparece hachurada — é o que continua visível depois de as peças
serem desenhadas por cima. O refile não é hachurado: ele está fora do
denominador do aproveitamento, e pintá-lo faria o desenho contradizer o número
ao lado.

O **aproveitamento** é a fração da área útil ocupada pelas peças em si, sem o
kerf que cada uma consome ao redor, e aparece por chapa e para o plano inteiro.
Sobra é medida em percentual e **não é promessa de retalho**: em nesting livre o
que resta é uma região poligonal, não um retângulo que se guarde na parede.

### 1.9 Quando falta material

Quando o estoque não cobre o serviço, o app não falha em silêncio — e mantém
**duas listas separadas**, porque a saída de cada uma é o oposto da outra:

| Lista na tela        | O nome no domínio    | O que é                                                 | O que resolve                          |
| -------------------- | -------------------- | ------------------------------------------------------- | -------------------------------------- |
| **Faltou chapa**     | peça **não alocada** | A peça cabe nas suas chapas; o que acabou foi o estoque | Comprar chapa                          |
| **Peças rejeitadas** | peça **rejeitada**   | A peça não cabe em chapa nenhuma do projeto, nem girada | Chapa maior — comprar mais não resolve |

Somar as duas faria o app recomendar uma compra inútil, e é por isso que a peça
rejeitada fica **fora** da conta de déficit. Junto dela vai a regra de encaixe
com os números do projeto ([§1.6](#16-parâmetros-de-corte--kerf-e-refile)), que
é quase sempre o que decidiu a rejeição.

O **déficit** é a área que falta para alocar as peças que couberam na primeira
lista, em m² e já com o kerf de cada peça. Ele é traduzido em número de chapas
do maior formato do projeto — dizendo qual formato entrou na divisão, porque sem
isso não é um pedido que se faça na loja.

**A contagem de chapas é limite inferior**, e a tela diz "**pelo menos** N
chapas", nunca "N chapas". A conta é por área e **ignora o encaixe**: a área que
falta só caberia exatamente em N chapas se as peças se encaixassem sem perda
nenhuma, e não é isso que acontece — sobra sempre uma faixa que nenhuma peça
preenche. **O número real pode ser maior, nunca menor.** Prometer o valor exato
faria o marceneiro descobrir na hora do corte que a conta era otimista, que é
justamente o erro que o app existe para evitar. Pela mesma razão o divisor não é
a medida bruta da chapa, e sim a área em que aquele formato de fato empacota, já
descontados o refile e o kerf.

Sem nenhuma chapa cadastrada não há formato de referência, e o déficit fica só
em área. E um plano com estoque insuficiente **ainda desenha o que dá para
cortar hoje**: o serviço adianta enquanto a compra não chega.

### 1.10 O plano fica salvo — e pode ficar desatualizado

O plano é **snapshot, não derivação**: um por projeto, gravado com a data em que
saiu. Reabrir o projeto amanhã devolve o mesmo desenho, e não um recalculado —
gerar é uma ação com custo e com resultado escolhido entre tentativas, e
recalcular na abertura poderia devolver um plano diferente daquele que já foi
impresso e levado à máquina.

A contrapartida é que **o plano pode ficar desatualizado**. Alterar uma peça,
uma chapa ou um parâmetro de corte depois de gerar deixa o desenho para trás. O
app avisa na tela do Plano, com a data da alteração — é assim que se confere se
ela foi antes ou depois do papel que está na bancada — e oferece **Gerar de
novo** ali mesmo, sem voltar uma tela.

O aviso **não apaga nada**. O plano continua sendo o vigente e continua
desenhado embaixo: é ele que está na mão de quem corta, e cortar por ele pode
ser exatamente o que você quer. A detecção é por carimbo de tempo, não por
comparação de conteúdo — mexer numa peça e desfazer a alteração ainda marca o
plano como desatualizado.

Gerar de novo **substitui** o plano anterior. Não há histórico de planos por
projeto.

### 1.11 Levar para a bancada — impressão, PNG e PDF

Quem executa o corte costuma não ser quem planejou, então o plano precisa sair
do app.

**Impressão**: uma **chapa por página**, precedidas de uma **página de resumo**
com a lista de peças e o que falta comprar — o serviço inteiro conferível numa
folha só. A folha sai **legível em preto e branco**, porque a impressora da
oficina não tem colorido: sem cor de fundo, sobra em hachura, e o número da peça
no papel é o mesmo número da tela.

**PNG** para mandar ao ajudante pelo celular e **PDF** para arquivar junto com o
orçamento do serviço. Nos dois casos você escolhe onde salvar, e o nome sugerido
já carrega o projeto e a data — fora do app, o nome é o único contexto que
resta.

### 1.12 Configurações

Backup e restauração em `.json`, tema claro ou escuro, e a versão do app com o
caminho do banco em disco (com botão para abrir a pasta).

Importar um backup **apaga todos os projetos, peças, chapas e planos** deste
computador e põe no lugar os do arquivo; o app pede confirmação dizendo isso. Se
o arquivo for recusado, nada é alterado.

## 2. O que este app não faz

Limites conscientes, não pendências disfarçadas:

- **Corte guilhotinado** e sequência de cortes para serra esquadrejadeira
  ([§1.2](#12-o-plano-é-para-cnc--e-não-para-serra-esquadrejadeira)).
- **Estoque de retalhos entre projetos** — a sobra de um serviço virando
  matéria-prima do próximo. É o recurso mais valioso a longo prazo, e depende de
  saber quando o retalho foi de fato consumido, que o app não observa.
- **Maior retângulo livre inscrito na sobra.** Só ganha sentido junto do estoque
  de retalhos; até lá, percentual é a medida honesta.
- **Vários materiais no mesmo projeto**
  ([§1.3](#13-projetos--um-material-por-projeto)).
- **Veio** ou restrição de rotação por peça.
- **Histórico de planos.** Um plano vigente por projeto.
- **Peças não retangulares**, recortes internos e furação.
- **Custo de material** e orçamento.
- **Exportação para a máquina** (G-code, DXF).
