Status: resolved
Type: task
Blocked by: 03

# Dashboard e gráficos

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [x] Migrar os três blocos e todos os indicadores inventariados na spec, com indicadores compactos nos cabeçalhos.
- [x] Oferecer Gráfico/Tabela por bloco com os mesmos dados, incluindo contagens hoje restritas às dicas; dar nomes acessíveis aos gráficos.
- [x] Manter filtro de período, ranking de cinco produtos e posição de hoje das contas a receber com quatro faixas, inclusive zeradas.
- [x] Centralizar cores e medidas de gráficos no tema local; medir contraste nas superfícies reais e respeitar movimento reduzido nas séries Recharts.
- [x] Adaptar grade ao conteúdo e altura disponível; skeleton reserva a caixa real e espaço insuficiente permite rolagem sem comprimir informação.
- [x] Verificável por máquina: `grep -rl "@mui" apps/meu-negocio-app/src/renderer/src/pages/dashboard apps/meu-negocio-app/src/renderer/src/theme/chartTheme.ts` retorna vazio; citar o resultado em Comments antes de marcar os critérios acima.
- [x] Tipografia na escala documentada em `docs/orca-theme.md` (12/18, 14/20, 16/24, 20/28, 24/32; pesos 400/500/600): verificável por `grep -n "font-size" apps/meu-negocio-app/src/renderer/src/styles.css` sem valor fora da lista e sem `fontSize`/`variant` de MUI nas telas migradas.

## Validação enxuta

- [x] Executar `npm run typecheck`, `npm run lint`, `npm test` e
      `npm run build -w meu-negocio-app`.
- [x] Comparar Gráfico/Tabela em um período com vendas; conferir conta antiga fora do período ainda presente e as quatro faixas. Conferir teclado e movimento reduzido.
- [x] Registrar em Comments resultados e limitações, atualizar Status e marcar
      somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
      ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).

Implementado e resolvido em 2026-09-14. O Dashboard saiu do MUI: os três
blocos viraram `SectionCard` locais (título, indicadores compactos em
`SummaryTag`, seletor Gráfico/Tabela e uma caixa só para gráfico, tabela,
esqueleto e vazio), com os três gráficos (`MonthlyRevenueChart`,
`TopProductsChart`, `AccountsReceivableChart`) e as três tabelas de leitura
(`ReadingTable` — mês/faturamento/lucro/margem; posição/produto/quantidade;
faixa/a receber/contas, que traz a contagem antes restrita à dica). Cada
gráfico é `role="img"` com nome que diz o que mostra e aponta para a tabela,
com a camada de acessibilidade do Recharts desligada; a tabela é o caminho de
teclado. Lógica pura saiu da página para `utils/` com teste antes da migração:
`resolvePeriod`, `buildMonthlySeries`, `buildTopProducts`/`padTopProducts` e
`buildReceivables` (19 casos).

Tema de gráfico: `theme/chartTheme.ts` não importa mais MUI — `chartTheme(mode,
animate)` resolve eixo, grade, cursor, tooltip, séries e texto a partir de
`orcaColors`/`seriesFill`, e `useChartTheme()` assina `prefers-reduced-motion`
para cada série receber `isAnimationActive`. Contraste medido sobre os papéis
reais e registrado em `docs/orca-theme.md` (seção Gráficos): o âmbar do
ladrilho mede 1,83:1 sobre o papel claro, então a série `warning` ganhou par
próprio (`#b26f00` claro, 4,06:1 / `#fab219` escuro, 9,77:1), publicado como
`--negocio-series-*` e usado também no quadrado das tags. Medidas nomeadas:
piso 160px (a altura real é a da linha da grade) e piso de largura 360px.

Grade: uma coluna, duas a partir de 1000px de conteúdo com o gráfico de meses
na linha inteira; `grid-auto-rows: 1fr` reparte a altura e, em janela baixa, a
página rola em vez de comprimir. `useTextMeasure` deixou de fixar Inter e
herda Geist do `body`. `TONE_COLOR` (só o Dashboard MUI usava) saiu do
`StatCard`. O README §1.2 passou a descrever os três blocos atuais.

