# 05: Gerar plano e ver a prancheta

**What to build:** o caminho inteiro do app, ponta a ponta. O usuário pede a geração, o app procura um bom arranjo, salva o resultado e mostra cada chapa desenhada em escala, com as peças no lugar, rotuladas e medidas, e a sobra destacada. É neste ticket que o produto vira produto.

O plano é **snapshot, não derivação**: gerar é uma ação com custo e com resultado escolhido entre tentativas. Recalcular a cada abertura desperdiçaria esforço e, pior, poderia devolver um plano diferente daquele que a pessoa já imprimiu e levou para a máquina.

**Blocked by:** 03, 04.

**Status:** ready-for-agent

- [ ] Botão de gerar na tela do projeto; o rótulo dele muda enquanto trabalha. Não há indicador circular de progresso em lugar nenhum do app, e essa troca de rótulo é o único sinal de ação em andamento — o laço de tentativas cede o controle entre elas para que o rótulo consiga repintar.
- [ ] O empacotamento roda no renderer e o resultado é persistido por IPC; o processo principal não empacota.
- [ ] O plano é salvo com a data de geração e com o carimbo de alteração do projeto que o originou.
- [ ] Gerar de novo substitui o plano vigente; há um plano por projeto.
- [ ] A tela de Plano preenche a viewport, como manda a norma de tela de leitura.
- [ ] Cada chapa é desenhada em escala, com as coordenadas do plano entrando no desenho sem conversão de unidade.
- [ ] Cada peça mostra rótulo e medida quando cabem; "cabe" é **medido**, não estimado, reaproveitando a técnica de medição de texto que já existe no monorepo. Quando não cabe, fica o número da peça e a legenda ao lado.
- [ ] A cor da peça vem da paleta categórica do design system, agrupada por dimensão; a cor do rótulo sai da regra da §1.8 do design system (comparar o contraste medido dos dois rótulos possíveis sobre o preenchimento e ficar com o maior, nunca um limiar fixo de luminância), por um helper exportado do módulo de tema do app — não solto dentro do componente.
- [ ] A sobra de cada chapa é visualmente distinta das peças.
- [ ] Navegação entre as chapas do plano.
- [ ] Aproveitamento visível por chapa e do plano inteiro.
