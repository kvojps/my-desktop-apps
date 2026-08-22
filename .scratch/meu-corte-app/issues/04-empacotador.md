# 04: Empacotador e sua suíte de testes

**What to build:** o coração do app, como função pura, e o único seam de teste da feature. Ela recebe peças, chapas, kerf e refile e devolve o **resultado completo** que o usuário vai ver: onde cada peça cai em cada chapa, quanto se aproveitou, o que não coube, o que foi rejeitado, quanto material falta em metro quadrado e quantas chapas isso representa.

O déficit sai de dentro dela de propósito. Calculá-lo depois criaria um segundo seam justamente sobre a conta que originou o pedido do usuário — quanto material falta comprar.

Este ticket não tem interface. Ele é verificável sozinho pela suíte de testes.

**Blocked by:** 02 (o módulo mora no `shared` do app novo).

**Status:** ready-for-agent

- [ ] A função é pura: sem React, sem Electron, sem banco, sem relógio, sem aleatoriedade.
- [ ] Devolve colocações por chapa, aproveitamento por chapa e do plano, peças não alocadas, peças rejeitadas, déficit em metro quadrado e equivalência em número de chapas.
- [ ] Peças podem ser giradas em 90°.
- [ ] O kerf produz folga entre peças vizinhas **e** entre peça e borda útil, sem tratar a borda como caso especial: a peça ocupa suas medidas acrescidas de um kerf e a área útil da chapa é acrescida de um kerf depois de descontado o refile dos dois lados.
- [ ] Chapas menores são consumidas antes das maiores, para que a chapa inteira sobreviva ao serviço.
- [ ] Melhor de N tentativas, combinando ordenações das peças e critérios de encaixe, escolhendo por menos chapas usadas e desempatando por maior aproveitamento.
- [ ] Determinístico: a mesma entrada devolve sempre o mesmo resultado.
- [ ] A equivalência em chapas é assumida como **limite inferior**, porque a conta por área ignora encaixe.
- [ ] Testes cobrindo: ladrilhamento exato com kerf zero; o mesmo conjunto com kerf realista precisando de uma chapa a mais; peça do tamanho exato da chapa não cabendo quando há kerf; refile reduzindo a área útil na medida declarada; rotação usada quando é a única saída; chapas menores consumidas primeiro; estoque insuficiente com as peças certas de fora e déficit correspondente; peça maior que qualquer chapa rejeitada e fora do déficit; determinismo entre duas execuções; entrada vazia e projeto sem chapas.
- [ ] Os testes verificam comportamento observável — quantas chapas, o que ficou de fora, quanto falta — e não a mecânica interna: trocar a heurística não deve quebrar nenhum teste.
- [ ] `npm test` verde.
