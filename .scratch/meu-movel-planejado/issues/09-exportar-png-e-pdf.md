# 09: Exportar PNG e PDF

**What to build:** o plano como arquivo. O PNG existe porque o combinado com o ajudante acontece pelo celular; o PDF existe porque o plano costuma ser arquivado junto com o orçamento do serviço. O usuário escolhe onde salvar, para organizar por cliente do jeito dele.

**Blocked by:** 08 (o PDF reaproveita o mesmo layout de impressão).

**Status:** done

- [x] Exportar o plano como PNG.
- [x] Exportar o plano como PDF, com o mesmo layout da impressão — resumo primeiro, uma chapa por página.
- [x] O diálogo de salvar é modal da janela, nunca solto.
- [x] Cancelar o diálogo devolve um resultado de cancelamento, não uma exceção — é o padrão de exportação que já existe no monorepo.
- [x] A gravação do arquivo acontece no processo principal; o renderer apenas invoca.
- [x] O nome de arquivo sugerido identifica o projeto e a data.
- [x] Falha de escrita chega ao usuário como mensagem legível, com código de erro preservado através do IPC.

## Comments

**2026-08-24 — implementado.**

**O PDF não é uma segunda montagem do plano: é a janela impressa para
arquivo.** `printToPDF` com `preferCSSPageSize` renderiza a mesma mídia de
impressão que o botão de imprimir já usava, de modo que o resumo primeiro e uma
chapa por página saem por construção, e não por uma segunda implementação do
layout que poderia divergir da folha. O `@page` do renderer continua sendo a
única declaração do tamanho da folha — conferido no arquivo gerado:
`MediaBox 841,92 × 594,96 pt`, A4 deitada.

**O PNG, esse, precisou de documento próprio, e ele é a folha sem paginação.**
Um arquivo de imagem não vira página, então a ordem da §5.6 vira uma coluna que
se rola: identificação, lista de peças, uma chapa depois da outra. O documento
fica montado ao lado da tela e escondido dela, como o de papel e pela mesma
razão — o que se exporta é o desenho que está à vista, e montá-lo no clique
criaria um desenho feito depois, capaz de divergir do que o usuário conferiu.
A rasterização é do renderer (SVG serializado, `data:` URL, canvas em 2×) e a
gravação é do main.

**A imagem segue a norma do papel, e não a da tela.** Foi a decisão que o
ticket não pedia e que decide o resto: o arquivo sai do app, quem o recebe não
tem o app aberto ao lado, e ele pode acabar impresso na oficina. Exportar no
modo escuro mandaria cinza sobre cinza para quem vai cortar. O design system
ganhou o parágrafo que escreve isso na §5.6 — a decisão é normativa, não uma
escolha deste componente.

**O desenho de fora da tela virou um componente só (`SheetPlate`).** A folha e
a imagem desenham a mesma chapa, e a alternativa era um terceiro desenho ao
lado dos dois que já existiam. Sobrou de fora só o que é de cada meio: a caixa
em que a chapa cabe e o id do ladrilho da hachura, que passou a entrar por
parâmetro — os dois documentos convivem no mesmo `body`, um id repetido faria
as duas hachuras virarem a mesma, e o nome que o `useId` gera não atravessa a
serialização do SVG.

**A imagem carrega o plano inteiro, o que falta comprar inclusive.** A primeira
versão parava na lista de peças e resumia o resto numa linha, com o argumento de
que a imagem é a cópia da bancada. A revisão derrubou o argumento: PNG e PDF são
dois formatos do **mesmo** plano, e um deles dizendo menos que o outro sobre o
mesmo serviço é uma diferença que ninguém pediu. As duas listas do glossário
continuam separadas ali como no papel — não alocada e rejeitada —, com a redação
que já existe no `shortfallCopy`, e não uma segunda redação da mesma distinção.

**A linha de texto não escapa mais pela margem.** O quadro da imagem não rola
para o lado: o que passa da margem é cortado pela borda do arquivo, sem aviso, e
o `text-overflow` do papel não existe dentro de um `<text>` de SVG. O que
identifica — nome do projeto, legenda da chapa — é encurtado com reticências; a
frase de uma seção quebra em quantas linhas precisar, porque cortar "comprar
mais chapas não resolveria" no meio entrega ao leitor o contrário do que a frase
diz. As duas regras são medidas, e não estimadas por contagem de caracteres,
como já era a regra do rótulo dentro da peça.

**O nome sugerido é lido do banco, no main.** O renderer manda o id do projeto e
mais nada: quem exporta escolhe o formato e a pasta, não a identidade do
arquivo. O carimbo é o dia **local** da geração — um plano gerado às 21h no
Brasil já é do dia seguinte em UTC, e quem procura o arquivo procura pelo dia em
que trabalhou.

**Falha de montagem do PDF ganhou código próprio.** Ela não é falha de
gravação: a pasta já foi escolhida e nada foi escrito ainda. Reaproveitar
`export-failed` mandaria o usuário conferir espaço em disco por um problema que
é da janela — a mesma razão pela qual o ticket 08 criou `print-failed` em vez de
deixar a impressora chegar à tela como "falha ao ler os dados locais".

Vinte e cinco testes novos (144 no monorepo), nos dois módulos puros que a
exportação abriu: o nome do arquivo e a régua da imagem, esta com as duas regras
de texto. O que não é puro — a rasterização e o `printToPDF` — foi conferido num
Electron sem janela: o PNG sai com a hachura e o rótulo desenhados e o canvas
não é contaminado pela `data:` URL, e o PDF sai em A4 deitada
(`MediaBox 841,92 × 594,96 pt`).
