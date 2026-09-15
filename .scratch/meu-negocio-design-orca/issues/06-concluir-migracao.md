Status: resolved
Type: task
Blocked by: 05

# Retirada de MUI e fechamento

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [x] Confirmar ausência de consumidores antes de remover MUI, Emotion, Material Icons e Inter do app; atualizar lockfile e avisos de terceiros pelo gerador.
- [x] Verificável por máquina: `grep -rl "@mui\|@emotion\|@fontsource/inter" apps/meu-negocio-app/src apps/meu-negocio-app/package.json` retorna vazio; citar o resultado em Comments antes de marcar o critério acima.
- [x] Declarar na base local os estilos necessários que vinham do CssBaseline, incluindo caixa, fonte, números tabulares, foco de documento e movimento reduzido.
- [x] Alinhar README do app ao Dashboard atual, bloqueio por estoque insuficiente e Total já pago; atualizar documentação normativa e tokens para o estado efetivamente implementado.
- [x] Conferência cruzada dos tokens: a tabela de `docs/orca-theme.md`, `getThemeVariables` em `theme/index.ts` e `BACKGROUND` em `main/infra/gateways/system/themeMode.ts` (nesta issue renomeado `WINDOW_BACKGROUND` e movido para `main/domain/theme.ts`, para ser importável sem `electron` pelo teste) têm os mesmos valores por modo. Só então a seção "Transição em andamento: Meu Negócio" do design system passa a "implementada". Foi a falta desta conferência que deixou a paleta MUI passar como Orca na issue 01.
- [x] Tipografia na escala documentada em `docs/orca-theme.md` (12/18, 14/20, 16/24, 20/28, 24/32; pesos 400/500/600): verificável por `grep -n "font-size" apps/meu-negocio-app/src/renderer/src/styles.css` sem valor fora da lista e sem `fontSize`/`variant` de MUI nas telas migradas.
- [x] Dicas alcançáveis pelo teclado: as telas migradas usam `title` nativo (cabeçalho, `StatCard`, período personalizado) e a dica por CSS da lateral recolhida; `title` não chega ao teclado. Adotar um `Tooltip` local em portal, visível no foco além do hover, como pendência herdada da issue 02 (o Meu Dinheiro resolveu o mesmo ponto na etapa 03 dele).
- [x] Fazer revisão final dirigida das cinco telas em claro/escuro, janela mínima, lateral aberta/recolhida e teclado nos componentes afetados pela retirada. Esta passagem cobre os itens manuais que as issues 01, 02 e 03 deixaram desmarcados (navegação/tema/redimensionamento; criar e editar produto pelo teclado; concluir/reabrir pedido, recusa por estoque e Total já pago de R$ 100 para R$ 150 com dados descartáveis). Ao executá-la, marcar aqueles itens nas issues de origem.
- [x] Atualizar status e checklists das issues executadas, spec e mapa; registrar limitações reais sem transformar capturas ou comparações extensas em requisito.

## Validação enxuta

- [x] Executar `npm run typecheck`, `npm run lint`, `npm test` e
      `npm run build -w meu-negocio-app`.
- [x] Rodar checks e build do app; percorrer navegação e superfícies após retirada da base antiga. Repetir outros fluxos apenas se houver mudança ou risco concreto.
- [x] Registrar em Comments resultados e limitações, atualizar Status e marcar
      somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
      ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).

Implementado e resolvido em 2026-09-14.

**Verificação por máquina, citada antes de marcar.** `grep -rl "@mui\|@emotion\|@fontsource/inter" apps/meu-negocio-app/src apps/meu-negocio-app/package.json`
retorna vazio (o inventário prévio achou três consumidores, todos em
`theme/`: o tema MUI inteiro em `index.ts`, o `ThemeProvider`/`CssBaseline`
do provider e o tipo `PaletteMode` no contexto — os dois últimos passaram a
usar o `ThemeMode` de `@shared/types/theme`). `grep -n "font-size"
apps/meu-negocio-app/src/renderer/src/styles.css` só tem 12/14/16/20/24px, e
não há `fontSize`/`variant` de MUI em tela nenhuma (os `variant=` restantes
são a prop do `Button` local; o único `fontSize` é o do tick do SVG no tema de
gráfico). `package.json` não declara mais `@mui/material`,
`@mui/icons-material`, `@emotion/react`, `@emotion/styled` nem
`@fontsource/inter`; o lockfile foi atualizado por `npm install` (os pacotes
seguem em `node_modules` porque o Meu Móvel Planejado ainda os usa) e
`THIRD-PARTY-NOTICES.md` foi regenerado pelo gerador: de 174 para 98 pacotes,
sem MUI, Emotion nem Inter.

