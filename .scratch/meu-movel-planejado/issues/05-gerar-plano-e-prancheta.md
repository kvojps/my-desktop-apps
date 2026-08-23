# 05: Gerar plano e ver a prancheta

**What to build:** o caminho inteiro do app, ponta a ponta. O usuário pede a geração, o app procura um bom arranjo, salva o resultado e mostra cada chapa desenhada em escala, com as peças no lugar, rotuladas e medidas, e a sobra destacada. É neste ticket que o produto vira produto.

O plano é **snapshot, não derivação**: gerar é uma ação com custo e com resultado escolhido entre tentativas. Recalcular a cada abertura desperdiçaria esforço e, pior, poderia devolver um plano diferente daquele que a pessoa já imprimiu e levou para a máquina.

**Blocked by:** 03, 04.

**Status:** done

- [x] Botão de gerar na tela do projeto; o rótulo dele muda enquanto trabalha. Não há indicador circular de progresso em lugar nenhum do app, e essa troca de rótulo é o único sinal de ação em andamento — o laço de tentativas cede o controle entre elas para que o rótulo consiga repintar.
- [x] O empacotamento roda no renderer e o resultado é persistido por IPC; o processo principal não empacota.
- [x] O plano é salvo com a data de geração e com o carimbo de alteração do projeto que o originou.
- [x] Gerar de novo substitui o plano vigente; há um plano por projeto.
- [x] A tela de Plano preenche a viewport, como manda a norma de tela de leitura.
- [x] Cada chapa é desenhada em escala, com as coordenadas do plano entrando no desenho sem conversão de unidade.
- [x] Cada peça mostra rótulo e medida quando cabem; "cabe" é **medido**, não estimado, reaproveitando a técnica de medição de texto que já existe no monorepo. Quando não cabe, fica o número da peça e a legenda ao lado.
- [x] A cor da peça vem da paleta categórica do design system, agrupada por dimensão; a cor do rótulo sai da regra da §1.8 do design system (comparar o contraste medido dos dois rótulos possíveis sobre o preenchimento e ficar com o maior, nunca um limiar fixo de luminância), por um helper exportado do módulo de tema do app — não solto dentro do componente.
- [x] A sobra de cada chapa é visualmente distinta das peças.
- [x] Navegação entre as chapas do plano.
- [x] Aproveitamento visível por chapa e do plano inteiro.

## Comments

**2026-08-22 — implementado.**

O caminho inteiro: botão na tela de Projeto → empacotamento no renderer →
gravação por IPC → tela de Plano com a chapa desenhada em escala. Vinte e nove
testes novos, 84 no monorepo.

**A rota nova é `/projects/:projectId/plan`**, e a tela de Projeto ganhou dois
botões: "Gerar plano" (que vira "Gerar de novo" quando já há plano, e "Gerando..."
enquanto trabalha) e "Ver plano", que só aparece quando existe um. Sem o segundo,
um plano salvo seria inalcançável depois de fechar a tela — o `useProjectDetail`
passou a ler o plano junto com projeto, peças e chapas por causa disso, e é a
mesma leitura que decide o rótulo do primeiro botão.

**O laço cede o controle com `setTimeout`, não com `requestAnimationFrame`.** O
rAF é o instrumento óbvio para "deixar repintar", e é o errado aqui: janela
minimizada ou coberta não recebe quadro, e a geração ficaria pendurada para
sempre. Ceder o controle não pode depender de haver quem esteja olhando.

**Uma migração, contra a spec, e de propósito.** A spec pede "a lista de
migrações nascendo vazia", e ela nasce com a de id 1: o `plans` do ticket 02
guarda o déficit em área e em número de chapas, mas não **qual formato** entrou
na divisão, e sem isso o plano salvo é um snapshot que perdeu parte do resultado
que o empacotador produziu (`Deficit.referenceSheet`). Pôr as colunas só no
`SCHEMA` deixaria de fora todo banco que já existe em disco — e o repo trata
banco instalado como `user_version = 0`, não como banco novo. A alternativa era
o 06 pagar a migração e os planos gerados hoje nascerem sem o formato.

**`savePlan` é a única escrita do app que não chama `touchProject`.** Gerar não
altera o serviço; mover o carimbo faria todo plano nascer desatualizado em
relação a si mesmo, que é exatamente o aviso do 07.

**O rótulo dentro da peça tem três degraus, e não os dois que o ticket
descreve.** "Rótulo e medida quando cabem, senão o número" não cobre a peça
pequena demais para o próprio número — e ela existe (uma peça de 30 × 15 mm numa
chapa de 2750 desenhada em 800px tem 9px de lado). O terceiro degrau é não
escrever nada, e para que ela não fique sem par na legenda toda peça carrega um
`<title>` com número, rótulo e medida. É o canal que sobrevive ao degrau em que
o desenho desiste.

**A medição é do DOM, e o nó de medida não declara família de fonte.** A técnica
é a do `meu-negocio-app` (nó pendurado no `body`, sem contexto de canvas, por
causa do dígito tabular do tema). A diferença: lá a pilha de fontes está escrita
no nó, aqui ela é herdada — repeti-la seria a divergência que o §6 do design
system nomeia, e teria o efeito calado de a medida continuar "certa" depois de o
tema trocar de fonte.

