# Meu Móvel Planejado — planejamento de corte de chapas

Status: ready-for-agent

Quarto app do monorepo, ao lado de Meu Dinheiro, Meu Negócio e Git Dlog. Mesmas
camadas, mesmo tratamento de erro, mesmas convenções — e, como os outros, um
`src/shared` próprio, sem código compartilhado entre apps.

## Problem Statement

Quem corta MDF numa CNC precisa decidir, antes de ligar a máquina, como distribuir
as peças de um serviço pelas chapas que tem à disposição. Hoje essa conta é feita
no papel ou de cabeça.

Isso custa de três formas. Primeiro, **desperdício**: um arranjo pior do que o
possível joga fora material que já foi pago. Segundo, **descoberta tardia**: a
pessoa só percebe que faltou chapa quando já cortou as outras, e aí o serviço para
no meio esperando compra. Terceiro, **erro silencioso**: a conta de cabeça
costuma esquecer que a fresa come material a cada contorno, e a última peça de
cada chapa é justamente a que não cabe.

O estoque real também não é uniforme — são algumas chapas inteiras mais retalhos
de serviços anteriores, cada um de um tamanho — e é essa mistura que torna a conta
mental inviável.

## Solution

Um app desktop onde a pessoa cadastra um **projeto de corte**: o material, as
peças que precisa (medida e quantidade) e as chapas de que dispõe (medida e
quantidade). Ao pedir, o app gera um **plano de corte**: um desenho em escala de
cada chapa, mostrando onde cada peça cai, quanto se aproveitou e o que sobrou.

Quando o estoque não cobre a demanda, o app não falha em silêncio: ele diz quais
peças ficaram de fora e quanto material falta, em m² e traduzido em número de
chapas, para que a compra possa ser feita antes de o serviço começar.

O plano é imprimível — uma chapa por página — e exportável como PNG e PDF, porque
quem executa o corte costuma não ser quem planejou.

Tudo local: um banco SQLite na máquina, sem login, sem servidor, sem nuvem, como
nos outros apps do monorepo.

## User Stories

**Projetos**

1. Como marceneiro, quero criar um projeto de corte com nome e material, para separar um serviço do outro.
2. Como marceneiro, quero ver a lista dos meus projetos com o material e a data da última alteração, para retomar o que estava fazendo.
3. Como marceneiro, quero renomear e excluir um projeto, para manter a lista limpa quando o serviço acabar.
4. Como marceneiro, quero que o material seja um rótulo livre (`MDF 15 mm branco`), para descrever o que de fato uso sem escolher de uma lista que não é minha.
5. Como marceneiro que usa dois materiais no mesmo móvel, quero criar dois projetos, para que o app nunca planeje uma peça de 6 mm numa chapa de 15 mm.
6. Como usuário de primeira viagem, quero uma tela inicial que explique que não há projeto ainda e como criar um, para não ficar diante de uma tela vazia sem saída.

**Peças**

7. Como marceneiro, quero cadastrar uma peça com comprimento, largura e quantidade, para descrever o que preciso cortar.
8. Como marceneiro, quero dar um rótulo opcional à peça (`lateral do armário`), para reconhecer o pedaço depois de cortado.
9. Como marceneiro, quero editar e excluir peças, porque o projeto muda enquanto eu desenho o móvel.
10. Como marceneiro, quero ver a área total das peças cadastradas, para ter noção do tamanho do serviço antes mesmo de gerar o plano.
11. Como marceneiro, quero ser barrado na hora se cadastrar uma peça maior que qualquer chapa que tenho, para não descobrir isso depois como se fosse falta de estoque.

**Chapas**

12. Como marceneiro, quero cadastrar as chapas de que disponho com medida e quantidade, para planejar sobre o que tenho de verdade.
13. Como marceneiro com retalhos, quero cadastrar vários tamanhos diferentes de chapa no mesmo projeto, porque meu estoque não é uniforme.
14. Como marceneiro, quero que o app use meus retalhos antes das chapas inteiras, para que a chapa nova continue inteira para o próximo serviço.
15. Como marceneiro, quero ver a área total disponível, para comparar de olho com a área das peças.

