Status: resolved
Type: task
Blocked by: 04

# 05: Configurações, cadastros, criação de meses e backup

## What to build

Substituir acordeões por navegação interna de seis seções e migrar todos os fluxos de configuração.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

pages/settings/, formulários e hooks de contas bancárias, categorias, padrões, criação de meses e transferência de dados.

## Critérios de aceite

- [x] Exibir uma seção por vez: Contas bancárias, Categorias, Despesas padrão, Entradas padrão, Adicionar Meses e Backup; adaptar navegação interna para seletor compacto pela largura disponível, mantendo a seção selecionada durante redimensionamento.
- [x] Integrar orientação inicial e estados vazios aos destinos correspondentes, sem acrescentar uma sétima seção de produto ou recursos novos.
- [x] Migrar os quatro cadastros e seus diálogos de criar/editar/excluir, preservando campos, validações, contagens e saldo agregado de contas.
- [x] Manter seletor de cores de categorias e contraste do rótulo sobre a cor escolhida; não converter cores armazenadas em novos valores.
- [x] Explicar nas confirmações: excluir conta remove referências sem desfazer movimentos; excluir categoria deixa despesas Sem categoria; excluir padrão só afeta meses futuros.
- [x] Manter Valor variável e cópia de padrões na criação de Mês; verificar que editar/excluir padrão não altera meses existentes.
- [x] Migrar De/Até de Adicionar Meses, limite de 60, validação de intervalo, estado Criando e resumo de criados/ignorados; manter criação automática do Mês corrente e a competência excluída.
- [x] Migrar exportação/importação ZIP com seletores nativos, mensagens e confirmação explícita de substituição de todos os dados antes da seleção para importar; prevenir duplicação e tratar cancelamento sem sucesso falso.
- [x] Preservar compatibilidade de backups antigos, comprovantes e recusa transacional de ZIP inválido; validar exportar/restaurar em base isolada, nunca nos dados pessoais do usuário.
- [x] Manter carregamento/erro independentes por seção, indicar falha na navegação de seção oculta e permitir retry sem bloquear outros assuntos; migrar formulários, confirmações e notificações restantes.
- [x] Verificar as seis seções, teclado, mudança de largura, cadastros vazios, nomes longos, exclusões, intervalo com meses já existentes e ciclo de backup com comprovantes.
- [x] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [x] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [x] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação concluída em
2026-09-12. Configurações foi a última tela MUI do app: com ela migrada, nenhuma
tela ou diálogo usa componente MUI — sobra o provider de tema, que sai na issue 06. Os seis acordeões viraram **navegação interna com uma seção por vez**,
numa coluna de 200px que troca por seletor compacto quando a faixa de conteúdo
aperta. Domínio, banco, fachada API, contratos IPC e broadcast ficaram
intactos: o diff não toca `src/main`, `src/preload` nem `src/shared`. Valores e
medições em [orca-theme.md](../../../apps/meu-dinheiro-app/docs/orca-theme.md);
as emendas correspondentes estão no design system e nos dois READMEs.

**O limiar da navegação é medido, não escolhido.** A primeira tentativa trocava
em 720px de conteúdo, e a matriz mostrou o efeito: na janela mínima com a
lateral recolhida (848px) a coluna cabia, mas o painel ao lado dela deixava as
tabelas de quatro colunas rolando na horizontal — coisa que nenhuma tela desta
migração fazia até aqui. A lista mais larga (entradas padrão) mede 670px, então
a coluna só aparece a partir de 900px de conteúdo. No caminho apareceu a razão
de ela medir tanto: `.money-truncate` é `max-width`, que não alcança caixa
inline — o nome só reticencia dentro do `money-item-cell`, que é flex. Faltando
esse embrulho, um nome longo de conta empurrava a coluna inteira (779px → 670px
depois da correção).

Conteúdo preservado: os quatro cadastros com seus campos, validações e
contagens, o saldo agregado das contas, o seletor de dez cores de categoria, o
Valor variável, De/Até com limite de 60 e as pontas que se ajustam, o estado
Criando, o resumo de criados e ignorados, a exportação/importação em ZIP com
comprovantes, a confirmação de substituição antes do seletor e as três
consequências declaradas nas exclusões.

