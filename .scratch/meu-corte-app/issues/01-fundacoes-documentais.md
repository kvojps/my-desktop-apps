# 01: Fundações documentais — design system e glossário

**What to build:** as decisões que o app novo exige, escritas antes de existir código. O design system é normativo e determina que o que não está nele está indefinido, e que a decisão se escreve lá primeiro. O app abre três lacunas, e nenhuma delas tem norma hoje. Junto, o glossário do app: o vocabulário precisa estar fixado antes de virar nome de tabela, de tipo e de rótulo de tela.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] O design system ganha a norma de **superfície métrica em escala**: altura derivada da proporção do desenho é exceção nomeada à regra de que altura de gráfico nunca deriva do conteúdo, restrita a desenho métrico, dentro de uma caixa cuja largura é a da seção. A regra original continua valendo para gráfico.
- [ ] O design system ganha a norma de **impressão**: uma chapa por página, quebra de página, sem cor de fundo, sobra em hachura, cabeçalho por página. Não existe hoje uma linha sobre impressão no documento nem em nenhum app.
- [ ] O design system ganha a norma de **rótulo sobre preenchimento colorido**: a cor do rótulo é decidida por luminância do preenchimento. A proibição de âmbar e de texto desabilitado como texto continua valendo, sem exceção.
- [ ] O design system registra a **pendência aberta** contra o Meu Dinheiro, onde a escolha por luminância vive solta dentro de um formulário de categoria em vez de no módulo de tema. Registrar, não corrigir: o Meu Dinheiro está fora do escopo desta feature.
- [ ] O app novo ganha seu `CONTEXT.md`, definindo pelo menos: projeto de corte, peça, chapa, plano de corte, chapa planejada, colocação, peça não alocada, peça rejeitada, aproveitamento, sobra, kerf, refile, déficit e chapa equivalente.
- [ ] O glossário fixa explicitamente **peça não alocada ≠ peça rejeitada**: a primeira caberia e o estoque acabou, e resolve-se comprando chapa; a segunda é maior que qualquer chapa do projeto, e comprar mais chapas não resolve. Confundi-las faria o app recomendar uma compra inútil.
- [ ] O glossário fixa **sobra ≠ retalho**: em nesting livre a sobra é região poligonal, não retângulo, e esta versão mede sobra como percentual sem prometer reaproveitamento.
- [ ] O mapa de contextos da raiz passa a apontar para o glossário do app novo.
- [ ] Nenhum código de aplicação é alterado neste ticket.