**Parâmetros de corte**

16. Como operador de CNC, quero informar o kerf da minha fresa, para que o plano corresponda ao que a máquina realmente faz.
17. Como operador de CNC, quero que o kerf seja aplicado também contra a borda da chapa, para que a peça mais externa não saia com um lado a menos.
18. Como marceneiro que refila a chapa, quero informar a margem de refile, para que o plano não conte com material que eu vou descartar.
19. Como marceneiro que não refila, quero que o refile venha zerado, para não ter que entender um campo que não uso.

**Gerar o plano**

20. Como marceneiro, quero pedir a geração do plano quando eu estiver pronto, para não ter o resultado mudando enquanto ainda estou cadastrando peça.
21. Como marceneiro, quero que o app procure um bom arranjo em várias tentativas, para aproveitar mais material do que eu aproveitaria à mão.
22. Como marceneiro, quero que o mesmo projeto produza sempre o mesmo plano, para não desconfiar do app quando o resultado muda sem eu mexer em nada.
23. Como marceneiro, quero ver o botão dizer que está gerando, para saber que o app não travou.
24. Como marceneiro, quero que o app gire as peças quando isso ajudar, porque meu MDF não tem veio e girar aproveita mais.

**Ver o plano**

25. Como marceneiro, quero ver cada chapa desenhada em escala, com as peças no lugar, para conferir o plano com os olhos antes de cortar.
26. Como marceneiro, quero que cada peça mostre seu rótulo e sua medida dentro do desenho, para saber qual pedaço é qual.
27. Como marceneiro, quero navegar entre as chapas do plano, para percorrer o serviço inteiro.
28. Como marceneiro, quero ver o aproveitamento de cada chapa e do plano todo, para julgar se vale tentar de novo com outras medidas.
29. Como marceneiro, quero ver a sobra de cada chapa destacada no desenho, para enxergar onde o material está sendo perdido.

**Quando falta material**

30. Como marceneiro, quero ver quais peças não couberam no meu estoque, para saber o que vai ficar para depois.
31. Como marceneiro, quero ver quanto material falta em m², para ter o número exato do déficit.
32. Como marceneiro, quero ver esse déficit traduzido em número de chapas, para saber o que pedir na loja.
33. Como marceneiro, quero que o app diga "pelo menos N chapas" e não "N chapas", para não descobrir na hora do corte que a conta por área era otimista.
34. Como marceneiro, quero que o plano com estoque insuficiente ainda me mostre o que dá para cortar hoje, para adiantar o serviço enquanto a compra não chega.

**Plano e alterações**

35. Como marceneiro, quero que o plano gerado fique salvo com a data, para reabrir o projeto amanhã e encontrar o mesmo plano que imprimi.
36. Como marceneiro, quero ser avisado quando eu alterar peças ou chapas depois de gerar, para não levar para a bancada um papel que não corresponde mais ao projeto.
37. Como marceneiro, quero poder gerar de novo a qualquer momento, substituindo o plano anterior, para atualizar depois de mexer no projeto.

**Levar para a bancada**

38. Como marceneiro, quero imprimir o plano com uma chapa por página, para ter uma folha por chapa na máquina.
39. Como marceneiro, quero uma página de resumo antes das chapas, com a lista de peças e o que falta, para conferir o serviço inteiro numa folha só.
40. Como marceneiro, quero que a impressão saia legível em preto e branco, porque a impressora da oficina não tem colorido.
41. Como marceneiro, quero exportar o plano como PNG, para mandar ao ajudante pelo celular.
42. Como marceneiro, quero exportar o plano como PDF, para arquivar junto com o orçamento do serviço.
43. Como marceneiro, quero escolher onde salvar o arquivo exportado, para organizar por cliente do meu jeito.