Verificação por máquina, citada antes de marcar: `grep -rl "@mui"
apps/meu-negocio-app/src/renderer/src/pages/dashboard
apps/meu-negocio-app/src/renderer/src/theme/chartTheme.ts` retorna vazio;
`grep -n "font-size" apps/meu-negocio-app/src/renderer/src/styles.css` só tem
12/14/16/20/24px, e o Dashboard não tem `fontSize`/`variant` de MUI (os
`fontSize` restantes são atributos do `<text>` SVG, todos `CHART_FONT_SIZE`).

Um defeito preexistente corrigido no `MonthRangeFilter`: o padrão "Este ano"
era aplicado quando `monthOptions` tinha algo — e ele sempre tem o mês
corrente —, então na primeira renderização, antes de os pedidos chegarem, o
recorte colapsava para o mês de hoje e ficava marcado como personalizado. Só
o Dashboard sofria (Vendas monta o filtro depois da carga). Agora o padrão
espera existir pedido.

Infra de teste: `vitest.config.ts` ganhou um resolvedor de `@shared/*` e `@/*`
por app (sobe do arquivo importador até o `src/` do app), porque o Vite não
lê `paths` do tsconfig e nenhum módulo puro que usa helpers de `shared/` era
testável em runtime.

Validação aprovada: `npm run typecheck`, `npm run lint` (os dois avisos
preexistentes em `OrdersContext` e `ProductsContext`), `npm test` (40
arquivos, 348 testes) e `npm run build -w meu-negocio-app`.

Conferência no Electron real (build de produção, perfil isolado por
`XDG_CONFIG_HOME`, dados descartáveis semeados pela API do preload: 7 produtos,
15 pedidos entre janeiro e setembro, 12 concluídos com pagamentos parciais):
claro e escuro nos três blocos; "Este ano" ativo com nove meses no eixo e na
tabela (margem "—" no mês sem venda); ranking de cinco; Cobranças com as
quatro faixas e o 60+ em `danger`, idêntico sob "Este ano" e "Últimos 3
meses" enquanto Vendas mudou de 12 para 8 — a conta antiga fora do período
continua lá; ao quitar as contas de até 15 dias a faixa continuou desenhada
com "R$ 0,00 · 0 contas" em `muted`. Viewport emulada por CDP: 960×600 com
lateral recolhida (uma coluna, rolagem da página) e 1440×900 (duas colunas,
sem rolagem); em todos os estados corpo, container do Recharts e SVG têm a
mesma altura. Teclado por `Input.dispatchKeyEvent`: Tab de "Gráfico" chega em
"Tabela" com anel de foco, Espaço alterna para a tabela, o SVG não entra na
ordem de tabulação. Movimento reduzido por `Emulation.setEmulatedMedia`: com a
preferência ativa as barras nascem na altura final (60ms após montar), sem ela
estão em 3px no mesmo instante.

Revisão de código (padrões e spec, em paralelo) antes do commit. Corrigido: a
regra "seção vazia esconde as tags", escrita para Cobranças, tinha sido
generalizada e apagava Estoque Baixo, Total de Vendas e Ticket Médio num
período sem venda — o `SectionCard` agora sempre mostra as tags e só Cobranças
as omite quando não há conta (conferido no Electron com janeiro, sem venda:
tags presentes, vazio presente, seletor ausente). Também: imports por alias em
vez de `../` (README §2.4), `formatCount` movido para `utils/receivables.ts`,
`formatMonthYear` reaproveitado pela série mensal, `SeriesAccent` nomeado no
tema, prop `empty` presente só quando a seção está vazia, e a escala de
tipografia ganhou as linhas de peso 600 (valor de tag 14/20, tendência e
valor na ponta da barra 12/18) e o tamanho 14px das setas. Notas sem ação: a
margem sai com 0 casas na tag e 1 casa na tabela (mesmo dado, precisão da
tabela igual à coluna de margem de Vendas); o README §1.2 já está alinhado, e
a issue 06 não precisa refazê-lo.

Limitação: a conferência foi dirigida por script e capturas
(`capturePage`), não por uso manual; redimensionamento real da janela não é
possível neste ambiente (Wayland ignora `setSize`), por isso as larguras foram
emuladas. Dicas por teclado continuam a pendência herdada, registrada na
issue 06.
