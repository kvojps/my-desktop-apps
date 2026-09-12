Status: resolved
Type: task
Blocked by: 02

# 03: Detalhe de Mês, despesas, entradas e diálogos

## What to build

Migrar a operação financeira diária e corrigir o retorno do Mês à consulta de origem.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

pages/month-detail/, routes.ts, componentes de diálogos/tabela e integração de navegação em pages/dashboard/ e pages/history/.

## Critérios de aceite

- [x] Manter cabeçalho, navegação anterior/próximo, exclusão e indicadores; Realizado em destaque e Previsto explicitamente identificado, sem mudar fórmulas.
- [x] Restaurar origem Visão Geral ou Histórico ao voltar, incluindo intervalo/ano, filtros, ordenação, página, rolagem, aba e gráfico/tabela pertinentes; manter origem ao trocar de Mês e destacar essa origem na lateral.
- [x] Usar Visão Geral como retorno quando não houver origem; diante de Mês inexistente ou excluído oferecer retorno válido. Reaplicar a consulta aos dados atuais e ajustar página que deixou de existir, sem recuperar totais obsoletos.
- [x] Migrar abas Despesas/Entradas e contagens de quitação, busca por nome, status, categoria nas despesas, ordenação por nome/data/valor e paginação de 12; manter data crescente como ordem inicial.
- [x] Manter todas as colunas: nome, categoria ou conta bancária, data de vencimento/previsão, status, valor e ações; data de quitação no detalhe/tooltip e indicadores de observação/comprovante.
- [x] Migrar diálogos de criação, edição e detalhe para ambos os tipos, preservando campos, mensagens, validações e abertura por clique/teclado; ações da linha não disparam sua abertura.
- [x] Migrar pagar e receber, mantendo data, conta opcional conforme fluxo, observação, Valor variável e comprovante exclusivo do pagamento. Preservar conta sugerida no recebimento e limite de data atual.
- [x] Conferir débito/crédito, recusa de saldo insuficiente e operações inversas; impedir submissão duplicada e manter valores digitados após erro recuperável.
- [x] Manter upload de imagem/PDF até 10 MB e abertura no programa externo; confirmar que desfazer pagamento apaga comprovante e desfazer recebimento preserva vínculo da conta.
- [x] Manter confirmações e consequências de excluir item/Mês e desfazer operações, bloqueio durante execução e feedback. Preservar cascata e comportamento da competência excluída.
- [x] Verificar navegação e retorno desde ambas as telas antes da migração visual do Histórico; a issue 04 reaproveita o comportamento.
- [x] Adicionar testes de lógica pura para o comportamento novo de restauração, incluindo origem ausente e dados removidos; validar integração no Electron com mais de 12 itens, filtros, pagamento/recebimento e comprovantes em base de teste.
- [x] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [x] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [x] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação concluída em
2026-09-12. O detalhe de Mês passou inteiro para a base Tailwind/Geist/Lucide,
junto da camada que faltava: `Modal` e `ConfirmDialog` sobre `<dialog>` nativo,
`ActionsMenu` em portal, `CategoryTag`, `FileUploadButton`, os campos
(`Field`, `TextInput`, `TextArea`, `SelectInput`) e as abas. O `Tooltip` deixou
de ser desenhado dentro da caixa que rola. Domínio, banco, fachada API,
contratos IPC e broadcast ficaram intactos: o diff não toca `src/main`,
`src/preload` nem `src/shared`. Valores e medições novos em
[orca-theme.md](../../../apps/meu-dinheiro-app/docs/orca-theme.md); a emenda
correspondente está no design system.

Retorno à origem, que era o problema de navegação nomeado na spec: o Mês passou
a pertencer à tela que o abriu. A memória da sessão guarda uma consulta por
origem — intervalo/ordenação/página da Visão Geral, ano e aba do Histórico —,
o retorno é armado ao abrir o Mês e consumido só pela tela que o armou. Andar
de Mês em Mês não troca origem nem retorno; sem origem conhecida, e diante de
um Mês que já não existe, o retorno é a Visão Geral. A lógica pura de
restauração do Histórico e o destino do retorno têm teste próprio, ao lado do
que a issue 02 já cobria para a Visão Geral.

Conteúdo preservado: cabeçalho com contagens de quitação, anterior/próximo,
exclusão do Mês, os três indicadores com Realizado em destaque e Previsto na
legenda, abas com fração paga/recebida, busca, status, categoria, ordenação por
nome/data/valor com data crescente como padrão, 12 itens por página, todas as
colunas, os indicadores de observação e comprovante, os seis diálogos e as duas
confirmações.

Validação no Electron real, perfil isolado, base semeada com 21 meses em dois
anos, 9 categorias mais "Sem categoria", 2 contas (uma com saldo de R$ 35 para
exercitar a recusa) e um mês corrente com 18 despesas e 14 entradas — pagas,
pendentes, vencidas, valor variável, observações e comprovante em disco.
Relatórios em [evidence/03](../evidence/03/).