**Configurações e dados**

44. Como usuário, quero alternar entre tema claro e escuro, como nos outros apps.
45. Como usuário, quero que a janela abra já no tema certo, sem piscar branco.
46. Como usuário, quero exportar meus dados num arquivo `.json`, para ter backup.
47. Como usuário, quero importar um backup, para recuperar meus projetos em outra máquina.
48. Como usuário, quero ver o caminho do banco em disco e abrir a pasta, para saber onde meus dados moram.
49. Como usuário, quero ver a versão do app, para saber o que estou rodando.

**Falhas**

50. Como usuário, quero uma mensagem clara e a opção de tentar de novo quando uma tela falhar ao carregar, em vez de uma tela em branco.
51. Como usuário, quero que o app me avise e ofereça abrir a pasta de dados se o banco não abrir, em vez de sumir sem explicação.

## Implementation Decisions

### Domínio

O app é um **contexto próprio**, com glossário e ADRs próprios, seguindo o padrão
multi-context do repo. O glossário do app define, no mínimo: **projeto de corte**,
**peça**, **chapa**, **plano de corte**, **colocação**, **peça não alocada**,
**peça rejeitada**, **aproveitamento**, **sobra**, **kerf**, **refile**,
**déficit** e **chapa equivalente**.

Distinções que o glossário precisa fixar, porque a linguagem informal as confunde:

- **Não alocada** ≠ **rejeitada**. Não alocada é peça que caberia, mas o estoque
  acabou — resolve-se comprando chapa. Rejeitada é peça maior que qualquer chapa
  do projeto — comprar mais chapas não resolve, e tratá-las igual faria o app
  recomendar uma compra inútil.
- **Sobra** não é **retalho**. Em nesting livre o que sobra é uma região
  poligonal, não um retângulo; esta versão mede sobra como percentual e
  deliberadamente **não** promete reaproveitamento.
- **Chapa** é sempre uma chapa disponível no projeto; a chapa desenhada no
  resultado é uma **chapa planejada**.

### Corte e geometria

- **2D, nesting livre**: peças retangulares alinhadas aos eixos, sem restrição de
  guilhotina. Isso pressupõe corte em CNC/tupia — o plano **não** é executável em
  serra esquadrejadeira, e o README do app diz isso.
- Como consequência, **não existe "sequência de cortes"** no produto: sequência de
  cortes é conceito guilhotinado.
- **Rotação de 90° sempre permitida**. Não há veio no modelo.
- **Kerf** é folga entre peças vizinhas **e** entre peça e borda útil. Modelado
  sem caso especial: cada peça ocupa `(comprimento + kerf) × (largura + kerf)`, e
  a área útil da chapa é `(comprimento − 2·refile + kerf) × (largura − 2·refile +
  kerf)`. Esse deslocamento único produz exatamente um kerf de folga em toda
  fronteira, inclusive contra a borda.
- Default de kerf: **0,3 mm**. Default de refile: **0**. Ambos são campos do
  projeto.

### Unidades

Toda medida trafega e é persistida em **décimos de milímetro, como inteiro**
(2750 mm = 27500). Kerf fracionário torna a aritmética de empacotamento em ponto
flutuante uma fonte de "não cabe por 0,0000001 mm"; inteiro elimina a classe
inteira de erro. A conversão para milímetro com uma casa decimal acontece só na
formatação da tela, e a leitura do banco converte no `rowToX` do repositório, como
manda a convenção do monorepo.

### Estoque

O estoque de chapas **pertence ao projeto**, não à oficina. Um inventário global
exigiria saber quando a chapa foi de fato consumida, e o app não observa a
máquina — ele passaria a mentir sobre o que existe na parede. O estoque do projeto
é um retrato do momento do planejamento.

**Consumo do menor para o maior**: retalhos entram antes das chapas inteiras, para
que a chapa grande sobreviva íntegra ao serviço.

### Material

