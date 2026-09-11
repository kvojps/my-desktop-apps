# Tokens do piloto Orca

Referência fixada em 2026-09-10: Orca, commit
[`f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7`](https://github.com/stablyai/orca/tree/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7).
Extração do [main.css](https://github.com/stablyai/orca/blob/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7/src/renderer/src/assets/main.css),
com botão local inspirado na composição shadcn/Radix Slot. Não copiamos o catálogo
nem os estilos globais do aplicativo de referência.

| Token              | Claro              | Escuro                  | Variável CSS              |
| ------------------ | ------------------ | ----------------------- | ------------------------- |
| Página             | `#ffffff`          | `#0a0a0a`               | —                         |
| Papel              | `#ffffff`          | `#171717`               | `--dlog-paper`            |
| Lateral            | `#fafafa`          | `#171717`               | `--dlog-sidebar`          |
| Texto              | `#0a0a0a`          | `#fafafa`               | `--dlog-foreground`       |
| Texto secundário   | `#666666`          | `#a1a1a1`               | `--dlog-muted-foreground` |
| Hover / seleção    | `#f5f5f5`          | `#262626`               | `--dlog-accent`           |
| Borda              | `#e5e5e5`          | `rgb(255 255 255 / 7%)` | `--dlog-border`           |
| Foco               | `#2771ca`          | `#3987e5`               | `--dlog-focus`            |
| Ação               | `#2771ca`          | `#3987e5`               | `--dlog-primary`          |
| Sucesso            | `#0a7d0a`          | `#0ca30c`               | `--dlog-success`          |
| Risco              | `#cf3939`          | `#d85b5b`               | `--dlog-danger`           |
| Atenção            | `#fab219`          | `#fab219`               | `--dlog-warning`          |
| Rótulo sobre cor   | `#ffffff`          | `rgb(0 0 0 / 87%)`      | `--dlog-on-color`         |
| Rótulo sobre âmbar | `rgb(0 0 0 / 87%)` | `rgb(0 0 0 / 87%)`      | `--dlog-on-warning`       |

Só vira variável CSS o token que o CSS do piloto consome; o resto da paleta
chega pelo tema MUI, e página e info estão nesse caso hoje. `--dlog-mono`
publica a família monoespaçada. Raios: superfície 10px (`--radius-lg`),
controle 6px (`--radius-md`).

O secundário claro é adaptado de `#737373` para `#666666`, garantindo AA inclusive
sobre hover e seleção. Foco mantém o azul do Git Dlog para passar 3:1 contra as
superfícies. A seleção também usa peso 600, indicador lateral e `aria-current`.
As cores semânticas MUI permanecem as do manual: primary `#2771ca` / `#3987e5`,
secondary `#4a3aa7` / `#9085e9`, success `#0a7d0a` / `#0ca30c`, error `#cf3939` /
`#d85b5b`, info `#0f7c91` / `#1190a9`. Warning `#fab219` continua somente
preenchimento, com rótulo preto, conforme ADR-0001. Não adotamos os contrastes
semânticos do Orca sem avaliação.

Geist empacotada (400/500/600/700), fallback de sistema; JetBrains Mono continua
para caminhos, hashes e branches. Superfícies: raio 10px; controles: 6px. Nova
navegação: texto 14px/20px, ícones 18px, controles 36px de altura, intervalo 4px,
padding interno 12px, lateral expandida 224px e recolhida 64px. Conteúdo mantém
padding 24px, teto 1440px e rolagem independente; janela mínima 960 × 640.

## Coexistência

Tailwind v4 é carregado com prefixo `orca`, sem Preflight, somente tema e
utilitários. O reset MUI existente continua responsável pela base. Estilos de
controles nativos ficam restritos à classe local do botão. Tokens CSS são
publicados pelo mesmo tema MUI em `CssBaseline`, inclusive para futuros portais;
os dois sistemas recebem o modo inicial do preload e a persistência existente.
O fundo nativo acompanha os novos valores pelo gateway atual, sem novo contrato.
Somente a navegação usa controles locais Radix e Lucide nesta etapa.

A tabela acima continua sendo a referência — divergir dela é bug do código. Desde
a etapa 02 o código a lê num ponto só: `orcaTokens`, em `theme/index.ts`,
alimenta a paleta MUI e as variáveis `--dlog-*` de uma vez, em vez de repetir os
valores nos dois lugares. Era o achado de baixa prioridade da revisão da etapa 01.

## Lista e painel — etapa 02

A tela de Repositórios divide o espaço em dois painéis com rolagem própria, e
quem decide se cabem lado a lado é a largura do **contêiner**, não a da janela:
recolher a lateral devolve 160px e muda a resposta sem a janela mudar de
tamanho. O limite é 820px de região, medido por `ResizeObserver`; abaixo dele a
tela alterna entre lista e detalhes. Lista com 360px fixos quando lado a lado.

Para os painéis medirem, a tela precisa de altura fechada; a tela em fluxo
normal precisa do contrário, sob pena de perder o respiro do padding embaixo
quando o conteúdo passa da janela. Quem pede a altura é a tela, declarando
`data-fill-height`, e `.orca-shell:has(> [data-fill-height])` responde.

Severidade na lista: `risco` e `erro` em preenchimento `danger` com o rótulo de
contraste do modo, `atenção` em âmbar com rótulo preto (ADR-0001) e `limpo` em
contorno neutro — sempre com ícone e palavra ao lado da cor (§1.7). As pendências
não recebem cor: sobre a linha selecionada do tema claro o `#cf3939` cai de
4,89:1 para 4,06:1, abaixo de AA, então o peso do texto é que separa o que é
risco. A seleção usa fundo `accent`, barra lateral em `primary` e `aria-current`.

## Detalhes do repositório — etapa 03

O painel do repositório escolhido é um cabeçalho de identidade — severidade,
nome, site publicado, último fetch e caminho completo — seguido de quatro seções
na ordem que o ticket pede: resumo e pendências, PRs, branches e último commit.
Só as duas do meio recolhem, e recolher é decisão de conteúdo: PRs nascem
abertos porque é ali que está a ação; branches nasce fechada porque é a seção
extensa e os problemas dela — nunca publicada, upstream apagado, PR mergeado —
já estão em cima, na seção que não recolhe. Seção sem conteúdo não vira botão:
ela diz o que não tem e fica. O cabeçalho de cada seção recolhível é um `button`
com `aria-expanded`/`aria-controls`, e o painel continua montado sob `hidden`
para que o `aria-controls` sempre aponte para algo que existe.

**Três tons, e o âmbar não é um deles.** O `StatusChip` do piloto tem `danger`,
`success`, `emphasis` e `neutral`. Medido sobre o papel dos dois modos: danger
4,89:1 no claro e 4,75:1 no escuro; success 5,32:1 e 5,34:1. Nenhum deles vai
sobre `accent` — ali o mesmo vermelho cai para 4,48:1 e o azul do link para
4,48:1, abaixo de AA (design system §1.1). Daí duas consequências: o PR da
branch atual se destaca por etiqueta preenchida, posição e peso, e não por fundo
tingido; e o link de PR não ganha fundo no hover, ganha sublinhado. O âmbar não
entra como tom porque como texto ele dá 1,83:1 e nem como ícone alcança os 3:1
de objeto gráfico (§1.4, ADR-0001); ele continua preenchido no `SeverityBadge`,
que é onde já estava.

Sem o âmbar sobra decidir o que ocupa o lugar dele, e a regra é uma só: **o tom
espelha `summarizePendencies`** — o que é risco na lista vira `emphasis` aqui, o
que é neutro lá continua neutro —, **e `danger` fica reservado aos dois casos em
que o trabalho pode sumir de vez**: conflito e trabalho que só existe nesta
máquina (branch nunca publicada, branch sem upstream). Lista e painel descrevem
o mesmo repositório; uma pendência que grita num e sussurra no outro seria uma
contradição entre as duas metades da tela, e é por isso que a regra é testada —
`repoDetails.test.ts` compara os dois lados em vez de confiar na leitura.

O `StatusChip` de MUI foi retirado: ele só tinha consumidores nesta tela, e o do
piloto nasce em `pages/repos/components/` pela regra de promoção do ADR-0004 —
sobe para `components/` quando uma segunda tela precisar. O `ErrorState`, que já
serve duas telas, foi migrado no lugar em que está; Diretórios passa a vê-lo na
linguagem nova até a etapa 04. A mensagem crua do erro deixou `text.disabled`
para trás e vai em texto secundário, que é o que a §1.4 manda.

As regras do painel moram em `pages/repos/utils/repoDetails.ts`: estado de
sincronia, itens da working tree, avisos de branch, contagem local/remota e a
ordem dos PRs. O agrupamento por commit carrega só nomes, então quem diz o que é
remoto é a leitura do repositório, não a barra no nome — `feat/a` é local e tem
barra igual a `origin/main`. E como o nome não distingue, a etiqueta da branch
não pode distinguir só por cor: ela leva ícone de nuvem ou de disco, com rótulo
acessível, que é o segundo canal da §1.7.

## Validação da etapa 01 — 2026-09-10

Contraste WCAG calculado em sRGB: texto secundário sobre seleção 5,27:1 no
claro e 5,86:1 no escuro; foco contra seleção 4,48:1 e 4,16:1. Success, error e
info sobre o papel do respectivo modo permanecem acima de 4,5:1 (mínimo 4,75:1).

- Typecheck dos quatro apps aprovado; build de produção do Git Dlog aprovado.
- Suíte completa: 21 arquivos, 187 testes aprovados; teste direcionado de canais
  IPC: 6 aprovados. Nenhuma regra pura foi alterada, sem novos testes de UI.
- Lint sem erros; dois avisos preexistentes de dependências de hooks em
  `meu-negocio-app` (OrdersContext e ProductsContext).
- Electron real, build de produção, perfil temporário: três rotas nos temas claro
  e escuro, viewports 960 × 640 e 1280 × 800, sem overflow horizontal. Capturas
  inspecionadas de Configurações no claro, Diretórios no escuro e diálogo de token.
- Lateral 224px inicialmente e 64px recolhida; Enter recolhe e ativa os links;
  Tab percorre controles e foco tem anel de 2px nos dois temas. Tema claro salvo
  pela navegação restaurado após encerrar e reabrir o Electron, lateral expandida.
- Estado sem diretórios, detecção das integrações e abertura/cancelamento do
  diálogo de token conferidos; cancelar devolve foco ao botão que abriu o diálogo.
- Limites: o gerenciador de janelas manteve a janela externa maximizada apesar
  das chamadas de redimensionamento; os tamanhos foram aplicados ao viewport via
  DevTools no Electron. Falta a conferência manual da moldura em 960 × 640 e
  operações com dados reais (seletor nativo, cadastro/remoção, fetch e token).
  Não houve mudança de contratos ou implementação dessas operações. O ambiente
  exigiu `--no-sandbox` porque seu helper SUID do Electron não está configurado;
  isso foi somente argumento da execução de validação, sem alterar o app.

Revisão em dois agentes, base `cbdebc59bcce812cf48d9837d61cbc0eb44c8a1f`:
Standards sem violações documentadas, uma sugestão de baixa prioridade sobre
repetição dos tokens entre paleta MUI e variáveis CSS; Spec sem defeitos de
implementação. A sugestão fica registrada para a consolidação do tema; a
validação manual acima permanece pendente e não é substituída pela suíte pura.

## Validação da etapa 02 — 2026-09-11

Electron real, build de produção, perfil temporário e dez repositórios git
sintéticos num diretório-base de teste: nomes repetidos em pais diferentes,
caminho longo, working tree suja com stash, branch nunca publicada, branch com
upstream apagado, HEAD detached, repositório sem remoto e limpos.

- Ordem risco → atenção → limpo, alfabética dentro do grupo, e o trecho de
  caminho aparecendo só nos dois `api-limpo` (`pessoal` e `trabalho`).
- Seleção por identidade: sujar o repositório selecionado e Atualizar moveu
  `docs` da posição 8 para a 2 e o painel continuou sendo o de `docs`.
- Seleção escondida por filtro cai para o primeiro visível, e a queda vira a
  escolha: destaque e painel apontam para o mesmo repositório, e limpar o filtro
  não devolve o anterior sem ninguém pedir. Trocar de repositório remonta o
  cartão pelo `key`, então nenhuma seção expandida sobrevive à troca.
- Busca e contagens: `api` levou "todos (10)" a "todos (2)" com os chips
  recontados; "Limpar filtros" devolveu os 10.
- Janela estreita (960 × 640, lateral expandida): selecionar abriu os detalhes,
  "Voltar para a lista" devolveu a lista na rolagem exata (175px) com filtro e
  seleção intactos e o cursor de volta no item escolhido. Recolher a lateral na
  mesma janela põe os dois lado a lado, e nenhum quadro da montagem mostra os
  dois painéis numa janela estreita.
- Estados: carregamento, sem diretórios cadastrados (com "Ir para Diretórios" e
  as duas ações desabilitadas), varredura concluída sem repositórios (com
  "Varrer de novo" — antes ficava carregando para sempre) e nenhum resultado dos
  filtros. Busca e chips não aparecem sobre os dois primeiros.
- Buscar do remoto manteve-se manual: barra de progresso com fase, repositório
  atual e 9/9, botões desabilitados, aviso de conclusão e última leitura nova.
- Tema escuro salvo pela navegação foi restaurado ao reabrir o Electron. Tab
  percorre os dez itens da lista com anel de foco visível nos dois temas, e a
  lista rola sozinha para trazer o item focado. Sem overflow horizontal em
  960 × 640, 1280 × 800 e 1440 × 900. Diretórios e Configurações continuam
  rolando pela janela, com o padding inferior preservado.
- Typecheck dos quatro apps, lint e build de produção do Git Dlog aprovados;
  suíte completa com 23 arquivos e 218 testes, dos quais 28 novos em
  `pages/repos/utils/repoList.test.ts`. Lint mantém os dois avisos preexistentes
  de dependências de hooks em `meu-negocio-app`.
- Limites: os PRs não foram exercitados com provedor real — os repositórios de
  teste usam remotos locais, sem GitHub ou GitLab —, então "PR pedindo ação" e
  "com PR aberto" foram verificados só pela suíte pura. O ambiente exigiu
  `--no-sandbox` por falta do helper SUID do Electron; isso foi argumento da
  execução de validação, sem alterar o app.

Revisão em dois agentes, base `04ba65fa109098e60eea9d978e968d44a61984f0`.
Standards apontou três violações documentadas, todas corrigidas: a ordenação por
severidade tinha sido reimplementada no renderer contra o ADR-0003 e voltou a ser
só do main; o ícone do estado vazio usava 36 e passou a 40 (§5.4); e os tokens
novos entraram na tabela acima, com `--font-mono` lendo o valor do tema em vez de
repeti-lo. Spec apontou três, também corrigidas: o foco não voltava ao item ao
sair dos detalhes, a queda de seleção por filtro não se comprometia com o que a
lista destacava, e a janela estreita pintava um quadro lado a lado antes da
primeira medição.

## Validação da etapa 03 — 2026-09-11

Electron real, build de produção, perfil temporário e os mesmos dez repositórios
sintéticos da etapa 02, recriados: nomes repetidos, caminho e assunto longos,
working tree suja com stash, conflito de merge em andamento, branch nunca
publicada, branch com upstream apagado, HEAD detached, repositório sem remoto e
repositório sem nenhum commit.

- Ordem das seções conforme o ticket, com resumo e pendências sempre aberto,
  PRs abertos por padrão e branches fechada. Recolher e expandir funciona por
  clique, por `Enter` e por `Espaço`, com `aria-expanded` acompanhando.
- Caminho completo, nome ligado ao remoto, globo do site publicado e "remoto
  lido há N / nunca buscado" conferidos. `Enter` no globo chegou ao
  `shell.openExternal`: um servidor local anotado em `dlog.url` registrou o
  acesso, provando o caminho fachada → IPC → main sem abrir link de terceiros.
- Working tree: conflito em `danger`, staged/modificados/não rastreados/stashes
  em `emphasis`, e "Working tree limpa" quando não há nada. Sincronia coerente
  em todos os casos — sem upstream, ahead/behind, sincronizada, HEAD detached e
  sem commits.
- Branches: contagem local/remota, agrupamento por commit com hash, assunto,
  autor e idade, e a distinção local/remota vinda da leitura do repositório
  (`origin/main` neutra, `feat/rodape` local, apesar da barra).
- PRs exercitados com um `gh` de mentira no PATH, apenas na execução de
  validação: o PR da branch atual apareceu primeiro, com etiqueta "branch
  atual", título em negrito, "mudanças pedidas" e "CI falhou"; rascunho com CI
  rodando e PR aprovado com CI ok nas linhas seguintes; o PR mergeado virou
  "PR já mergeado, pode ser apagada" no resumo. Origem → destino e atualização
  relativa em todas as linhas.
- Seções vazias: sem PRs com remoto, sem remoto configurado, sem branches e sem
  commits — cada uma com a frase que descreve o caso, em vez de seção em branco.
  Com HEAD detached, "Último commit" explica que o commit está no agrupamento,
  em vez de afirmar que o repositório não tem commits.
- Temas claro e escuro conferidos nas duas telas do fluxo; 960 × 640 com a
  lateral expandida alterna lista e detalhes, e o caminho de 150 caracteres e a
  branch de 70 quebram sem overflow horizontal (`scrollWidth` = `clientWidth`).
  Tab percorre lista, nome, globo e cabeçalhos de seção com anel de foco visível.
- Seleção, busca, filtros, Atualizar/Buscar do remoto, progresso por fase e
  retorno à lista continuam como a etapa 02 os deixou.
- Typecheck dos quatro apps, lint, `prettier --check` e build de produção do Git
  Dlog aprovados; suíte completa com 24 arquivos e 238 testes, dos quais 20
  novos em `pages/repos/utils/repoDetails.test.ts`. Lint mantém os dois avisos
  preexistentes de dependências de hooks em `meu-negocio-app`.
- MUI na tela de Repositórios: nenhum componente dela importa mais `@mui`. O que
  resta no caminho é global e das outras telas — o `AppSnackbar` do contexto de
  avisos e o `ThemeProvider`, que é quem publica os tokens `--dlog-*`. Nenhuma
  dependência foi removida do `package.json`; isso é da etapa 06.
- Limites: o provedor de PRs continua não tendo sido exercitado contra GitHub ou
  GitLab de verdade — o `gh` de mentira devolve JSON no formato que o
  `ghCli.parseGhOutput` já converte, então o que foi verificado é a apresentação,
  não a integração. O ambiente exigiu `--no-sandbox` por falta do helper SUID do
  Electron; isso foi argumento da execução de validação, sem alterar o app.

Revisão em dois agentes, base `264e9ac234baded0ad31cb8ce39d4b523f9f7f8b`. Spec
apontou que a migração tinha achatado a urgência: sem o âmbar, tudo que era
risco virou peso e o que era atenção subiu junto, então "2 não rastreados"
gritava igual a "2 modificados" e o painel contradizia a lista em três pontos.
Daí saiu a regra de tom registrada acima, agora testada contra
`summarizePendencies` — `gone` e HEAD detached voltaram a neutro. Standards
apontou quatro correções, todas feitas: o `map.md` do tracker não tinha sido
atualizado e ainda afirmava que os detalhes eram o `RepoCard`; o ADR-0003
justificava `isWorktreeDirty` em `shared` por ser chamado dos dois lados, e o
chamador do renderer era justamente o `RepoCard` — a emenda está no ADR; o
`docs/agents/domain.md` citava o arquivo apagado como exemplo de caminho
verificável; e a etiqueta de branch separava local de remota só por cor, contra
a §1.7, e ganhou ícone com rótulo acessível. Os demais achados eram de forma e
foram aceitos: chaves de ícone tipadas em vez de `Record<string, …>`, o mapa de
tons num lugar só, `CommitLine` recebendo o `RepoCommit` inteiro e `LucideIcon`
no lugar de `typeof CircleCheck`. Fica de pé, sem mudança: o `title` nativo onde
havia `Tooltip` de MUI — nenhum dos dois alcança o teclado num `span`, então não
há regressão a corrigir aqui.