**A base do documento.** O que o `CssBaseline` sustentava está declarado em
`styles.css` e documentado em `docs/orca-theme.md` ("A base do documento"):
`box-sizing: border-box` em `html` herdado por `*`, corpo com Geist 14/20,
dígitos tabulares e suavização, `-webkit-text-size-adjust`, anel de foco
`:focus-visible` do documento (o que alcança menu, popover e dica em portal) e
o bloco de movimento reduzido. O `div` que o provider punha em volta do app
saiu junto com a regra `#root > div`. Medido no Electron depois da retirada:
`html` e `nav` em `border-box`, corpo em `Geist, system-ui, sans-serif`
14px/20px `tabular-nums`, zero `<style data-emotion>`, `Layout` filho direto
de `#root`, e com `prefers-reduced-motion: reduce` emulado a transição da
lateral mede `1e-05s`.

**Conferência cruzada dos tokens virou teste.** `theme/tokens.test.ts` lê a
tabela de `docs/orca-theme.md` (as três: tokens, ladrilhos com a coluna do
rótulo, e séries) e compara cada linha com `getThemeVariables`, nas duas
direções — o conjunto de variáveis publicadas tem de ser exatamente o
documentado mais as duas pilhas de fonte; `main/domain/theme.test.ts` compara a
linha `background` com `WINDOW_BACKGROUND`, que saiu do gateway do Electron
para `main/domain/theme.ts` justamente para ser importável sem `electron`. Os
três lados concordam, e a seção do design system passou a "Transição
implementada: Meu Negócio".

**Dicas pelo teclado.** `components/Tooltip.tsx` substitui todo `title`
nativo e a dica por CSS da lateral: bolha em portal (dentro do diálogo aberto
quando há um), posição fixa calculada por `utils/overlay.ts` — a conta de
virar de lado e ficar dentro da janela é pura e tem teste (5 casos, escritos
antes) —, visível no hover e no foco, Escape fecha sem mover o foco. Sem
elemento em volta do gatilho: os eventos e o ref vão nele por `cloneElement`,
porque um `span` a mais quebraria o `>` do grupo de alternância e a coluna da
lateral. O texto mora sempre no nome acessível do gatilho, então a dica é só
desenho e não entra em `aria-describedby`. Consumidores: os cinco itens da
lateral, o logo, tema e recolher (título vazio quando aberta, para não
remontar o gatilho e perder o foco de quem acabou de recolher), o período
personalizado, o copiar caminho e o selo de tendência do `StatCard`, que
entrou na ordem de tabulação porque o período comparado só existe na dica. O
`title` do `h1` do cabeçalho saiu com a reticência: o título quebra linha.

**README e documentação.** O README do app já descrevia os três blocos do
Dashboard, o bloqueio por estoque e o Total já pago desde as issues 03–05; o
manual de uso ganhou as cobranças no resumo do Dashboard. `orca-theme.md`
perdeu as menções à coexistência, ganhou a dica, a base do documento e o
teste de tokens; o design system e o README raiz passaram a dizer que a
migração está concluída e que o app não declara mais as bibliotecas antigas.

**Validação:** `npm run typecheck`, `npm run lint` (os dois avisos
preexistentes em `OrdersContext` e `ProductsContext`), `npm test` (44
arquivos, 365 testes) e `npm run build -w meu-negocio-app` aprovados.

**Revisão final dirigida no Electron real** (build de produção, perfil
isolado por `XDG_CONFIG_HOME`, dados descartáveis semeados pela API do
preload, viewport emulada por CDP porque o Wayland ignora `setSize`, teclado
por `Input.dispatchKeyEvent`; 41 verificações, todas aprovadas, mais 21
capturas inspecionadas):

- As cinco telas em claro e escuro a 1280×800: superfícies neutras, Geist,
  ladrilhos com identidade, papel `#171717` no escuro. Alternar o tema pelo
  rodapé persiste (`theme.get()` devolve `dark`), publica `color-scheme` e
  pinta o corpo em `#0a0a0a`.