**Um material por projeto**, como rótulo livre. Peça e chapa não declaram
material. Dois materiais = dois projetos. Material como dimensão do estoque é o
destino natural, mas arrastaria agrupamento por toda a UI; a limitação é explícita
no README do app.

### Algoritmo

Vive num módulo de **nesting dentro de `shared`** — que o repo define como o lugar
de tipos e funções puras — e é uma função pura, sem React, sem Electron, sem
banco.

- **MaxRects** com lista de retângulos livres e encaixe por *best short side fit*,
  com rotação.
- **Melhor de N tentativas**: combinações de ordenação das peças (área ↓, maior
  lado ↓, largura ↓, comprimento ↓) por critérios de encaixe. Escolhe por menos
  chapas usadas, desempatando por maior aproveitamento.
- **Determinístico**: mesma entrada, mesmo plano, sem aleatoriedade nem
  dependência de relógio.
- **Peças que ficam de fora** são as menores, porque o empacotamento roda por área
  decrescente. Isso é decisão declarada, não acaso, e vai escrita no README.
- **Déficit**: soma das áreas infladas pelo kerf das peças não alocadas, reportada
  em m² e traduzida para número de chapas do maior formato do projeto. Como a
  conta por área ignora encaixe, ela é **limite inferior** — a UI diz "pelo menos
  N chapas".

O algoritmo roda no **renderer** e o resultado é persistido por IPC; o processo
main não empacota. O precedente do repo é lógica de domínio pura morando fora do
main quando ela não toca banco nem sistema de arquivos. Para não travar a
interface durante as tentativas, o laço cede o controle entre elas, de modo que o
rótulo do botão consiga repintar — o design system proíbe `CircularProgress`, e a
troca de rótulo é o único indicador de ação em andamento.

### Persistência

Schema novo, criado inteiro no `SCHEMA` de instalação nova, com a lista de
migrações nascendo vazia. Tabelas: projetos; peças do projeto; chapas do projeto;
planos; chapas planejadas; colocações; peças não alocadas; e a tabela
chave-valor de configurações onde mora a preferência de tema.

**Plano é snapshot, não derivação.** Gerar é uma ação com custo e com resultado
escolhido entre tentativas; recalcular a cada abertura desperdiçaria esforço e,
pior, poderia devolver um plano diferente daquele que já foi impresso e levado à
máquina.

**Detecção de plano desatualizado** é por carimbo de tempo: o plano guarda o
instante de alteração do projeto que o originou, e está desatualizado quando o
projeto foi alterado depois. Toda escrita em projeto, peça ou chapa atualiza esse
carimbo. Sem hash, sem comparação de conteúdo.

### IPC

Canais nomeados `dominio:acao`, com a lista de **leituras** enumerada e todo canal
fora dela disparando a notificação de dados alterados — a convenção do monorepo,
onde esquecer de classificar um canal custa uma recarga a mais, nunca um valor
velho na tela. Nenhum handler usa `ipcMain.handle` direto: sempre o wrapper que
passa a falha por `toIpcError`. Toda entrada vinda do renderer passa por zod.

### Telas

Quatro telas, **sem Dashboard**: **Projetos** (a inicial), **Projeto**, **Plano**
e **Configurações**. Dashboard existe nos apps de negócio porque há série temporal
e dinheiro a resumir; aqui, "aproveitamento médio dos meus projetos" é métrica
sobre a qual ninguém age.

Plano é tela separada de Projeto justamente para que a prancheta receba a viewport
inteira — o design system manda tela de leitura preencher a viewport e tela de
lista rolar.

### Desenho

SVG, com `viewBox` em décimos de milímetro, de modo que as coordenadas do plano
entrem no desenho sem conversão. Um retângulo por peça, com rótulo e medida
dentro. Cor por grupo de dimensão, vinda da paleta categórica de dez swatches do
design system; a cor do rótulo é decidida por luminância do preenchimento.

