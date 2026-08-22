# 01: Fundações documentais — design system e glossário

**What to build:** as decisões que o app novo exige, escritas antes de existir código. O design system é normativo e determina que o que não está nele está indefinido, e que a decisão se escreve lá primeiro. O app abre três lacunas, e nenhuma delas tem norma hoje. Junto, o glossário do app: o vocabulário precisa estar fixado antes de virar nome de tabela, de tipo e de rótulo de tela.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] O design system ganha a norma de **superfície métrica em escala**: altura derivada da proporção do desenho é exceção nomeada à regra de que altura de gráfico nunca deriva do conteúdo, restrita a desenho métrico, dentro de uma caixa cuja largura é a da seção. A regra original continua valendo para gráfico.
- [x] O design system ganha a norma de **impressão**: uma chapa por página, quebra de página, sem cor de fundo, sobra em hachura, cabeçalho por página. Não existe hoje uma linha sobre impressão no documento nem em nenhum app.
- [x] O design system ganha a norma de **rótulo sobre preenchimento colorido**: a cor do rótulo é decidida por luminância do preenchimento. A proibição de âmbar e de texto desabilitado como texto continua valendo, sem exceção.
- [x] O design system registra a **pendência aberta** contra o Meu Dinheiro, onde a escolha por luminância vive solta dentro de um formulário de categoria em vez de no módulo de tema. Registrar, não corrigir: o Meu Dinheiro está fora do escopo desta feature.
- [x] O app novo ganha seu `CONTEXT.md`, definindo pelo menos: projeto de corte, peça, chapa, plano de corte, chapa planejada, colocação, peça não alocada, peça rejeitada, aproveitamento, sobra, kerf, refile, déficit e chapa equivalente.
- [x] O glossário fixa explicitamente **peça não alocada ≠ peça rejeitada**: a primeira caberia e o estoque acabou, e resolve-se comprando chapa; a segunda é maior que qualquer chapa do projeto, e comprar mais chapas não resolve. Confundi-las faria o app recomendar uma compra inútil.
- [x] O glossário fixa **sobra ≠ retalho**: em nesting livre a sobra é região poligonal, não retângulo, e esta versão mede sobra como percentual sem prometer reaproveitamento.
- [x] O mapa de contextos da raiz passa a apontar para o glossário do app novo.
- [x] Nenhum código de aplicação é alterado neste ticket.

## Comments

**2026-08-22 — implementado.**

- `docs/design-system.md` ganhou três normas, todas por acréscimo, sem
  renumerar seção existente: §1.8 (rótulo sobre preenchimento colorido), a
  exceção nomeada "superfície métrica em escala" no fim da §5.3, ao lado da
  regra que ela excetua, e §5.6 (impressão). A §5.3 e a abertura da §5 ganharam
  o ponteiro para cada uma.
- A §1.8 mede em vez de fixar limiar. O limiar de luminância — que é a
  implementação óbvia — reprova, porque o preto do app é 87% opaco e compõe com
  o preenchimento: o ponto de virada anda com a matiz. `#B85C38` é o
  contraexemplo medido. Com a regra do maior contraste, a paleta categórica
  inteira passa em AA como base de rótulo (pior caso 4.54:1).
- A pendência contra o `meu-dinheiro-app` está registrada na §1.8, no mesmo
  formato da que já existia na §2.1. Ela tem duas partes, e a mais grave não é a
  de lugar: o limiar de `0.4` do `CategoryForm` devolve branco para os dez
  swatches, e `#FB8C00` (2.37:1) e `#00ACC1` (2.74:1) não passam nem no 3:1 de
  objeto gráfico que o check exige. Nada foi corrigido — o app está fora do
  escopo desta feature.
- `apps/meu-movel-planejado/CONTEXT.md` criado com 22 termos, agrupados em
  projeto / geometria / plano / falta de material. Os três pares que a spec
  mandava separar estão fixados: chapa vs. chapa planejada, não alocada vs.
  rejeitada, sobra vs. retalho.
- `CONTEXT-MAP.md` **não existia** na raiz, embora o `CLAUDE.md` e o
  `docs/agents/domain.md` já o descrevessem. Foi criado agora, apontando para os
  três glossários existentes e registrando que o `meu-dinheiro-app` ainda não
  tem o seu — o que é o estado normal, já que glossário se escreve sob demanda.
- Nenhum código de aplicação foi tocado.

**2026-08-22 — depois da revisão em dois eixos.** O que mudou:

- A §1.8 dizia "nenhuma constante consegue o mesmo", e era overclaim: para estas
  onze amostras qualquer limiar entre `0.1813` e `0.1984` reproduz a escolha da
  comparação. O argumento verdadeiro é outro, e foi medido numa varredura do cubo
  sRGB: as janelas se sobrepõem (`#787882`, `L = 0.1904`, prefere branco;
  `#F00019`, `L = 0.1860`, prefere preto), então nenhuma constante serve **em
  geral** — mas as inversões moram na virada, onde os dois rótulos medem quase o
  mesmo, e o custo real da constante é ter de ser recalibrada por paleta. A seção
  agora diz isso, com a ressalva escrita.
- A norma de impressão dava **escolha** onde o ticket pedia regra: "hachura, traço
  ou rótulo" virou "sai hachurada", com traço e rótulo somando-se a ela, nunca
  substituindo-a. Entrou junto a ordenação de página que o ticket 08 precisaria
  inventar: página que não é unidade vem antes de todas elas.
- `Área útil` era ambígua por um kerf: agora é a chapa menos o refile, e o
  retângulo inflado do empacotador está nomeado como artifício de cálculo.
  `Aproveitamento` declara sua base. `Peça rejeitada` deixou de dizer só "barrada
  no cadastro" — o plano também a classifica, porque a chapa que a comportava pode
  ter sido excluída depois.
- Glossário aproximado do `CONTEXT-FORMAT.md`: cabeçalho de um parágrafo,
  definições em até duas frases, `Gerar` virou `Geração` (o formato pede o que a
  coisa **é**), e os `_Avoid_` recíprocos entre dois termos definidos saíram — a
  distinção já está no corpo, que é onde o ticket a queria.
- O ticket 05 mandava decidir a cor do rótulo "por luminância do preenchimento",
  que é justamente a formulação que a §1.8 rejeita. A linha dele agora aponta para
  a §1.8. O `spec.md` carrega a mesma abreviação em "Desenho"; ficou como está,
  porque o design system é a fonte normativa e é ele que o implementador segue.
- `docs/agents/domain.md` dizia que os glossários existem "em `git-dlog` e
  `meu-negocio-app`" — esta feature tornou a linha falsa, e ela foi atualizada.

Duas observações da revisão foram **recusadas**, com razão declarada:

- "Décimo de milímetro não é termo de domínio, é convenção de persistência." O
  `CONTEXT-FORMAT.md` exclui **conceito geral de programação**, e unidade de
  medida não é isso: é escolha de precisão deste domínio, e é ela que vai nomear
  campo e tipo no ticket 02. Fica.
- "A pendência registra um defeito além do que o ticket pediu." O ticket manda
  registrar a divergência; medi-la revelou que o problema de contraste é mais
  grave que o problema de lugar. Registrar só o menor seria registrar errado.
