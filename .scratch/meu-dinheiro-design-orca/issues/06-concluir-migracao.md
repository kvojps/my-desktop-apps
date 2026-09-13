Status: resolved
Type: task
Blocked by: 05

# 06: Revisão final, documentação e remoção de MUI

## What to build

Concluir a migração sem consumidores antigos e registrar evidências de cobertura funcional e visual.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

Renderer completo, package.json do app, lockfile da raiz, README do app e raiz, docs/design-system.md e documentação local do tema.

## Critérios de aceite

- [x] Inventariar consumidores de MUI, Emotion, Material Icons e fonte antiga no app, incluindo providers, controles, notificações, rota inexistente e estilos; migrar os remanescentes antes de retirar dependências.
- [x] Remover somente dependências/fontes/estilos sem consumidores no Meu Dinheiro e atualizar lockfile sem afetar o uso legítimo de MUI pelos outros apps; preservar independência entre workspaces.
- [x] Revisar todos os critérios das issues 01–05 e a matriz de testes da spec; conferir ausência de perda de campos, indicadores, filtros, ações e confirmações.
- [x] Validar os dois temas nas duas dimensões, navegação aberta/recolhida, Configurações com seletor, teclado, foco, movimento reduzido, início da janela e redimensionamento.
- [x] Registrar capturas por tela e tema, revisão da referência, medições de contraste e resultados dos cenários na documentação local; limitações devem aparecer explicitamente, sem marcar validação visual pendente como concluída.
- [x] Atualizar README do app para navegação interna, retorno à origem e quatro indicadores do Histórico; preservar sua estrutura normativa com Manual de uso primeiro.
- [x] Atualizar design system e README raiz distinguindo migração implementada de validação realizada; não generalizar a migração para outros apps nem tornar Git Dlog canônico.
- [x] Atualizar avisos de terceiros pertinentes às dependências incorporadas, seguindo as convenções existentes.
- [x] Confirmar testes de retorno à origem e regressões financeiras existentes; executar checagens da raiz e build do Meu Dinheiro, registrando resultados.
- [x] Marcar Status e checklists resolvidos nas issues somente após cumprir os critérios e atualizar map.md com evidências e eventuais pendências reais.
- [x] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [x] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [x] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação concluída em
2026-09-13. O app **não declara mais** `@mui/material`, `@mui/icons-material`,
`@emotion/react`, `@emotion/styled` nem `@fontsource/inter`. Domínio, banco,
fachada API, contratos IPC e broadcast ficaram intactos: o diff não toca
`src/main`, `src/preload` nem `src/shared`. Evidências em
[evidence/06](../evidence/06/).

**O inventário achou cinco consumidores, todos no módulo de tema.** Nenhuma tela
importava MUI desde a issue 05. Sobravam `theme/index.ts` (o tema inteiro),
`ThemeModeProvider` (o `ThemeProvider` e o `CssBaseline`) e três arquivos que
importavam o **tipo** `PaletteMode` — `orca.ts`, `chartTheme.ts` e
`themeModeContext.ts`. Os três passaram a usar o `ThemeMode` de
`@shared/types/theme`, que já existia e já era a mesma união de literais; a
`labelOn` deixou de ser reexportada e é importada de onde mora, o que também
tira do renderer o único `index.ts` que funcionava como barrel (README §2.4).

**Tailwind entra sem Preflight, então o `CssBaseline` não era decoração.** Ele
era quem dizia o que um reset diz, e sair sem substituí-lo teria mudado a tela
de verdade. O que passou para `styles.css`, com o mesmo efeito:

- `box-sizing: border-box` em `html`, herdado — sem isso toda caixa com padding
  e largura declarados juntos passaria a medir a soma dos dois;
- corpo com a fonte, a métrica, os dígitos tabulares e a suavização;
- o anel de foco **do documento**. Este é o que quase escapa: as regras da folha
  eram escopadas em `.money-page`, `.money-surface`, `.money-sidebar`,
  `.money-button` e `.money-dialog`, e o menu de linha é desenhado em portal no
  `body` (issue 03) — fora de todas elas. Era o `*:focus-visible` do MUI que o
  cobria. Com a regra de documento no lugar, essas cinco viraram cópias exatas
  dela e saíram; sobraram as duas que **discordam**, a linha de tabela e o
  controle segmentado, que trazem o anel para dentro com offset negativo;