O rótulo só aparece quando cabe, e "cabe" é medido, não estimado — o repo já tem
prior art de medição de texto por elemento pendurado no documento, feita
deliberadamente sem contexto de canvas porque dígito tabular é mais largo que o
proporcional. Quando não cabe, fica o número da peça e a legenda ao lado.

### Design system primeiro

O design system é normativo e determina que decisão nova se escreve nele **antes**
do código. Este app abre três lacunas, e as três entram no documento como parte
desta feature:

1. **Superfície métrica em escala** — exceção nomeada à regra de que altura de
   gráfico nunca deriva do conteúdo. A altura de uma chapa desenhada *é* a
   proporção da chapa. A regra original segue valendo para gráfico.
2. **Impressão** — não existe hoje nenhuma norma de impressão nem nenhum código
   de impressão em nenhum app. Entra a regra de uma chapa por página, quebra de
   página, ausência de cor de fundo e sobra em hachura.
3. **Rótulo sobre preenchimento colorido** — a escolha preto/branco por
   luminância existe hoje escondida num formulário de categoria de outro app.
   Vira helper exportado do módulo de tema, com a regra escrita, sem revogar a
   proibição de âmbar e texto desabilitado como texto.

### Saída em arquivo

Impressão e PDF pelas APIs do próprio Electron; PNG serializando o SVG e
rasterizando no renderer, com a gravação feita no main. Os três seguem o padrão
de exportação que já existe no repo: diálogo **modal da janela**, cancelamento
devolvido como resultado e não como exceção, e escrita de arquivo no main.

### Estrutura do app

Estrutura de diretórios copiada do app menor do monorepo, cujo arquivo de
migrações está vazio e serve de template. O **conteúdo do tema**, porém, vem do
app mais completo — o menor não tem os helpers de tinta, listra, container query
nem os overrides de tabela e input. Root recebe os scripts de dev e distribuição
do app novo, e a tabela de apps do README raiz recebe a linha correspondente.

## Testing Decisions

**O que faz um bom teste aqui**: testar o que o usuário observa no plano —
quantas chapas foram usadas, onde as peças caíram, o que ficou de fora, quanto
falta — e nunca a mecânica interna do empacotador. A escolha de heurística, a
ordem das tentativas e a estrutura da lista de retângulos livres são
implementação: trocar MaxRects por outra abordagem melhor não deve quebrar um
único teste, desde que os planos continuem válidos e não piores.

**Um seam só**: a função de empacotamento, que recebe peças, chapas, kerf e refile
e devolve o **resultado completo** — colocações por chapa, aproveitamento, peças
não alocadas, peças rejeitadas, déficit em m² e a equivalência em chapas. Calcular
déficit fora dela criaria um segundo seam justamente sobre a conta que originou o
pedido do usuário. Renderer e banco ficam do lado de fora: um exibe, o outro
guarda.

**Prior art**: o único teste do monorepo hoje é um teste de lógica pura, colocado
ao lado do módulo testado, com imports explícitos do vitest, `it` em português e
mensagem por item dentro do laço de asserção. O `vitest.config.ts` da raiz declara
que a suíte cobre só lógica pura — nada de Electron, DOM ou banco — e o glob nem
alcança `.tsx`.

**Casos que o seam precisa cobrir**:

- ladrilhamento exato com kerf zero: quatro peças que preenchem a chapa → uma
  chapa, aproveitamento total;
- o mesmo conjunto com kerf realista → não cabe, e o app usa uma chapa a mais;
- kerf aplicado contra a borda: peça do tamanho exato da chapa não cabe com kerf
  maior que zero;
- refile reduz a área útil na medida declarada;
- rotação usada quando é a única forma de a peça caber;
- chapas menores consumidas antes das maiores;
- estoque insuficiente: as peças certas ficam de fora e o déficit corresponde à
  área delas;
- peça maior que qualquer chapa é **rejeitada**, e não contada como não alocada
  nem somada ao déficit de compra;