- 960×640 com lateral aberta (Dashboard em uma coluna, Configurações com o
  seletor compacto, Vendas) e recolhida (lateral em 64px): sem rolagem
  horizontal em nenhum caso.
- Teclado nas dicas: Tab chega ao logo recolhido e mostra "Meu Negócio"; o
  item seguinte mostra "Dashboard", à direita e na altura dele; Escape fecha e
  o foco fica; tema recolhido mostra "Tema claro. Ativar tema escuro"; Enter
  em "Expandir navegação" mantém o foco no botão, já como "Recolher
  navegação", sem bolha. Hover no item recolhido mostra e sair esconde.
  Período personalizado e copiar caminho mostram a dica no foco; o anel de
  foco no botão é `solid 2px rgb(39, 113, 202)`; o item do menu de ações em
  portal recebe o foco fora de `#root` com o anel declarado.
- Issue 02: produto criado e editado inteiramente pelo teclado (ver o item
  marcado lá); margem "—" no produto sem preço de venda; filtro sem
  resultado mostra o estado vazio.
- Issue 03: concluir pelo chip de status baixou o estoque de 5 para 3; o
  pedido do produto sem estoque foi recusado — "Erro: Estoque insuficiente
  para concluir o pedido: Produto B (necessário 1, disponível 0)" na fila de
  notificações, confirmação fechada, pedido pendente; reabrir em Vendas
  devolveu o estoque a 5; Total já pago gravado em R$ 100 (campo reabre em
  100, saldo restante R$ 100,00 sobre R$ 200) e depois em R$ 150, acumulado
  R$ 150 e não R$ 250.
- Os itens manuais das issues 01, 02 e 03 foram marcados nelas.

**Revisão de código (padrões e spec, em paralelo) antes do commit.** Corrigido:
três bullets do README raiz §2.4 ainda listavam só Git Dlog e Meu Dinheiro
como os apps de Lucide e variáveis CSS; `orca-theme.md` citava o
`contentQuery` que esta issue apaga; o docblock de `orcaColors` apontava o
fundo da janela para o gateway e o teste errado; a conta de posição do menu e
do popover em `useAnchoredPopup` era uma cópia sem teste dos mesmos 6px/8px de
`utils/overlay.ts` e passou a chamar `placeOverlay` com o novo `below-end`
(que também vira para cima quando falta espaço embaixo, o que a cópia não
fazia; 7 casos no teste); o teste de tokens só andava do documento para o
código e passou a exigir que o conjunto publicado seja exatamente o
documentado, conferindo também a coluna do rótulo dos ladrilhos e o par
âmbar; e o Escape da dica passou a parar na dica quando há bolha, em vez de
cancelar também um diálogo ou menu em volta. Sem ação, registradas: os dois
testes leem o documento com parsers próprios (uma linha por regex no main, a
tabela no renderer — apps e camadas não compartilham código); a dica abre em
qualquer foco, não só no `:focus-visible` (o hover já a mostraria); um selo
`role="img"` focável é o custo de o período comparado só existir na dica. A
revisão no Electron foi refeita depois das correções: 41/41.

**Limitações e observações:**

- A conferência foi dirigida por script e capturas, não por uso manual; o
  redimensionamento real da janela continua impossível neste ambiente
  (Wayland ignora `setSize`), por isso as larguras foram emuladas. A moldura
  nativa no Windows não foi vista.
- Observação sem ação: o campo Total já pago tem `max` igual ao total, então
  um valor acima do total é barrado pela validação nativa do navegador (Enter
  e Salvar não submetem, e o Chromium mostra o balão dele), enquanto a nota
  abaixo do campo já mostra o saldo "clampado". É comportamento anterior à
  migração, coerente com não aceitar pagamento acima do total, e fica
  registrado aqui porque foi ele que fez a primeira tentativa do roteiro
  falhar (pedido de R$ 60, valor 100).
- A fila de notificações mostra cada aviso por 4 segundos, na ordem: num
  roteiro rápido o erro de estoque aparece atrás dos sucessos anteriores. É a
  fila preservada da issue 01, não um defeito; o roteiro esperou por ele.
- Sem pasta de evidências: as capturas ficaram no diretório temporário da
  sessão e foram usadas só para inspeção.