- o bloco de movimento reduzido. Ele hoje não desliga nada, porque esta folha
  não tem `animation` nem `transition`; fica como piso, e está dito assim no
  comentário. O Recharts continua respondendo pelo `chartTheme`.

**O fundo da faixa de conteúdo virou token, com a cor que já tinha.** Ele era
publicado pelo provider MUI como `--mui-content-background` e é a superfície
contra a qual as issues 03–05 mediram rótulo, legenda e borda de campo. Trocar a
cor invalidaria a tabela de contraste inteira sem que ninguém tivesse pedido cor
nova, então ele virou `--money-content` em `theme/orca.ts` com os mesmos
`#f4f6fb` / `#10131c`. O polegar da barra de rolagem foi junto, pela mesma razão
(`--money-scrollbar`).

**A retirada foi medida, não observada.** O estilo computado e a caixa de cada
nó visível **dentro de `.money-layout`** foram fotografados nas mesmas 24 telas
— 2 larguras × 2 temas × 6 rotas — sobre a mesma base semeada, no build de
produção antes (`d141755`) e depois. Dos **6300 nós, 48 diferem**, e são os dois
contêineres da faixa de conteúdo em cada tela, onde mudou só o valor **herdado**
(cor, família e métrica de fonte) que nenhum descendente usa: todos os nós de
texto ficaram idênticos em caixa, cor, fonte e métrica.
[regressao-visual.json](../evidence/06/regressao-visual.json).

O recorte deixa duas coisas fora, e elas foram medidas à parte porque um número
sem escopo é uma afirmação maior do que a medida:

- **Os quatro ancestrais** (`html`, `body`, `#root` e a própria `.money-layout`),
  que a coleta não alcança. Neles mudou o mesmo valor herdado, mais o **fundo do
  corpo**: `#f4f6fb` → `#ffffff` no claro e `#10131c` → `#0a0a0a` no escuro. Ele
  não aparece — `.money-layout` cobre a janela inteira (1280 × 800 contra
  1280 × 800) com esse mesmo fundo —, e a troca o põe de acordo com a cor que o
  main já pinta na janela. [ancestrais](../evidence/06/ancestrais-depois.json).
- **O `<option>`**, que tem caixa zero e por isso é descartado. É por ali que a
  matriz vê uma segunda família: os dez botões de amostra do cadastro de
  categoria não declaram família e caem na fonte padrão do navegador (Arial).
  São **idênticos antes e depois** — 10 botões mais o svg do check nos dois
  builds — e não têm texto. Fica registrado como exceção, não como resultado.

Validação no Electron real, perfil isolado em diretório temporário — nunca a
base pessoal —, semeada por IPC com 3 contas (uma negativa, uma de nome longo),
9 categorias (uma de nome longo), 3 despesas padrão (uma de valor variável),
2 entradas padrão, 48 meses em quatro anos, 18 despesas e 15 entradas no mês
corrente entre pagas, pendentes, vencidas e sem categoria.

- **Matriz de 48 combinações** (2 larguras × 2 temas × lateral aberta/recolhida
  × 6 rotas, incluindo Mês inexistente e rota inexistente): nenhuma rolagem
  horizontal de página ou de faixa, nenhum texto cortado, **zero** classe `Mui*`,
  zero `style[data-emotion]` e zero variável `--mui-*`. A única família de fonte
  na árvore é Geist, com a exceção registrada acima — os dez botões de amostra
  de cor, sem texto e idênticos ao build anterior. Larguras de conteúdo medidas:
  721/736px e 881/896px a 960, 1041/1056px e 1201/1216px a 1280.
  [matrix.json](../evidence/06/matrix.json),
  [claro 960](../evidence/06/visao-geral-claro-960-aberta.png),
  [escuro 1280](../evidence/06/historico-escuro-1280-recolhida.png).