- determinismo: duas execuções da mesma entrada devolvem resultado idêntico;
- entrada vazia e projeto sem chapas não quebram.

**O desenho não é testado.** A geometria já está coberta no seam; o SVG apenas
traduz coordenadas já validadas. Adicionar jsdom mudaria a natureza da suíte do
monorepo inteiro por causa de um app. A prancheta é verificada rodando o app.

## Out of Scope

- **Corte guilhotinado** e, com ele, sequência de cortes para serra
  esquadrejadeira. O app é para CNC.
- **Estoque de retalhos persistente** — a sobra de um projeto virando matéria-prima
  do próximo. É o recurso mais valioso a longo prazo, e depende de resolver quando
  o retalho é consumido de fato, que o app não observa.
- **Maior retângulo livre inscrito** na sobra. Só ganha sentido junto do estoque de
  retalhos; até lá, aproveitamento percentual é a medida honesta.
- **Material como dimensão do estoque** — misturar espessuras num projeto.
- **Veio / restrição de rotação por peça.**
- **Histórico de planos** por projeto. Um plano vigente por projeto.
- **Botão "tentar melhorar"** pedindo mais esforço ao otimizador.
- **Dashboard** e qualquer métrica agregada entre projetos.
- **Peças não retangulares**, recortes internos, furação.
- **Custo de material** e orçamento.
- **Exportação para a máquina** (G-code, DXF).

## Further Notes

- O briefing original pedia "mostrar quantas folhas estão faltando". A conversa
  chegou a m² como número primário, e a contagem de chapas ficou como tradução
  derivada dele. As duas informações aparecem, mas a contagem é apresentada como
  limite inferior — é o que mantém a resposta honesta sem perder a utilidade que o
  pedido original tinha.
- O default de kerf de 0,3 mm foi confirmado pelo usuário junto com a escolha de
  nesting livre, e as duas coisas são coerentes entre si: 0,3 mm é fresa, não
  disco de serra. Vale registrar que um disco de serra fica em 3–4 mm, para o caso
  de alguém abrir o app com outra máquina em mente — o campo é editável
  justamente por isso.
- O nome **Meu Móvel Planejado** foi escolhido pelo usuário, sobre o diretório
  `meu-movel-planejado`. Ele segue a família de Meu Dinheiro e Meu Negócio, onde o
  "Meu" nomeia algo que pertence a quem usa. Fica registrada a ressalva levantada
  na escolha e assumida conscientemente: *móvel planejado* é termo consagrado da
  indústria e designa o produto final da marcenaria, então o nome sugere um app de
  **projetar o móvel**, enquanto este planeja o **corte da chapa** — a etapa
  seguinte. Se um dia o produto crescer para o desenho do móvel, o nome já cabe;
  até lá, o README do app precisa ser explícito sobre o que ele faz.
- A regra de consumir chapas menores primeiro nasceu como recomendação e passou
  sem objeção explícita. É a tradução operacional do desempate "sobra
  concentrada", e é a única regra do plano que privilegia o serviço *seguinte* em
  vez do atual.

## Comments

**2026-08-22 — correção da aritmética do kerf (ticket 04).**

A linha de "Corte e geometria" diz que a área útil da chapa é
`(comprimento − 2·refile + kerf) × (largura − 2·refile + kerf)`. O sinal está
trocado: com a área **acrescida** de um kerf, a peça mais externa encosta na
borda com folga zero e uma peça do tamanho exato da chapa cabe — o oposto do que
a própria linha afirma em seguida ("um kerf de folga em toda fronteira, inclusive
contra a borda"), da user story 17 e do caso de teste que este mesmo documento
exige em "Testing Decisions". O empacotamento roda na área útil **diminuída** de
um kerf. O texto acima fica como está, para preservar o registro; a decisão está
em `apps/meu-movel-planejado/docs/adr/0001-kerf-como-deslocamento-unico.md`, e o
verbete "Área útil" do `CONTEXT.md` já foi corrigido.