Validação no Electron real, perfil isolado em diretório temporário — nunca a
base pessoal —, semeada por IPC com 3 contas (uma negativa, uma de nome longo),
11 categorias (uma de nome longo), 3 despesas padrão (uma de valor variável),
2 entradas padrão, meses em quatro anos e um comprovante anexado.
Relatórios em [evidence/05](../evidence/05/).

- **Matriz de 48 combinações** (2 larguras × 2 temas × lateral aberta/recolhida
  × 6 seções): nenhuma rolagem horizontal de página ou de tabela, nenhum texto
  cortado, as seis seções renderizando. A navegação responde à largura de
  conteúdo medida — 688/848px na janela mínima viram seletor, 1008/1168px viram
  coluna. [matrix.json](../evidence/05/matrix.json),
  [claro 960](../evidence/05/claro-960-aberta-contas.png),
  [escuro 1280](../evidence/05/escuro-1280-aberta-meses.png),
  [nome longo](../evidence/05/escuro-960-categorias-nome-longo.png).
- **Cadastros**: criar, editar e excluir nos quatro, com recusa de campo
  obrigatório antes de aceitar, contagem e saldo agregado acompanhando, menu de
  linha nomeado por item e as três consequências no texto da confirmação.
  [operations.json](../evidence/05/operations.json).
- **Padrões e meses existentes**: editar o valor de uma despesa padrão não
  mudou o mês já criado, e excluí-la também não. O que **muda** é cadastrar:
  o `defaultExpensesService` propaga a cópia para todos os meses existentes, de
  propósito e documentado no próprio service. O README do app não dizia isso —
  passou a dizer, e a descrição da seção também.
- **Intervalo de meses**: pontas que se ajustam nas duas direções, legenda
  recusando acima de 60 com o botão desabilitado e `aria-describedby`, "Criando..."
  com o botão travado, e o resumo distinguindo criados de ignorados
  ("2 meses adicionados · 2 ignorados, que já existiam").
  [months.json](../evidence/05/months.json), [lote](../evidence/05/lote-criado.png).
- **Backup**: ciclo completo em base isolada — exportar (ZIP com `data.json` e
  `uploads/comprovante`), cancelar sem aviso nenhum, ZIP inválido recusado com
  a mensagem do main e nada alterado, backup legado (`version` + `accounts`/
  `default_accounts`, sem categorias, contas nem entradas) aceito, e restauração
  devolvendo 40 meses, 3 contas e o comprovante. [backup.json](../evidence/05/backup.json),
  [confirmação](../evidence/05/confirmacao-importar.png).
- **Estados por seção**: tabela `categories` renomeada por baixo do app. Duas
  seções falharam (categorias e despesas padrão, que a lê), e a falha apareceu
  **na navegação** — ícone em `danger` e ", não foi possível carregar" no nome
  acessível, com o mesmo texto no `<option>` do seletor compacto. As outras
  quatro continuaram operando. "Tentar novamente" mostrou esqueleto no primeiro
  quadro (3ms) e recuperou; cada seção recupera a sua.
  [states.json](../evidence/05/states.json),
  [erro na navegação](../evidence/05/erro-na-navegacao.png),
  [erro na seção](../evidence/05/erro-categorias.png).
- **Vazio e orientação inicial**: os três cadastros vazios com ícone, frase,
  ação e contagem zero coerente; a seção Adicionar Meses avisa quando não há
  padrão nenhum a copiar e leva para onde se cadastra; e os três passos da
  orientação inicial abrem a **sua** seção (`?section=…`), com a lateral e a
  navegação interna marcando o destino. [empty.json](../evidence/05/empty.json),
  [orientação](../evidence/05/orientacao-inicial.png).
- **Teclado e foco**: Tab percorre as seis seções e segue para a ação e as
  linhas; Enter e Espaço trocam de seção com o foco parado no item; o diálogo
  abre no primeiro campo, prende o foco (14 paradas, incluindo as dez amostras
  de cor) e devolve ao gatilho no Escape; a confirmação abre em "Cancelar" e
  devolve ao menu da linha; o seletor compacto troca de seção sem perder o
  foco. A seção escolhida sobrevive ao redimensionamento nas duas direções.
  [keyboard.json](../evidence/05/keyboard.json).