- Retorno: ida pela página 2 de "Tudo" ordenada por Entradas, com rolagem,
  troca para o Mês anterior e volta com o mesmo recorte, a mesma ordenação, a
  mesma página e a mesma rolagem; ida pelo Histórico em 2025 e volta com o ano
  e a aba; chegar pela lateral respondendo o padrão nas duas telas; Mês aberto
  direto e Mês inexistente oferecendo a Visão Geral.
  [return.json](../evidence/03/return.json).
- Operações: desfazer pagamento creditando a conta, apagando o comprovante do
  banco e do disco, com a confirmação declarando a consequência; recusa por
  saldo insuficiente preservando conta e observação digitadas; pagamento
  debitando a conta escolhida; dois cliques colados no confirmar debitando uma
  vez só; desfazer recebimento debitando e preservando o vínculo da conta;
  recebimento sugerindo a conta prevista e creditando; exclusão pelo menu de
  ações. [operations.json](../evidence/03/operations.json).
- Formulários: recusa de nome vazio com mensagem no campo e `aria-invalid`,
  criação gravada, edição para Valor variável preservando a observação,
  comprovante anexado e gravado em disco, detalhe com valor, categoria,
  vencimento, status, data de quitação, comprovante e observação, exclusão do
  Mês levando 19 despesas e 14 entradas e voltando à origem.
  [forms.json](../evidence/03/forms.json).
- Teclado e foco: ordem de tabulação da lateral até a tabela, setas trocando de
  aba com o painel acompanhando, Enter na linha abrindo o detalhe, foco preso
  no diálogo, Escape devolvendo o foco à linha, menu de ações operado por
  seta/Escape com o foco de volta no gatilho, ação da linha abrindo um diálogo
  só. [keyboard.json](../evidence/03/keyboard.json).
- Matriz de 8 combinações (claro/escuro × 960 × 640/1280 × 800 × lateral
  aberta/recolhida): nenhuma célula ou cabeçalho cortado, filtros em uma linha,
  abas e ação na mesma linha, 12 linhas por página, diálogo de 560px cabendo na
  janela mínima com rodapé visível e corpo rolando.
  [matrix.json](../evidence/03/matrix.json),
  [clara 1280](../evidence/03/light-1280-aberta-mes.png),
  [escura 1280](../evidence/03/dark-1280-aberta-mes.png),
  [pagamento claro 960](../evidence/03/light-960-pagar.png).
- Estados: carregamento com 16 esqueletos e a tela já na altura final
  (766px contra 731px prontos), falha de leitura real — a tabela de despesas
  renomeada por baixo do app — como `role="alert"` com as três saídas e a
  lateral alcançável, recuperação pelo "Tentar novamente", gravação recarregando
  sem piscar esqueleto (zero aparições), Mês sem item nenhum sem barra de
  filtros, filtro sem resultado com "Limpar filtros".
  [states.json](../evidence/03/states.json),
  [carregando](../evidence/03/carregando-mes.png),
  [erro](../evidence/03/erro-mes.png),
  [vazio inicial](../evidence/03/vazio-inicial-mes.png).
- Contraste medido nas superfícies reais em execução: menor par de texto 5,27:1
  (valor no resumo do diálogo) e menor marca 3,19:1 (borda do campo de busca
  sobre o fundo da faixa). Tabela completa em orca-theme.md.
  [contrast.json](../evidence/03/contrast.json).
- `npm run typecheck`, `npm run lint`, `npm test` e
  `npm run build -w meu-dinheiro-app` aprovados.

Decisões que saíram do caminho óbvio e ficam registradas:

- **Dois bugs encontrados na validação, e corrigidos aqui.** O primeiro: o
  ponto de Previsto do gráfico do Histórico era o único jeito de abrir um Mês
  por ali, e o `activeDot` default do Recharts o cobria no instante em que o
  ponteiro chegava — o clique acertava um círculo sem `onClick` e nada
  acontecia. O ponto ativo passou a ser o mesmo desenho do ponto parado. Sem
  isso o critério de verificar o retorno desde as duas telas não teria como
  passar. O segundo: pagar ou receber limpava o formulário antes de saber se a
  operação foi gravada, e uma recusa por saldo insuficiente devolvia o diálogo
  em branco; agora o formulário só se limpa quando gravou.
- **Os dois `Select` do MUI dentro de um `Modal` em Configurações trocaram para
  o seletor local, antes da issue 05.** O `<dialog>` nativo ocupa a camada de
  topo do navegador, e a lista do `Select` do MUI é desenhada em portal no
  `body`: ela apareceria atrás do diálogo. Não era escolha de escopo, era a
  única forma de não quebrar aquela tela. O resto daqueles formulários continua
  MUI.
- **A dica de linha em portal encerra a pendência anotada na issue 02.** O
  `title` nativo saiu; a bolha é desenhada com posição fixa e o texto que ela
  carrega vai no marcador de status pelo `description`, de modo que o leitor de
  tela o alcance sem depender de hover. A Visão Geral herdou a mesma dica.