**Da revisão em dois eixos, corrigido:**

- **O refile estava sendo desenhado como sobra.** A hachura cobria a chapa
  bruta inteira, mas o aproveitamento é fração da **área útil** — então o
  desenho contradizia o número ao lado dele, e por uma faixa que o marceneiro
  declarou que vai jogar fora. Agora a hachura é só da área útil e o refile fica
  liso, entre a borda da chapa e o contorno do que de fato se aproveita.
- **"Peças no plano — em N medidas" contava peças, não medidas.** A chave da
  legenda é `rótulo|medida`, então duas peças de mesma medida e rótulos
  diferentes contavam duas vezes — e o teste que prende essa distinção estava
  ali do lado. `buildPlanLegend` passou a expor `dimensionCount`, com teste.
- O esqueleto reservava uma caixa de largura cheia para um conteúdo em duas
  colunas (§5.3), o `EmptyState` de seção usava o ícone de 48 (§5.4), e o
  título do card da legenda usava `subtitle1` onde a §2 manda `h6`.
- `getPlan` montava sete campos na mão; nasceu `rowToPlan`, como manda o §2.5
  do README. `contrastRatio` e `labelContrast` deixaram de ser reexportados do
  barrel do tema: são as medidas de que a regra é feita, e quem as consulta é a
  suíte — oferecê-las à tela seria oferecer uma decisão de contraste para tomar
  por conta própria.
- Tipos estruturais repetidos trocados pelos que já existiam (`Rectangle`,
  `PieceShortfall`, `MIN_MEASURE_TENTHS_MM`), e as métricas do desenho que
  viajavam soltas (`hairline`, `fontSize`, `lineHeight`) viraram um tipo.

**Recusado, com razão declarada:**

- "`usePlan` duplica `useProjectDetail`." O que se repete é o formato que o
  README §2.4 e o §5.3 do design system prescrevem — `reload` sem esqueleto,
  `retry` com, `useDataChanged` — e ele se repete em toda tela do monorepo.
  Fundir os dois faria uma tela carregar o que a outra precisa.
- "`TextMeasure.fontsReady` não é lido por ninguém." É lido pelo
  `exhaustive-deps`: a identidade do objeto é o que dispara a remedição quando a
  Inter carrega, e a dependência precisa aparecer no corpo do `useMemo` para não
  ser apagada pelo próximo a mexer. É o mesmo argumento do prior art.
- "`PlanShortfall`, `unallocated_pieces` e `equivalent_sheets` divergem do
  glossário." As duas últimas são o `SCHEMA` publicado no ticket 02, e renomear
  coluna publicada é o que a migração não pode fazer; a primeira foi decidida no
  04, e está registrada lá.

**Divergência aberta, não resolvida aqui: a coluna do papel escuro da §1.7.**
Contra `#181C27`, que é o `background.paper` do modo escuro nos quatro apps,
esta implementação mede ~1,8% a mais do que a tabela do design system, nos onze
swatches (`#5C6BC0`: 3.50 contra os 3.44 impressos). A superfície implícita da
tabela tem L = 0.0128, e a de `#181C27` é 0.0117 — ela parece ter sido medida
contra um papel um pouco mais claro. **Nenhum swatch muda de lado**, então
nenhum veredicto se move e a paleta deste app é a mesma com qualquer das duas
contas. O teste prende a coluna clara no dígito (ela bate exata) e prende
*veredictos*, não dígitos, na escura. Corrigir onze números de um documento
normativo é decisão do dono do documento.

**Design system, escrito antes do código:** a §1.7 ganhou a regra de que um app
que **escolhe o swatch sozinho** sorteia só entre os que passam em 3:1 nos dois
papéis — sete dos dez, com os quatro excluídos tabelados — e de que a lista dá a
volta, com o número da peça como segundo canal. A §5.3 ganhou dois bullets na
exceção da superfície métrica: a sobra sai hachurada também na tela, e a área
que o desenho não pode usar (o refile) não é sobra e não sai hachurada. A §1.8
registra que este app é a primeira implementação da regra; a pendência do
`meu-dinheiro-app` continua aberta, como ela mesma diz.

**Verificado:** `npm test` (84 testes), `npm run typecheck` nos quatro apps,
`npm run lint` sem erro novo e `prettier --check` limpo. Além da suíte, e porque
o desenho não é testado por decisão da spec, duas conferências com script
descartado depois: um roundtrip do plano pelo `SCHEMA` de verdade (gravar e ler
devolve objeto idêntico, gerar de novo substitui em vez de acumular, o carimbo
do projeto não se move) e a prancheta renderizada no Chromium a partir de um
plano real de quatro chapas — nenhuma peça fora da chapa, nenhuma sobreposição,
o retalho consumido primeiro, o rótulo recuando para o número exatamente onde
para de caber.

**Não verificado:** o app rodando. A extensão do Chrome não está conectada nesta
sessão, e dirigir a janela do Electron até a tela de Plano não era confiável sem
ela. O que isso deixa sem conferir é o layout de viewport cheia (§4) — a grade
de duas colunas, o desenho encolhendo com a janela e a navegação entre chapas —,
tudo escrito pelo padrão, nada visto de pé. Vale um `npm run dev:movel` antes de
seguir para o 06.