- **Capturas por tela e tema**: Visão Geral, Histórico, Mês, Configurações,
  Backup e rota inexistente, em claro e escuro, a 960 com a lateral aberta e a
  1280 com ela recolhida — 24 arquivos em [evidence/06](../evidence/06/).
- **Contraste remedido nas superfícies reais**, nos dois modos: menor par de
  texto 5,27:1 (cabeçalho de tabela, no claro) e menor marca 3,19:1 (a borda de
  campo sobre a faixa de conteúdo) — os mesmos limites das issues anteriores,
  como tinha de ser, já que a faixa conservou a cor.
  [transversais.json](../evidence/06/transversais.json).
- **Teclado e foco, por evento real de teclado** — e isto importa: o
  `:focus-visible` não responde a foco programático, então medi-lo com
  `.focus()` diria "sem anel" mesmo com a regra certa no lugar. Tab até o menu
  da linha, Enter para abrir, seta para o item: **anel de 2px `#3987e5` com
  offset 2px no item desenhado em portal**, que é exatamente o caso que só a
  regra de documento alcança, e Escape devolvendo o foco ao gatilho. No diálogo,
  o foco não saiu dele em 24 tabulações e o Escape devolveu ao gatilho com anel.
  [teclado.json](../evidence/06/teclado.json),
  [dialogo.json](../evidence/06/dialogo.json),
  [foco no menu](../evidence/06/foco-no-menu-em-portal.png).
- **Movimento reduzido**: com a preferência emulada, transição e animação
  injetadas caem para 0,01ms e nenhuma camada do Recharts anima.
  [transversais.json](../evidence/06/transversais.json).
- **Início da janela e redimensionamento**, nos dois modos: reabrindo com a
  preferência gravada, o modo chega pelo argumento do preload, o corpo já nasce
  em `#ffffff`/`#0a0a0a` e a faixa assume `#f4f6fb`/`#10131c` ao montar.
  1280 → 960 → 1440 → 960 sem rolagem horizontal e sem faixa de outra cor.
  [estados.json](../evidence/06/estados.json).
- **Retorno à origem** exercitado nas duas telas, com o estado lido antes e
  depois da ida: Visão Geral com recorte de 3 meses e ordenação invertida volta
  com os dois e com a mesma primeira linha; Histórico em 2024, aba Comparativo,
  modo Tabela volta com os três — ano, aba e modo —, e a lateral marca Histórico
  enquanto o Mês está aberto. **Operações financeiras** pelo caminho real de
  IPC: pagar debitou R$ 310,40, desfazer creditou de volta ao centavo, a conta
  negativa recusou com "Saldo insuficiente na conta selecionada" sem tocar no
  saldo, receber creditou R$ 200,00 e desfazer devolveu.
  [retorno-e-operacoes.json](../evidence/06/retorno-e-operacoes.json).
- **Avisos de terceiros** regenerados: 220 → **144 pacotes**. Saíram **78** —
  `@mui/*`, `@emotion/*`, `@fontsource/inter` e as transitivas deles (`@babel/*`,
  `stylis`, `prop-types`, `@popperjs/core`, `react-transition-group`…). Entraram
  **dois que faltavam**: `@fontsource/geist` e `lucide-react`, que a issue 01
  trouxe e o arquivo nunca registrou (220 − 78 + 2 = 144).
- **Tamanho do que se distribui**: JS do renderer 2.215 → 2.027 kB, CSS
  76,9 → 66,8 kB, e a pasta inteira do renderer 3.551 → 2.460 kB — a maior parte
  da diferença são os arquivos da Inter, que saíram do bundle.
- `npm run typecheck`, `npm run lint` (zero erros; dois avisos preexistentes no
  Meu Negócio), `npm test` (310 testes em 32 arquivos) e
  `npm run build -w meu-dinheiro-app` aprovados.

Um achado corrigido, o que a issue 05 deixou anotado. Ele não tem linha própria
na lista de critérios acima — chega pela entrega da issue 05, que o registrou
como "achado fora do escopo, anotado para a issue 06" —, e por isso fica dito
aqui em vez de marcado lá:

- **"Nenhum mês cadastrado em 0".** Sem competência nenhuma, `selectedYear` caía
  num `?? 0` e a tela culpava um ano inexistente por uma ausência que é do banco
  inteiro — com quatro indicadores zerados, um seletor de ano vazio e um ano
  anterior de −1 ao lado. A escolha do recorte virou `selectHistoryYear`, puro e
  testado, que devolve `null` quando não há ano; a tela responde com um estado
  vazio **sem ano**, sem indicadores e com a saída para Adicionar Meses. Um ano
  _sem meses_ continua sendo outra coisa, e continua dizendo o ano.
  [historico sem meses](../evidence/06/historico-sem-meses.png),
  [estados.json](../evidence/06/estados.json).

Decisões que saíram do caminho óbvio e ficam registradas:

- **A faixa de conteúdo não foi retonalizada.** Ela é a única superfície com
  matiz desta base, herdada da anterior, e seria tentador aproximá-la do
  `background` neutro agora que o MUI saiu. Mas ela é o que dá contorno aos
  painéis — papel e janela são o mesmo branco — e é a superfície das medições de
  três issues. Mudar a cor é uma decisão de design que ninguém pediu; a issue
  pedia tirar dependência.
- **O anel de foco subiu para o documento.** Poderia ter virado mais uma regra
  escopada, uma por camada em portal. Mas o que a §5.5 cobra é do app inteiro, e
  uma lista de exceções envelhece: a próxima camada em portal nasceria sem anel
  e ninguém notaria até alguém navegar por teclado.
- **`ThemeProvider` e `CssBaseline` saíram juntos, mas o `color-scheme` ficou.**
  Ele não é decoração: é o que faz o Chromium pintar campo nativo, `<option>` e
  barra de rolagem no modo certo, e nenhuma regra do app alcança essas
  superfícies.
- **`contentQuery` não foi recriado.** Ele saiu junto com `theme/index.ts`, e a
  §2 do design system diz que o módulo de tema o exporta. Recriá-lo aqui seria
  um módulo sem consumidor: nesta base não há layout escrito em JS, e as cinco
  consultas de contêiner vivem na folha. O que foi feito foi escopar a §2 à base
  em JS e **nomear os cinco limiares** nos tokens locais — a norma que a §2.2
  cobra é a medida ser de contêiner, e essa continua valendo nas duas.

Limitações registradas:

- O viewport de 960 × 640 foi aplicado por DevTools do Electron, como nas issues
  01–05, porque o gerenciador de janelas impõe um mínimo maior; 1280 × 800 e as
  demais larguras foram aplicadas do mesmo modo. Execução com `--no-sandbox`
  pelo helper SUID do ambiente. Aparência da moldura nativa no Windows continua
  não validada.
- **Os seletores nativos de arquivo não foram reacionados nesta issue.** O ciclo
  de backup — exportar, cancelar, ZIP inválido, backup legado, restaurar — está
  validado na issue 05 e o diff desta não toca `src/main`, `src/preload` nem a
  tela de Backup. O que se conferiu aqui foi a tela: ela renderiza e mede como
  antes nas 48 combinações.
- **A restauração de rolagem não foi exercitada nesta bateria**: com o recorte
  de 3 meses a página não rola, então o valor guardado era zero. A ida e volta
  com rolagem está validada nas issues 02 e 03.
- Em uma das dez paradas do diálogo — um campo de texto — o Chromium não marcou
  `:focus-visible` naquele instante. A regra é a mesma de antes da retirada e as
  outras nove pararam com anel; fica como observação.
- **A tabela do Mês continua rolando na horizontal a 960 × 640** com a lateral
  aberta (821px de tabela em 671px de faixa). É a limitação que a issue 03
  registrou — são seis colunas —, dentro do contêiner próprio de rolagem, e não
  uma regressão desta issue.
