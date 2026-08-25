# O empacotamento, passo a passo

Como o plano de corte sai das peças e das chapas — o passo a passo do
empacotador. Documento de arquitetura: o que o produto **faz** está no
[README](../README.md), e o vocabulário no [CONTEXT.md](../CONTEXT.md).

Toda a geração sai de uma função pura só, `packCuttingPlan`
([`src/shared/nesting/packCuttingPlan.ts`](../src/shared/nesting/packCuttingPlan.ts)):
sem React, sem Electron, sem banco, sem relógio e sem aleatoriedade. A mesma
entrada devolve sempre o mesmo plano — inclusive o déficit, que sai de dentro
dela junto com o resto.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant T as Tela do plano
    participant P as packCuttingPlan
    participant A as packCuttingPlanAttempts
    participant E as expandSheets
    participant C as classifyPieces
    participant B as buildPlan
    participant F as fillSheet
    participant M as maxRects
    participant D as computeDeficit

    U->>T: manda gerar o plano
    T->>P: packCuttingPlan(input)
    P->>A: abre o gerador

    A->>E: expandSheets(input)
    Note over E: uma instância por chapa da quantidade,<br/>da menor área para a maior — o retalho<br/>entra antes da chapa inteira
    E-->>A: chapas na ordem de consumo

    A->>C: classifyPieces(input, chapas)
    C->>C: fitsAnySheet, lote a lote
    Note over C: o que não cabe em chapa nenhuma é rejeitado,<br/>não vira falta de estoque — comprar não resolveria
    C-->>A: placeable (uma instância por cópia) + rejected

    loop 4 ordenações x 3 heurísticas = 12 tentativas
        A->>A: ordena placeable por comparePieces(ordering)
        A->>B: buildPlan(chapas, ordenadas, heurística)

        loop cada chapa, até acabarem as peças
            B->>F: fillSheet(chapa, restantes)

            loop cada peça restante
                F->>M: findFit(livres, peça acrescida do kerf, heurística)
                alt coube
                    M-->>F: fit com x, y, medidas e rotated
                    F->>F: placement na origem da célula deslocada de refile e kerf
                    F->>M: occupy(livres, fit)
                    M-->>F: nova lista de retângulos livres
                else não coube
                    M-->>F: null
                    F->>F: peça segue para a chapa seguinte
                end
            end

            F-->>B: placements, leftovers e área colocada
            Note over B: chapa em que nada coube não vira chapa<br/>planejada, e sua área útil fica fora do aproveitamento
        end

        B->>B: groupShortfall(restantes) reagrupa o que sobrou em lotes
        B->>D: computeDeficit(restantes, chapas)
        D-->>B: área, m², chapa de referência e "pelo menos N chapas"
        B-->>A: plano candidato
        A->>A: isBetterPlan(candidato, melhor)
        A-->>P: yield da melhor tentativa até aqui
    end

    P-->>T: o último yield é o plano
    T-->>U: chapas desenhadas, aproveitamento, não alocadas e o que comprar
```

Três detalhes que o diagrama mostra mas não explica:

- **O kerf não tem caso especial.** O empacotamento roda num retângulo que é a
  área útil **diminuída** de um kerf, e cada peça ocupa as suas medidas
  **acrescidas** de um kerf. Colocada a peça, a origem real é a da célula
  deslocada de um kerf — folga exata em toda fronteira, contra a vizinha e
  contra a borda, sem tratar a borda à parte ([ADR-0001](adr/0001-kerf-como-deslocamento-unico.md)).
- **Vence a tentativa que deixa menos material de fora**; empatadas nisso, a que
  usa menos chapas; empatadas nisso, a de maior aproveitamento. A primeira
  tentativa vira a melhor sem passar pela comparação — o plano vazio tem déficit
  zero e ganharia de qualquer plano que deixasse peça de fora.
- **O gerador existe pela tela.** `packCuttingPlanAttempts` cede o controle entre
  as tentativas para o renderer repintar; `packCuttingPlan` só consome tudo e
  devolve o último valor.
