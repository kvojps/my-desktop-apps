Status: resolved
Type: task
Blocked by: 03

# 04: Histórico, gráficos e tabelas

## What to build

Migrar a análise anual preservando indicadores, distribuições e consulta de Mês com retorno ao contexto.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

pages/history/, hooks/categories/useCategoryTotals.ts e theme/chartTheme.ts.

## Critérios de aceite

- [x] Preservar seleção de ano e quatro indicadores: Previsto do ano, Total de entradas, Total de despesas e Maior categoria; manter variações contra o ano anterior e sua interpretação atual.
- [x] Manter Maior categoria sem valor com ausência explícita e espaço estável; não trocar Previsto por Realizado no Histórico.
- [x] Migrar Comparativo e Categorias, cada uma com gráfico/tabela, preservando valores, ordenação e ações existentes.
- [x] Comparativo mantém evolução de Previsto, identificação do Mês corrente e seleção do Mês por gráfico ou tabela; retornar restaura ano, aba, modo e posição, reutilizando a issue 03.
- [x] Categorias mantém sete maiores e Outras categorias no gráfico, todas na tabela com valor/percentual/quantidade e Sem categoria; preservar cores cadastradas sem reescrever dados.
- [x] Centralizar estilos de gráficos, eixos, grades, legendas e tooltips no tema; preservar previsão distinguida por traço nos sparklines e identificação por canais além da cor.
- [x] Medir contraste de marcas e rótulos sobre as novas superfícies, com rótulos de tooltip em cor de texto adequada; registrar limitações de cores escolhidas pelo usuário e aplicar as regras de rótulo sobre preenchimento.
- [x] Reservar espaço de gráficos/skeletons com medidas nomeadas, adaptar pela largura do conteúdo e permitir rolagem quando necessário sem cortar controles.
- [x] Distinguir falha e carregamento de categorias de ausência de dados; uma falha parcial não deve apagar indicadores independentes.
- [x] Verificar ano sem dados, ano anterior ausente, zero/negativo, mais de sete categorias, Sem categoria, nomes longos e valores grandes; conferir equivalência entre gráfico e tabela.
- [x] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [x] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [x] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação concluída em
2026-09-12. O Histórico passou inteiro para a base Tailwind/Geist/Lucide — zero
classes MUI na tela — e trouxe com ele o que faltava da base: o **tema de
gráfico** que a §1.7 exige num módulo só (`theme/chartTheme.ts`), a caixa de
gráfico com altura e piso de largura nomeados (`ChartFrame`/`ChartSkeleton`), o
seletor Gráfico/Tabela e as duas tabelas de leitura do ano. O `Tabs` da issue 03
subiu para `components/` ao ganhar a segunda tela, pela regra de promoção do
README §2.4. Domínio, banco, fachada API, contratos IPC e broadcast ficaram
intactos: o diff não toca `src/main`, `src/preload` nem `src/shared`. Valores e
medições em [orca-theme.md](../../../apps/meu-dinheiro-app/docs/orca-theme.md);
a emenda correspondente está no design system.

**A alternativa em tabela era a pendência que a issue 03 deixou anotada no
mapa**: o ponto do gráfico só se alcança com o ponteiro, então o Histórico não
tinha caminho de teclado para abrir um Mês. Agora a linha da tabela é um
controle de verdade — Tab chega, Enter abre — e as duas leituras saem do mesmo
array de linhas, que é o que garante que elas concordem. Do lado das categorias
a garantia é a mesma e tem teste: `categoryBreakdown` monta as sete maiores mais
"Outras categorias" para o gráfico e todas para a tabela, e as duas somam o
mesmo total.

Conteúdo preservado: seleção de ano, os quatro indicadores (Previsto do ano,
Total de entradas, Total de despesas e Maior categoria), as variações contra o
ano anterior com a interpretação de cada sentido, Previsto sem virar Realizado,
a evolução mês a mês, a identificação do Mês corrente, a abertura de Mês com
retorno à origem, as sete maiores mais "Outras categorias" no gráfico, todas na
tabela com valor/participação/quantidade, "Sem categoria" e as cores cadastradas.

Validação no Electron real, perfil isolado, base semeada com 24 meses em quatro
anos — 2026 com nove meses (um deles sem lançamento nenhum), 2025 completo, 2024
só com entradas e 2023 com um mês vazio —, 11 categorias mais "Sem categoria",
nome longo, valor de R$ 18.750,99 e meses fechando no negativo. Relatórios em
[evidence/04](../evidence/04/).

- **As duas leituras**: tabela do Comparativo com Mês/Entradas/Despesas/Previsto,
  "Atual" no mês corrente, linha clicável e rotulada; gráfico com as três séries,
  a linha tracejada "Atual" e o tooltip trazendo o rótulo completo do mês;
  categorias com 8 barras contra 12 linhas e participação somando 100%.
  [views.json](../evidence/04/views.json).