- **Contraste medido nas superfícies reais**: menor par de texto 5,31:1 (os
  rótulos e legendas sobre o fundo da faixa de conteúdo, no claro) e menor
  marca 3,19:1 (a borda de campo sobre esse mesmo fundo, valor que a issue 03 já
  media). Tabela completa em orca-theme.md.
  [contrast.json](../evidence/05/contrast.json).
- `npm run typecheck`, `npm run lint` (zero erros; dois avisos preexistentes no
  Meu Negócio), `npm test` (306 testes em 32 arquivos) e
  `npm run build -w meu-dinheiro-app` aprovados.

Decisões que saíram do caminho óbvio e ficam registradas:

- **Não há mais `ErrorState` de página inteira em Configurações.** Com uma seção
  por vez, a falha de todas as quatro não precisa tomar a tela — e tomá-la
  esconderia justamente o Backup, que é a saída de quem está com o banco
  quebrado. A navegação marca cada seção que falhou, e a que estiver aberta
  mostra o erro `dense` com tentar novamente, restaurar e abrir pasta.
- **A seção mora na rota.** A orientação inicial precisa apontar para o passo,
  não para a tela; um destino que não cabe num endereço não é destino. A troca
  usa `replace`, para o Voltar sair de Configurações em vez de desfazer a
  escolha de assunto, e uma seção desconhecida abre a primeira.
- **A paleta de categoria continua com dez cores e passou a informar o custo de
  cada uma** — era a pendência que a issue 04 deixou. Encolher para os sete que
  passam nos dois modos seria decidir pelo usuário uma cor que é dele (§1.7); o
  que a norma cobra é escolha informada, então o modo em que o swatch falha
  virou dado do tema (`CATEGORY_SWATCHES`), entra no nome acessível da amostra
  e vira nota só para a cor escolhida. Nenhuma cor cadastrada foi reescrita.
- **A recusa do backup deixou de virar "Ocorreu um erro".** O main devolve
  "Não foi possível ler o arquivo de backup", e o `showError` a embrulhava num
  `Error` sem código, que o `decodeAppError` lê como `unknown` — a única
  informação útil da falha era trocada por um genérico. Passou a `showSnackbar`
  de severidade `error`, como o `ErrorState` já fazia ao restaurar.
- **Exportar ganhou o estado que faltava.** Só a importação travava o botão;
  exportar abria um segundo seletor nativo no segundo clique. Agora troca o
  rótulo para "Exportando..." e desabilita, como toda ação pontual da §5.3.
- **`useMonthRangeCreator` virou casca.** A conta do intervalo, o ajuste das
  pontas, a legenda e o resumo do lote saíram para `monthBatch.ts`, que é puro
  e tem teste — antes nada disso era testável, e o resumo era o `"3 mes(es)
adicionado(s)! | Janeiro/2026 já existe | …"` que despejava uma frase por mês
  ignorado na notificação.
- **Os quatro cadastros são um componente, não quatro blocos.** `RegistrySection`
  carrega cabeçalho, ação, carregamento, falha, vazio e lista; `useRegistryActions`
  carrega os diálogos, no molde do `useItemActions` do detalhe de Mês. A tela
  caiu de 726 para ~380 linhas com seis seções em vez de uma.

Limitações registradas:

- O viewport de 960 × 640 foi aplicado por DevTools do Electron, como nas issues
  01–04, porque o gerenciador de janelas impõe um mínimo maior; 1280 × 800 foi
  aplicado à janela. Execução com `--no-sandbox` pelo helper SUID do ambiente.
- **Os seletores nativos de arquivo não foram acionados pelo sistema.** Não há
  automação de janela nativa neste ambiente, e o CDP não alcança um diálogo GTK.
  O ciclo de backup rodou sobre uma cópia do bundle de produção com **apenas o
  `dialogs` gateway** devolvendo caminhos de um arquivo de controle (inclusive o
  cancelamento); todo o resto — archive, transação de importação, restauração de
  comprovantes, mensagens — é o código real. O caminho do diálogo nativo em si
  continua verificado só por leitura.
- O Enter só ativa botão via CDP quando o `keydown` carrega texto; é limitação
  do protocolo, não do app, e está anotada no arquivo de teclado.