- **Desmarcar pagamento/recebimento deixou o âmbar.** O botão é o primário
  neutro: o registro continua lá, e pela §1.5 a cor de alarme fica com quem
  apaga. A confirmação ganhou a consequência que faltava — comprovante
  removido, quando há um.
- **Borda de campo ganhou token próprio a 3:1.** Dentro do diálogo o campo tem
  exatamente o fundo do papel, e a borda decorativa de 1,2:1 era o único sinal
  de onde se digita.
- **Nome de item e de categoria reticenciam.** Sem teto, um nome longo empurrava
  a coluna de ações para fora da faixa e fazia a tabela inteira rolar por causa
  de uma linha.

Limitações: a 960 × 640 a tabela do Mês rola na horizontal — são seis colunas
contra ~688px de faixa com a lateral aberta, e encolher mais esconderia
informação, o que a spec não permite; nada fica cortado, e o Tab leva o foco
para a coluna de ações rolando-a à vista. O viewport de 960 × 640 foi aplicado
por DevTools do Electron, como nas issues 01 e 02, porque o gerenciador de
janelas impõe um mínimo maior; 1280 × 800 foi aplicado à janela. Execução com
`--no-sandbox` pelo helper SUID do ambiente. A abertura do comprovante no
programa externo não foi disparada para não lançar um aplicativo do sistema
neste ambiente: o caminho (`api.openReceipt` → `shell.openPath`) não foi tocado,
e o botão foi conferido no detalhe. O Histórico continua MUI no resto e ainda
não tem caminho de teclado para abrir um Mês pelo gráfico — a issue 04 o
migra, e é ela que traz a alternativa em tabela.

Revisão em dois agentes conforme `code-review`, base
`da8ff29fea428437361117b26f4892944ee1896c`:

- Standards: cinco achados, todos corrigidos. (1) `ConfirmDialog` usava ids
  literais, e a tela do Mês monta cinco confirmações ao mesmo tempo — o nome
  acessível de qualquer uma delas resolvia para a primeira do documento;
  agora são `useId`, e o `Modal`, que não tinha nome nenhum, passou a apontar
  para o próprio título. (2) O anexo era um `<label>` dentro de outro, e clicar
  em "Comprovante" abria o seletor de arquivo; entrou o `FieldGroup`, que
  nomeia por `aria-labelledby`. (3) O `.money-select` tinha 6 × 8 onde o
  documento fixa 8 × 10. (4) As abas faltavam no vocabulário do design system.
  (5) `overlay.ts` foi para `utils/`, que é onde o README põe módulo puro, e o
  `DetailField` ganhou arquivo próprio em vez de sair de dentro do diálogo de
  despesa. Dos smells, foram acatados o `SettledChip` (o marcador de quitado
  era o mesmo em duas colunas), o `BankAccountField` (a conta com saldo estava
  em quatro diálogos), a remoção de `.money-input-search` sem consumidor, e o
  fechamento da dica e do menu na rolagem — os dois são medidos contra a janela,
  e a faixa deslizava por baixo deles.
- Spec: um requisito parcial e três apontamentos. O teste que faltava era o do
  próprio guarda do retorno, e ele virou `contexts/pendingReturn.ts` com
  `returnFor` testado, mais `staysInMonthVisit` em `routes.ts`. O apontamento
  que importava era um defeito de verdade: o retorno só era descartado pela
  tela que o consumia, então sair de um Mês aberto pelo Histórico e clicar
  "Visão Geral" na lateral deixava o retorno armado — a próxima chegada ao
  Histórico restaurava ano, aba e rolagem de uma pergunta já abandonada. Agora
  a visita ao Mês é que delimita o retorno: quem a encerra é a navegação, no
  provider, e não cada link. A perda do ponto de cor nos dois seletores nativos
  ficou registrada aqui e no design system. A antecipação do `activeDot` e dos
  dois `Select` de Configurações foi avaliada e mantida, com o registro acima.

Verificações depois da revisão, no Electron: sair do Mês pela lateral leva o
Histórico de volta a 2026 (o padrão) enquanto voltar pelo botão continua
restaurando 2025; o diálogo se anuncia pelo título, o grupo do anexo pelo seu
rótulo, zero rótulos aninhados e zero ids repetidos com nove diálogos no DOM; a
nota do campo descreve em vez de nomear; rolar a faixa fecha o menu e some com
a dica. [recheck.json](../evidence/03/recheck.json),
[scrollclose.json](../evidence/03/scrollclose.json). As baterias de retorno,
operações, formulários, teclado, matriz, estados e contraste foram repetidas
sobre o build corrigido.

## Answer

Detalhe de Mês migrado para a base Orca com todos os números, colunas, filtros,
diálogos e operações preservados; o Mês voltou a pertencer à tela que o abriu,
nas duas origens, e a validação no Electron cobriu operações financeiras,
comprovantes, teclado, estados e contraste nos dois temas e nos dois tamanhos.
Issue 04 desbloqueada.
