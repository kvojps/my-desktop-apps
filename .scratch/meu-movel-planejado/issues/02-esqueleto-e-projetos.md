# 02: Esqueleto do app e tela de Projetos

**What to build:** o app existe e serve para alguma coisa. O comando de dev sobe uma janela que já nasce no tema certo, com o rail e as rotas da casa, e a tela de Projetos funciona de ponta a ponta: criar um projeto de corte com nome e material, renomear, excluir, e ver a lista com o que foi alterado por último. Quem nunca abriu o app encontra uma tela que explica que ainda não há projeto e como criar o primeiro.

O banco nasce aqui com o **schema completo** da feature, incluindo as tabelas que só serão usadas pelos tickets seguintes. Nada foi publicado ainda, então nenhum banco instalado precisa ser migrado e a lista de migrações permanece vazia.

**Blocked by:** 01 (o vocabulário do glossário é o que nomeia tabelas, tipos e telas).

**Status:** done

- [x] O comando de dev da raiz sobe o app; o de distribuição gera o instalador Windows.
- [x] A janela nasce com a cor de fundo do modo salvo, sem piscar branco; alternar o tema repinta as janelas já abertas.
- [x] A preferência de tema mora no banco, não no armazenamento do renderer — o processo principal precisa dela antes de existir renderer.
- [x] O schema completo é criado na instalação nova e a lista de migrações permanece vazia.
- [x] Toda medida é persistida em décimos de milímetro como inteiro; a conversão para milímetro acontece na leitura do repositório e na formatação da tela, nunca no meio da lógica. — **com divergência declarada, ver comentário.**
- [x] Criar projeto com nome e material; renomear; excluir com confirmação.
- [x] A lista mostra nome, material e data da última alteração.
- [x] Estado vazio (nunca houve projeto) é distinto do estado de erro de carregamento, e o de erro oferece tentar de novo e abrir a pasta de dados.
- [x] Se o banco não abrir, nenhuma janela chega a existir e o usuário recebe uma mensagem com a opção de abrir a pasta de dados.
- [x] Toda entrada vinda do renderer passa por validação; nenhum handler registra IPC direto, sempre pelo wrapper que converte a falha.
- [x] Os canais de leitura estão enumerados; todo canal fora dessa lista dispara a invalidação de dados.
- [x] `npm run typecheck` e `npm run lint` limpos.

## Comments

**2026-08-22 — implementado.**

Estrutura copiada do `git-dlog` (o menor, com o arquivo de migrações vazio) e
conteúdo do tema vindo do `meu-negocio-app` (o mais completo), como a spec
mandava. O app sobe (`npm run dev:movel`), cria o banco em
`%APPDATA%/meu-movel-planejado`, e o schema conferido no disco tem as nove
tabelas com `user_version = 0`.

**A linha do `rowToX` está errada no ticket, e o código seguiu a spec.** O
critério diz "a conversão para milímetro acontece na leitura do repositório e na
formatação da tela". Se o repositório convertesse, o que trafega pelo IPC seria
milímetro em ponto flutuante — o contrário de "toda medida trafega e é
persistida em décimos de milímetro", que é a decisão da spec e a definição do
glossário. O que o `rowToX` converte é `snake_case` → camelCase, que é a
convenção do monorepo (README §2.5) e o que a frase da spec de fato descreve.
`rowToProject` devolve `kerfTenthsMm` cru, e milímetro só existe na digitação e
na tela. A frase do ticket é que precisa ser corrigida, não o código.

**`shared/units/measure.ts` ainda não tem chamador.** As duas conversões estão
escritas e testadas, e nenhuma tela as usa: nada exibe medida até o ticket 03.
Ficam pelo mesmo motivo que as tabelas do plano ficam — este ticket é o que
constrói fundação antes do uso —, e são a metade da regra de unidade que dá para
provar com teste. É a única coisa no diff sem consumidor.

**Desvio deliberado do schema: `rejected_pieces` é uma nona tabela.** A spec
enumera oito e não inclui peça rejeitada. Ela entrou como tabela própria, e não
como coluna discriminadora em `unallocated_pieces`, porque o ticket 01 fixou que
não alocada ≠ rejeitada: a primeira entra no déficit e se resolve comprando
chapa, a segunda não. Numa tabela só, a consulta do déficit passaria a depender
de um `WHERE` correto, que é exatamente a confusão que o glossário existe para
impedir. O ticket 06 herda a decisão e pode revertê-la enquanto nada foi
publicado.