- As dez amostras de cor são dez paradas de tabulação, como eram na base MUI.
  Um grupo de rádio com setas seria menos paradas, mas muda o padrão de
  interação do controle — fica como observação, não como pendência desta issue.
- Configurações não usa mais MUI, mas o fundo da faixa de conteúdo continua
  vindo do provider MUI: ele é publicado por `ThemeModeProvider`, e trocá-lo é
  a mesma mudança que remove o provider. Fica para a issue 06, junto do
  `CssBaseline` e das dependências.

Revisão em dois agentes conforme `code-review`, base `a32ca3c`:

- **Standards**: duas correções e três smells acatados. (1) O README da raiz
  ficou se contradizendo: o parágrafo da migração passou a dizer que nenhuma
  tela usa MUI, mas os três bullets abaixo ainda davam o Git Dlog como única
  exceção de ícone e de tema — os três passaram a nomear o Meu Dinheiro. (2) A
  lista de seções existia duas vezes: os ids na rota e os títulos na ordem da
  tela. Agora a ordem e o conjunto vêm de `SETTINGS_SECTIONS`, a tela preenche
  um `Record<SettingsSection, …>` — que o `tsc` obriga a ser completo — e o
  nome do parâmetro virou `SETTINGS_SECTION_PARAM`, exportado de `routes.ts` em
  vez de repetido. O `failed: !loading && !!error` repetido quatro vezes virou
  `navState`, e o `contrastNote` deixou de ser calculado duas vezes por
  render. Dois achados foram avaliados e **não** acatados: `monthBatch.ts` fica
  em `hooks/months/` porque quem o consome é o hook de lá — um módulo de
  `hooks/` importando de `pages/` inverteria as camadas, e é o mesmo arranjo de
  `hooks/categories/categoryRows.ts`; e `useRegistryActions` não se funde com o
  `useItemActions` do Mês, porque o de lá carrega pagar/receber/detalhe e a
  fusão pagaria com opcionais o que hoje é um conjunto fechado. A contagem de
  props do `RegistrySection` segue o precedente do `ItemsTab`, que tem a mesma
  forma.
- **Spec**: três achados, dois corrigidos. (1) O estado vazio do **Histórico**
  ainda mandava para a tela de Configurações, não para a seção que cria meses —
  era o único destino sem seção depois desta issue, e o botão agora diz "Ir
  para Adicionar Meses" e abre `?section=months`. (2) O intervalo De/Até vivia
  dentro da seção, que desmonta ao trocar de assunto: ele subiu para a tela,
  como estava nos acordeões, e com ele o estado "Criando" — um lote disparado
  continua sendo o lote da visita mesmo se o usuário for conferir outra seção.
  (3) A confirmação de importar carregava `loading`/`loadingLabel` mortos, já
  que ela fecha antes de abrir o seletor; os dois saíram.
  [recheck.json](../evidence/05/recheck.json).
- Da revisão de spec ficam duas observações **não** acatadas, com razão
  registrada: o aviso de "nenhum padrão a copiar" continua exigindo as duas
  listas vazias, porque quem não tem entrada fixa nenhuma (um autônomo) não
  precisa de um aviso permanente; e o terceiro passo da orientação inicial
  abre Despesas padrão, com Entradas padrão logo abaixo na navegação, em vez de
  virar um quarto passo.
- **Achado fora do escopo, anotado para a issue 06**: sem mês nenhum no banco,
  o Histórico escreve "Nenhum mês cadastrado em **0**" — `selectedYear` cai
  para `years[0] ?? 0`. É anterior a esta issue e é da tela da issue 04;
  corrigi-lo aqui mudaria uma tela cuja validação já está fechada.
  [historico sem meses](../evidence/05/historico-sem-meses.png).

## Answer

Configurações migrada para a base Orca: os seis acordeões viraram navegação
interna com uma seção por vez, que troca por seletor compacto num limiar medido
contra a tabela mais larga da tela, e os quatro cadastros, a criação de meses em
lote e o backup passaram inteiros — campos, validações, contagens, saldo
agregado, cores cadastradas e consequências declaradas. A falha de uma seção
agora se vê da navegação, a orientação inicial abre a seção de cada passo e a
paleta de categoria diz o que cada cor custa em contraste. Com ela, nenhuma tela
do app usa MUI. Issue 06 desbloqueada.
