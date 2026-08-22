# Kerf como deslocamento único, com a área de empacotamento diminuída de um kerf

O kerf é folga entre peças vizinhas **e** entre peça e borda útil (`CONTEXT.md`),
e a spec da feature pedia que a borda não fosse caso especial no código.
Decidimos deslocar tudo uma vez: cada peça ocupa uma célula de
`(comprimento + kerf) × (largura + kerf)`, as células são empacotadas num
retângulo de `(área útil − kerf)` em cada eixo, e a origem real da peça é a
origem da célula somada de um kerf.

Com isso, entre duas células encostadas sobram exatamente um kerf entre as peças
reais; e a peça mais externa fica um kerf afastada da borda útil nos quatro
lados. Nenhuma comparação no código distingue borda de vizinha.

## Por que "diminuída" e não "acrescida"

A spec (`.scratch/meu-movel-planejado/spec.md`) e o ticket 04 escrevem que "a
área útil da chapa é **acrescida** de um kerf". Essa aritmética não produz o que
os dois textos afirmam logo em seguida.

Com a área acrescida, uma peça do tamanho exato da chapa cabe — `L + kerf` numa
área de `L + kerf` —, e a peça mais externa encosta na borda com folga zero. Os
mesmos dois documentos exigem o contrário em dois lugares: a user story 17 ("o
kerf aplicado também contra a borda, para que a peça mais externa não saia com um
lado a menos") e o caso de teste "peça do tamanho exato da chapa não cabe com
kerf maior que zero". A área diminuída satisfaz os dois; a acrescida falha nos
dois. Tratamos a palavra como lapso de redação e ficamos com a geometria que os
critérios descrevem.

## Consequências

- **A peça do tamanho exato da chapa é rejeitada, não apenas não alocada**, quando
  há kerf. Ela não cabe em chapa nenhuma do projeto, e comprar mais chapas do
  mesmo formato não resolveria — que é a definição de peça rejeitada. Sem refile e
  com a fresa default, a maior peça possível numa chapa de 2750 × 1850 mm é
  2749,4 × 1849,4 mm.
- **Refile e kerf se somam contra a peça.** O retângulo em que o empacotamento roda
  é `(comprimento − 2·refile − kerf) × (largura − 2·refile − kerf)`. O
  aproveitamento, porém, continua sendo fração da **área útil** do glossário — a
  chapa menos o refile —, e não desse retângulo: o kerf é material perdido no
  corte, e escondê-lo do denominador faria o app relatar um aproveitamento que a
  chapa não entrega.
- Um kerf maior que a área útil deixa a chapa sem retângulo de empacotamento, e
  nada é colocado nela. É consistente: uma fresa mais larga que a chapa não corta
  peça nenhuma.
- **O refile também rejeita.** Uma peça pode caber na chapa bruta e não caber na
  área útil, e nesse caso ela é peça rejeitada, não peça não alocada — comprar
  outra chapa do mesmo formato não a faria caber enquanto o refile for esse. O
  verbete "Peça rejeitada" do `CONTEXT.md` foi corrigido para dizer isso: a
  comparação é contra a área útil, nunca contra a medida bruta da chapa.