- **Três das dez categorias semeadas continuam falhando o 3:1 de marca** em um
  dos modos (`#FB8C00` e `#00ACC1` no claro, `#7B1FA2` no escuro). Elas chegam
  ao banco pela migração `categories`, que não pode ser reordenada nem
  reescrita, e os bancos instalados já as têm. O segundo canal é o nome, no eixo
  e na tabela; a escolha no cadastro passou a ser informada na issue 05.
- **Observação fora do escopo**: o `git-dlog` declara `@fontsource/inter` e não
  importa a fonte em lugar nenhum. É dependência morta de outro workspace, e a
  independência entre eles é justamente o que impede esta issue de mexer nisso.

Revisão em dois agentes conforme `code-review`, base `d141755`:

- **Standards**: três violações e dois smells, todos acatados. (1) O estado
  vazio novo do Histórico é de **página inteira**, e usava ícone de 40 — a §5.4
  pede 48 para a página e 40 para a seção; o de dentro da aba, que é de seção,
  continua em 40. (2) O README da raiz listava `theme/index.ts` num esquema que
  vale para os quatro apps, e o Meu Dinheiro deixou de tê-lo: o bullet do
  `theme/` passou a dizer onde as peças dele moram. (3) O `contentQuery`, acima.
  (4) Duplicated Code: as cinco regras de foco que viraram cópias da regra de
  documento. (5) Primitive Obsession: `selectHistoryYear` nasceu para matar o
  "ano zero" e eu o reintroduzi duas vezes acima da guarda, com `?? 0`;
  `useCategoryTotals` passou a receber `number | null` e o ano anterior passou a
  responder `[]`, e com isso o zero não representa mais ausência em lugar nenhum.
- **Spec**: sete achados, todos acatados como correção de **afirmação**, não de
  código — três eram imprecisão minha no relato. (1) Eu escrevi "uma única
  família de fonte na árvore inteira" e a minha própria `matrix.json` dizia
  `["Arial","Geist"]` nas oito células de Configurações; medido nos dois builds,
  é idêntico antes e depois, e agora está registrado como exceção. (2) "Saíram
  77" eram 78. (3) A medição de regressão dizia "cada nó visível" e o método
  dela dizia "dentro de `.money-layout`" — os quatro ancestrais e o `<option>`
  ficavam fora, então eles foram medidos à parte e o escopo entrou onde o número
  está. (4) "As cinco telas" contradizia o README do app ("três telas") e a spec
  (quatro mais transversais): a contagem saiu. (5) A evidência do retorno ao
  Histórico registrava `aba` na ida e não na volta, e a prosa afirmava a aba; a
  bateria foi refeita registrando as duas pontas. (6) A correção do "ano 0" não
  tem linha na lista de critérios — ela vem da entrega da issue 05 —, e isso
  passou a estar dito. (7) O design system tinha ganhado uma frase começando
  "vale para qualquer app que faça a mesma", que é exatamente o que o critério de
  não generalizar guarda; foi escopada ao Meu Dinheiro.
- As correções da revisão foram remedidas contra o build com MUI: continuam
  **48 diferenças nos mesmos dois nós**, e **zero** diferença contra a medição
  anterior a elas — ou seja, a limpeza do CSS e o fim dos `?? 0` não mudaram um
  pixel. Foco em portal, foco preso no diálogo e devolução ao gatilho refeitos
  depois de apagar as cinco regras: mesmos 2px com offset 2px.

## Answer

Migração encerrada: o Meu Dinheiro não declara mais MUI, Emotion, Material Icons
nem Inter, e o que o `CssBaseline` sustentava sem aparecer — caixa herdada,
fonte do corpo, anel de foco do documento e o desligamento de movimento — passou
a ser dito na folha do app. O fundo da faixa de conteúdo virou token desta base
com a cor que já tinha, preservando a tabela de contraste de três issues. A
retirada foi medida contra o build anterior: dos 6300 nós de 24 telas, os únicos
48 que mudaram são valores herdados que nenhum descendente usa. Junto saiu o
"Nenhum mês cadastrado em 0" que a issue 05 anotou. Documentação do app, do
tema, do design system e da raiz atualizada, distinguindo o que foi implementado
do que foi validado.
