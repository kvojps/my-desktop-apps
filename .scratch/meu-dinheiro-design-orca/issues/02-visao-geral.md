Status: resolved
Type: task
Blocked by: 01

# 02: Visão Geral e orientação inicial

## What to build

Migrar a leitura financeira inicial e a tabela de meses para resumos compactos e controles na nova base.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

pages/dashboard/, components/StatCard.tsx, components/DataTable.tsx e contextos/hooks consumidos pela tela.

## Critérios de aceite

- [x] Preservar saldo em contas condicional, Realizado, entradas e despesas, legendas, previsões e sparklines existentes; não confundir saldo bancário com Realizado ou Previsto.
- [x] Migrar os controles de intervalo no cabeçalho: 3 meses, Este ano como padrão, Tudo e De/Até, mantendo as validações atuais.
- [x] Migrar tabela ordenável com 12 meses por página e ordem inicial do mais recente para o mais antigo; manter todos os valores e ações existentes, progresso com fração e barra alinhadas, vencidas e identificação do Mês corrente.
- [x] Manter alinhamento de cabeçalhos/valores à esquerda, ações à direita e números tabulares; cabeçalhos, valores grandes e nomes longos não se sobrepõem na janela mínima.
- [x] Preservar orientação inicial para contas bancárias, categorias e padrões, com acesso a Configurações. Coordenar os destinos por seção com a issue 05 sem criar links quebrados durante o incremento.
- [x] Preparar captura/restauração da consulta da Visão Geral (intervalo, ordenação, página e rolagem) ao abrir um Mês; integrar e validar o retorno com a issue 03.
- [x] Distinguir carregamento, falha recuperável, ausência inicial e intervalo/filtro sem resultados; oferecer saída pertinente e preservar conteúdo durante recarga.
- [x] Verificar mais de 12 meses, intervalo personalizado, mês com vencidas, zero/negativo, ausência de contas e orientação inicial, preservando os totais conhecidos.
- [x] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [x] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [x] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação concluída em
2026-09-12. A Visão Geral e os componentes que ela compartilha — `PageHeader`,
`StatCard`/`StatCardGrid`/`StatCardSkeleton`, `IconTile`, `DataTable`,
`Pagination`, `StatusChip` e um `Tooltip` local — passaram para a base
Tailwind/Geist/Lucide. Valores e medições novos em
[orca-theme.md](../../../apps/meu-dinheiro-app/docs/orca-theme.md); a emenda
correspondente está no design system. Domínio, banco, fachada API, contratos
IPC e broadcast ficaram intactos: o diff não toca `src/main`, `src/preload`
nem `src/shared`.

Conteúdo preservado: saldo em contas condicional às contas, Realizado com
Previsto na legenda, entradas e despesas com o que falta receber e pagar,
as quatro previsões de fim de ano com as sparklines tracejadas na parte
estimada, atalhos 3 meses/Este ano/Tudo com De–Até e as validações que
arrastam o extremo oposto, tabela ordenável de 12 meses por página em ordem
decrescente, progresso com fração reservada e barra alinhada, vencidas, Mês
corrente e orientação inicial.

Retorno de um Mês: a sessão arma o retorno ao abrir o Mês e o consome ao
voltar. Chegar à Visão Geral pela lateral continua sendo chegar, não voltar —
ali o recorte padrão responde de novo. A restauração reaplica intervalo,
ordenação e página aos meses que existem agora, confinando a página que
encolheu; a lógica pura tem teste próprio.

Validação no Electron real, perfil isolado em `/tmp/dinheiro-orca-02`, base
com 17 meses semeados (mais de uma página, ano anterior, pagas/pendentes/
vencidas, valor grande, Realizado negativo, duas contas). Relatórios em
[evidence/02](../evidence/02/).

- Matriz de 8 combinações (claro/escuro × 960 × 640/1280 × 800 × lateral
  aberta/recolhida): nenhum overflow de página ou de conteúdo, nenhuma célula
  ou cabeçalho cortado, 12 linhas por página, fileira em 2 colunas a 960 e 4 a 1280. [matrix.json](../evidence/02/matrix.json),
  [clara 960](../evidence/02/light-960-aberta-dashboard.png),
  [escura 1280 recolhida](../evidence/02/dark-1280-recolhida-dashboard.png).
- Consulta e controles: padrão "Este ano", "Tudo" paginando 12 + 5, ordenação
  por coluna voltando à página 1, painel De–Até abrindo pelo teclado com foco
  no primeiro campo, extremo arrastado ao cruzar o outro, Escape fechando e
  devolvendo o foco ao botão. [behaviour.json](../evidence/02/behaviour.json),
  [painel](../evidence/02/intervalo-personalizado.png).
- Retorno: ida pela página 2 com rolagem em 104px e volta com a mesma página,
  o mesmo intervalo e a mesma rolagem; Configurações → Visão Geral voltando ao
  padrão; retorno consumido uma vez só. [return.json](../evidence/02/return.json),
  [keyboard.json](../evidence/02/keyboard.json).
- Teclado e foco: linha é `role="button"` com rótulo "Abrir <Mês>", anel de 2px
  e Enter abrindo o Mês; ordem de tabulação passando pela lateral e pelos
  controles do cabeçalho; a dica da previsão entra na ordem de tabulação e
  descreve o gatilho por `aria-describedby`, carregando o valor que a linha
  corta. [foco na linha](../evidence/02/foco-na-linha.png),
  [dica](../evidence/02/dica-light.png).
