Status: aberto

# Meu Móvel Planejado: medir o empacotador

O ADR-0003 registra, com todas as letras, que **a decisão foi tomada sem medir**
`packCuttingPlan` — "nem com que tamanho de projeto ele começa a doer" — e que "se aparecer
congelamento de UI no Meu Móvel Planejado, a peça a revisitar é este ADR, não o código que o
obedeceu, e a revisão começa pela medição que não foi feita".

Este ticket faz a medição que faltou, **antes** de o ticket 07 mover o empacotador. Não tem
dependência com ninguém; só precisa estar resolvido antes do 07.

## A pergunta certa

Não é "a UI congela?". A spec desta pasta registra que dois dos três custos que o ADR lista
estão errados para este app: o renderer fica **livre** durante o empacotamento no main (é o
contrário de hoje), e não existe segunda janela para travar. Quem paga é a **moldura nativa** —
arrastar, redimensionar, minimizar — e qualquer IPC concorrente, porque essas o main é que serve.

A pergunta é: **a moldura trava tempo suficiente para incomodar?**

## O que medir

Tempo de parede de `packCuttingPlan(input)` — a função inteira, com as doze tentativas (quatro
ordenações × três heurísticas de `packCuttingPlan.ts:69-71`), não uma tentativa.

Três tamanhos, com entradas sintéticas:

| | peças (lotes) | instâncias | chapas (lotes) |
|---|---|---|---|
| Pequeno | ~10 | ~15 | 2 |
| Típico de cozinha | ~60 | ~200 | 8 |
| Pesado | ~150 | ~500 | 20 |

Instância é peça × quantidade — é o que o empacotador de fato acomoda (`classifyPieces`,
`packCuttingPlan.ts:176-192`). Chapas em formato realista (2750 × 1850 décimos de mm ×10),
kerf 3 (0,3 mm) e refile 0.

Usar `performance.now()`, descartar a primeira execução (JIT) e reportar a mediana de cinco.

## Como

Script descartável rodando a função pura sob o Node do repo (`npx tsx`, ou um `bench` do
vitest). **Não precisa de Electron**: o main do Electron roda o mesmo V8, e a função não toca
banco, disco, relógio nem aleatoriedade (`packCuttingPlan.ts:6-8`) — o número transfere. O que o
Electron acrescentaria é só o bloqueio da moldura, que é o que a faixa abaixo interpreta.

O script **não é commitado** — vive no scratchpad da sessão e morre com o ticket. A leva não
ganha teste novo (spec, decisão 3), e um benchmark não é teste.

## Ramificação pré-comprometida

Pelo tempo do **caso pesado**:

- **< 500 ms** — segue como está. O usuário clicou num botão que diz "Gerando…"; meio segundo de
  moldura dura é indistinguível de um clique normal.
- **500 ms – 2 s** — segue como está, e o número entra na emenda do ADR-0003 (ticket 07) como
  **custo medido e aceito**, não como suposição.
- **> 2 s** — um ticket de worker thread entra na leva, antes do 07, e o 07 passa a chamar o
  worker em vez da função direto. É a saída que o ADR-0003 já nomeia nas alternativas
  consideradas ("é a saída natural se a medição vier e doer").

O número medido vai para a emenda do ADR **em qualquer uma das três faixas** — inclusive na
primeira. Registrar "medimos e é rápido" é o que fecha a pendência; não registrar deixaria o
ADR com o mesmo buraco depois do trabalho todo.

## O que NÃO entra aqui

- Mover código. O empacotador continua em `shared/nesting/` até o ticket 07.
- Otimizar o empacotador. Se ele for lento, a resposta é worker thread (que tira do event loop),
  não reescrever `maxRects`.
- Medir o renderer. O que ele faz hoje sai de cena.

## Verificação

Os três números na seção `## Answer` deste ticket, com o hardware e a versão do Node em que
foram tomados. A faixa escolhida declarada explicitamente, e — se for a terceira — o ticket de
worker thread criado como `09-worker-thread.md` com `Blocked by: 01`, e o 07 renumerando a sua
dependência.

Nada no repo muda: `git status` limpo ao fim do ticket, exceto este arquivo.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 1 e 13).