- **Retorno**: ida pelo Histórico em 2025, aba Comparativo em Tabela, rolado;
  troca para o Mês anterior; volta com o ano, a aba, o modo **daquela aba** e a
  rolagem. Chegar pela lateral responde o padrão (2026, Comparativo, Gráfico).
  [return.json](../evidence/04/return.json).
- **Teclado e foco**: ordem de tabulação da lateral até o seletor de modo sem
  parada no gráfico, setas trocando de aba com o painel acompanhando, foco de
  2px na linha, Enter abrindo o Mês, grupos nomeados ("Ano exibido", "Forma de
  leitura", "Leitura do ano"). [keyboard.json](../evidence/04/keyboard.json).
- **Matriz de 32 combinações** (claro/escuro × 960 × 640/1280 × 800 × lateral
  aberta/recolhida × duas abas × dois modos): nenhuma rolagem horizontal de
  página, nenhum texto cortado, cabeçalho em uma linha.
  [matrix.json](../evidence/04/matrix.json),
  [clara 960](../evidence/04/claro-960-aberta-historico.png),
  [escura 1280](../evidence/04/escuro-1280-recolhida-historico.png),
  [categorias em gráfico](../evidence/04/claro-1280-categorias-grafico.png),
  [categorias em tabela](../evidence/04/escuro-1280-categorias-tabela.png).
- **Espaço reservado**: carregando mede 676px contra 676px prontos — salto zero.
  Abaixo do piso de largura (janela de 760px) a caixa do gráfico rola na
  horizontal mantendo 560px de desenho, sem cortar abas, seletor de modo nem
  indicadores. [loading.json](../evidence/04/loading.json),
  [carregando](../evidence/04/carregando.png),
  [piso](../evidence/04/piso-largura.png).
- **Falha parcial**: tabela `categories` renomeada por baixo do app. A aba de
  categorias vira `role="alert"` com as três saídas; os três indicadores do ano
  continuam vivos, a outra aba continua respondendo, a lateral continua
  alcançável e o quarto card troca "—" com "não foi possível ler as categorias"
  em vez de afirmar ausência. "Tentar novamente" mostra esqueleto no painel e no
  card, nos mesmos quadros, e recupera. [states.json](../evidence/04/states.json),
  [precedence.json](../evidence/04/precedence.json),
  [erro](../evidence/04/erro-categorias.png).
- **Casos de borda**: ano sem lançamento (tudo em R$ 0,00, sem variação e com
  vazio explícito na aba de categorias), ano mais antigo sem ano anterior (zero
  variações), ano só com entradas (Previsto positivo), mais de sete categorias,
  "Sem categoria", nome longo reticenciando e valor grande cabendo no rótulo.
  [edges.json](../evidence/04/edges.json),
  [edges2.json](../evidence/04/edges2.json),
  [vazio](../evidence/04/escuro-960-categorias-vazio.png).
- **Contraste medido nas superfícies reais**: menor par de texto 4,88:1 (o
  rótulo "Previsto" na legenda, no claro) e menor marca 3,89:1 (o ponto de "Sem
  categoria", no escuro); tooltip em 19,80:1/17,18:1. Tabela completa em
  orca-theme.md. [contrast.json](../evidence/04/contrast.json),
  [tooltip.json](../evidence/04/tooltip.json).
- `npm run typecheck`, `npm run lint`, `npm test` (284 testes em 31 arquivos) e
  `npm run build -w meu-dinheiro-app` aprovados.

Decisões que saíram do caminho óbvio e ficam registradas:

- **O Recharts não respeita `prefers-reduced-motion`.** O bloco da §5.2 desliga
  animação de CSS, e ele interpola em JavaScript, fora do alcance dela — a
  entrada das séries continuava animada com a preferência ligada. Quem responde
  agora é o tema (`chart.animate`), assinado em vez de lido uma vez, e medido: o
  caminho da linha entra com o comprimento final e não muda mais.
- **O gráfico deixou de ser focável.** A camada de acessibilidade do Recharts
  põe `tabindex="0"` no `<svg>` e entrega o texto inteiro dos eixos numa tirada
  só; dentro de uma caixa `role="img"` isso é um focável em subárvore
  apresentacional. Desligada, a caixa se anuncia pelo que o desenho mostra e o
  teclado vai pela tabela.
- **O cinza de "Sem categoria"/"Outras categorias" era ilegal.** `#9AA0A6` é um
  dos quatro que a §1.7 lista como falha (2,64:1 no claro), e essas duas linhas
  são as únicas cuja cor o **app** escolhe — passou a `#757575`, que mede 4,61:1
  e 3,89:1. As cores cadastradas das categorias não foram tocadas.
- **Limitação registrada**: três das dez categorias semeadas pela migração
  falham o 3:1 de marca em um dos modos (`#FB8C00` e `#00ACC1` no claro,
  `#7B1FA2` no escuro). Elas já estão nos bancos instalados, a migração não pode
  ser editada e a issue preserva cor cadastrada sem reescrever dado. A cor não é
  o canal de identidade ali: o nome está no eixo, o valor ao lado da barra e a
  tabela repete os dois. A paleta oferecida no cadastro é da issue 05.
- **O valor da barra de categoria fica ao lado dela, nunca dentro** — dentro,
  seria rótulo sobre preenchimento que o app não escolheu, e passaria a depender
  de medir cada cor de usuário (§1.8).
- **O esqueleto reserva a caixa, não o desenho.** 380px onde entram 412px é o
  mesmo salto que a §5.3 existe para evitar, adiado em um quadro; as duas
  alturas soltas do esqueleto (50px e 34px) são as medidas reais desta tela.
- **A extração de `categoryRows` foi o que deu teste ao recorte de categorias.**
  A suíte pura não resolve o alias `@/`, então um módulo testável não pode
  importar valor de outra pasta: é por isso que o recorte virou módulo puro e o
  achatamento que precisa de `computeMonthBalance` continua em hook, como o
  `useMonthRows` da Visão Geral já fazia.

Revisão em dois agentes conforme `code-review`, base `06a25a7`:

- **Standards**: dois achados corrigidos e quatro smells acatados. (1) A
  precedência da §5.3 estava invertida na aba de categorias: `retry` levanta
  `loading` sem limpar o erro, então "Tentar novamente" nunca mostrava esqueleto
  e a tela se contradizia — o painel ficava no erro enquanto o quarto card já
  era esqueleto. Carregando passou à frente de erro, e os quadros do retry foram
  medidos. (2) O `StatusChip` "Atual" não leva ícone, e a §3.1 pede ícone
  sempre; a exceção foi escrita no design system em vez de no código, porque a
  razão da regra — segundo canal da cor de estado — não alcança a variante
  `default`, que não tem cor de estado nenhuma. Dos smells: a cor de categoria
  virou `categoryColor` no tema (a regra estava em dois componentes, e a tabela
  ainda puxava o tema de gráfico inteiro só para ler uma constante), o
  `SERIES_ACCENT` foi inlinado, a superfície da caixa de gráfico ficou num nome
  só e o `FORECAST_DASH` passou a ser lido pelo `spark` do `StatCard`, que ainda
  repetia o traço. A reserva de largura de rótulo da Visão Geral foi avaliada e
  **não** copiada: lá a coluna tem marcador em várias linhas e eles precisam
  cair no mesmo ponto; aqui só o mês corrente leva marcador.
- **Spec**: três achados. O da bookkeeping (esta seção e o mapa) foi feito. O do
  `FORECAST_DASH` sem consumidor foi corrigido junto do smell acima. O terceiro
  mudou comportamento: o modo Gráfico/Tabela era **um só para a tela**, e o
  README do produto — que é a norma do app — descrevia "duas abas, cada uma
  alternável entre gráfico e tabela". Em vez de reescrever a norma para caber no
  código, o modo passou a ser de cada aba, e a consulta guardada leva o modo da
  aba visível, que é o "modo" que o critério manda restaurar. A medição
  contraditória do piso de largura entre o código e o documento foi acertada
  pelo valor medido.

Limitações: o viewport de 960 × 640 foi aplicado por DevTools do Electron, como
nas issues 01–03, porque o gerenciador de janelas impõe um mínimo maior; 1280 ×
800 foi aplicado à janela. Execução com `--no-sandbox` pelo helper SUID do
ambiente. O tooltip do Recharts não abre com evento sintético de ponteiro do
CDP: ele foi aberto por evento de DOM despachado na página, o que exercita o
mesmo caminho do React mas não o do sistema. O rodapé da tabela diz "1 meses"
quando há um mês só — é o `footerLabel` do `DataTable`, que já se comporta assim
na Visão Geral e no Mês desde a issue 02; corrigi-lo é mudança das três telas e
não desta issue. Configurações continua MUI até a issue 05, e com ela fica
também o fundo MUI da faixa de conteúdo.

## Answer

Histórico migrado para a base Orca com os quatro indicadores, as variações, as
duas abas e as duas leituras — gráfico e tabela — preservando valores,
ordenação, cores cadastradas e a abertura de Mês com retorno à origem. O tema de
gráfico passou a viver num módulo só, com movimento reduzido respeitado e
contraste medido nas superfícies reais; a alternativa em tabela deu ao Histórico
o caminho de teclado que faltava. Issue 05 desbloqueada.