- Estados: carregamento reservando quatro cards e o bloco da tabela sem piscar
  vazio; falha de leitura como `role="alert"` com tentar novamente, restaurar
  backup e abrir pasta, com a lateral ainda alcançável; recuperação pelo botão;
  intervalo sem resultados com a saída "Mostrar todos os meses"; ausência
  inicial como orientação de três passos que leva a Configurações.
  [states.json](../evidence/02/states.json),
  [carregando](../evidence/02/carregando.png),
  [erro](../evidence/02/erro-recuperavel.png),
  [vazio filtrado](../evidence/02/vazio-filtrado.png),
  [orientação](../evidence/02/orientacao-inicial.png).
- Contraste medido nas superfícies reais em execução, lendo cor computada e
  fundo efetivo de cada elemento: menor par de texto 4,89:1 (rótulo de
  "vencidas" sobre o preenchimento), menor marca 4,16:1 (foco sobre accent),
  dica 18,97:1. Tabela completa em orca-theme.md.
  [contrast.json](../evidence/02/contrast.json),
  [contrast2.json](../evidence/02/contrast2.json).
- Coexistência: Histórico, Mês e Configurações continuam MUI e seguem sem
  overflow nos dois tamanhos, já exibindo cabeçalho, indicadores e tabela
  migrados — inclusive a tabela `flush` dentro do acordeão.
  [coexist.json](../evidence/02/coexist.json),
  [Configurações](../evidence/02/coexistencia-settings.png).
- `npm run typecheck`, `npm run lint` (zero erros, dois avisos preexistentes no
  Meu Negócio), `npm test` (261 testes em 28 arquivos) e
  `npm run build -w meu-dinheiro-app` aprovados. Os testes novos cobrem a
  restauração da consulta, a ordenação e a paginação da tabela e a janela de
  páginas — lógica pura, sem infraestrutura de componentes ou E2E.

Decisões que saíram do caminho óbvio e ficam registradas:

- A marcação da lateral e o `enterMonth('history')` do Histórico entraram aqui,
  antes da issue 03. A origem passa a existir nesta issue, e deixar a lateral
  destacando Histórico para um Mês aberto na Visão Geral contradiria o que a
  sessão já registra. O retorno propriamente dito continua na issue 03.
- A dica de "vencidas" na tabela é o `title` nativo, e não a dica desenhada: a
  faixa de rolagem horizontal da tabela recorta o que sai dela, e a dica da
  primeira linha sairia. O valor em atraso também vai no `aria-label` do
  marcador, então leitor de tela o alcança.
- O fundo da faixa de conteúdo continua sendo o do MUI: trocá-lo agora deixaria
  Histórico, Mês e Configurações sem o fundo que suas superfícies assumem.
  Fica para a issue 06, junto da remoção do MUI.

Limitações: o viewport de 960 × 640 foi aplicado por DevTools do Electron, como
na issue 01, porque o gerenciador de janelas impõe um mínimo maior; 1280 × 800
foi aplicado à janela. Execução com `--no-sandbox` pelo helper SUID do
ambiente. A dica visual de "vencidas" segue dependendo do ponteiro — resolvê-la
pede uma dica em portal, e ela cabe na issue 03, onde as dicas de linha se
repetem em pago/recebido. Carregamento, falha e ausência inicial foram
exercitados substituindo a resposta do canal `months:list` no processo
principal durante a validação; o app distribuído não muda.

Revisão em dois agentes conforme `code-review`, base
`82c356dff5a6fe76de60f415fb3786b00fd08b70`:

- Standards: quatro achados. (1) `labelOn` aplicado a cor de estado do tema
  contraria a §1.8 — o rótulo do ladrilho passou a ser declarado com o
  preenchimento, e `labelOn` voltou a servir só a cor de categoria. (2) Dois
  valores da base não estavam registrados — título do cabeçalho e sombra do
  painel entraram em orca-theme.md. (3) O valor em atraso não tinha caminho de
  leitor de tela — entrou no `aria-label`. (4) A §2.1 pedia `alignItems` para
  alinhar barras, que é o eixo cruzado; a linha foi corrigida no design system,
  registrando a troca. Dos smells apontados, foram acatados `tileColors` no
  tema (a interpolação do token estava em três lugares), o token
  `--money-tile-size` no lugar do 38 repetido, uma classe de tom só para card e
  célula, a remoção do `pageSize` que ninguém passava, a remoção do reexport de
  `TileAccent` e do apelido `StatAccent`, e a fusão de `consumeScroll`/`scrollTo`
  num `restoreScroll`.
- Spec: sem requisito faltando. Três apontamentos de implementação, todos
  corrigidos: a consulta era restaurada em qualquer chegada à tela e agora só
  no retorno armado; a página era confinada contra uma lista possivelmente
  ainda vazia e agora a lista vazia é tratada como "ainda não chegou", com
  teste; e o hover de linha, que a base anterior dava a qualquer linha, voltou
  a valer para as tabelas não clicáveis. A antecipação da marcação da lateral
  foi avaliada e mantida, com o registro acima.

## Answer

Visão Geral migrada para a base Orca com todos os números, controles, estados e
regras preservados, retorno de Mês preparado e validado no Electron nos dois
temas e nos dois tamanhos. Issue 03 desbloqueada.