**Outras decisões de escopo, todas declaradas:**

- **Editar material, e não só renomear.** O critério pede "renomear"; o mesmo
  formulário edita nome e material. São os dois rótulos do serviço, e corrigir
  `MDF 15mm` para `MDF 15 mm branco` não deveria custar um projeto novo.
- **Uma rota só.** `routes.ts` tem `PROJECTS`, e o rail tem um item. Projeto,
  Plano e Configurações são dos tickets 03, 05 e 10; constante de rota apontando
  para tela que não existe seria código morto.
- **README raiz.** A linha da tabela de apps e os comandos são checkbox do
  ticket 11, mas os scripts de raiz são deste (critério 1) e deixar o README
  descrevendo três apps enquanto existem quatro seria falso. Feitos aqui; o 11
  pode marcá-los.
- **README do app não existe** — é do ticket 11, que está bloqueado por 06–10.
- **`trim` é o refile do glossário.** O schema é anglicizado por inteiro
  (`utilization`, `unallocated_pieces`, `deficit_area`), e `trim` é a tradução
  fiel. O tipo carrega a nota de que o rótulo de tela é "Refile", que é o que o
  ticket 03 vai escrever.

**Duas seams puras, em TDD.** A conversão de unidade e o
`shouldNotifyDataChanged`. São as únicas coisas do ticket que a suíte do
monorepo alcança — ela cobre lógica pura, sem Electron, DOM ou banco. O seam do
empacotador continua sendo o do ticket 04.

**Da revisão em dois eixos, corrigido:**

- O item ativo do rail usava `alpha(primary, 0.12/0.22)` literal, copiado dos
  outros apps. O design system (§1.6, §2) manda `tint(0.1)`, com o ×1.8 do
  escuro num helper nomeado do módulo de tema. `tint` e `stripe` agora são
  exportados de `theme/index.ts` e o rail consome o mesmo helper da tabela — os
  outros dois apps continuam divergentes, e isso é bug deles.
- `deleteProject` apagava em silêncio e dizia "Projeto excluído" mesmo quando a
  linha já não existia. Agora é 404, como o update, e a falha recarrega a lista
  para a linha fantasma sumir.
- `sorted` virou `sortedProjects`; `sorted.length` não dizia de que.
- A assimetria de erro entre excluir (trata) e criar/editar (propaga) ficou
  escrita: quem chama a exclusão é um `ConfirmDialog`, que fecha de qualquer
  jeito, e não um formulário que precisa continuar aberto.

**Recusado, com razão declarada:**

- "Os dois schemas zod de projeto são idênticos — extraia para `shared`." O repo
  documenta **dois** lugares de propósito: `main/schemas/` é a fronteira de
  confiança (README §2.2) e o schema de formulário mora junto do hook (§2.4).
  O `meu-negocio-app` tem o mesmo par. Regra documentada vence heurística de
  duplicação; o schema do renderer diz no comentário que a validação do main é a
  que vale.
- "`theme:set` e `data:openFolder` deveriam ser leitura, para não recarregar a
  lista à toa." Nenhum dos dois é leitura — `theme:set` grava em `settings`.
  Colocá-los numa lista chamada `READ_ONLY_CHANNELS` para economizar uma recarga
  seria mentir para o mecanismo. A convenção já declara que o custo do lado
  seguro é uma recarga a mais.
- "Medida deveria ser um tipo marcado (`TenthsMm`) em vez de sufixo no nome."
  Nenhum app do monorepo marca unidade, e o atrito apareceria em cada aritmética
  do empacotador. O sufixo no nome do campo é o que os três apps fazem hoje.

**O que foi de fato verificado:** `typecheck` e `lint` limpos nos quatro apps,
14 testes passando, `electron-vite build` completo, o app subindo em modo dev
sem erro no log, e o schema lido do arquivo `.db` em disco (nove tabelas, seis
índices, `user_version = 0`, `settings` vazia — o tema só nasce no primeiro
toggle, como a regra manda).

**O que não foi:** a interação da tela — criar, editar, excluir, alternar o tema
sem piscar branco — não foi exercitada. Não há como dirigir a janela do Electron
por automação aqui, e a suíte do monorepo não alcança DOM nem Electron por
decisão da spec. Essas quatro coisas estão implementadas pelo mecanismo que o
design system documenta, e conferidas por leitura, não por observação.
