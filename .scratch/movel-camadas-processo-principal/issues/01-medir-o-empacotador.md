Status: resolvido

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

## Answer

`packCuttingPlan` inteira — as doze tentativas —, mediana de cinco execuções após uma descartada:

| | peças (lotes) | instâncias | chapas | colocadas | **mediana** | amostras (ms) |
|---|---|---|---|---|---|---|
| Pequeno | 10 | 15 | 2 | 15 | **0,6 ms** | 0,6 · 0,5 · 0,7 · 0,4 · 0,6 |
| Típico de cozinha | 60 | 200 | 8 | 198 | **3,5 ms** | 4,8 · 3,7 · 3,3 · 3,5 · 3,3 |
| Pesado | 150 | 500 | 20 | 500 | **10,6 ms** | 10,6 · 10,6 · 10,6 · 11,8 · 10,5 |

**Faixa: a primeira — `< 500 ms`. Segue como está.** O caso pesado é 10,6 ms, quase cinquenta
vezes abaixo do limiar. Não entra ticket de worker thread; o ticket 07 chama a função direto.

### Onde foi medido

AMD Ryzen 5 5625U (6 núcleos, 12 lógicos), 15 GB de RAM, Windows 11 (10.0.26200), Node
v24.15.0 via `npx tsx`, sem Electron — a função não toca banco, disco, relógio nem
aleatoriedade, então o número transfere para o V8 do main.

### Como as entradas foram construídas

Chapa 2750 × 1850 mm (27500 × 18500 décimos), um lote de quantidade 1 por chapa, kerf 3, refile
0. Peças sorteadas com PRNG semeado (mesma entrada em toda execução) de dez formatos de
marcenaria de cozinha — lateral 700 × 580, prateleira 800 × 350, porta 700 × 400, travessa
500 × 150 etc., média ≈ 0,19 m². Os tamanhos foram calibrados para a demanda ficar em ~93% da
área útil disponível, que é o **pior caso** para o custo: quase toda peça é colocada, e é a
colocação que faz a lista de retângulos livres crescer. Uma primeira rodada com peças grandes
demais deixava metade fora e media 6,8 ms no caso pesado — mais rápido, e menos honesto.

### Com que tamanho ele começa a doer

É a pergunta que o ADR-0003 diz não ter respondido, e ela sai de graça das mesmas entradas
escaladas:

| | instâncias | chapas | mediana |
|---|---|---|---|
| Pesado × 3 | 1500 | 60 | 62 ms |
| Pesado × 10 | 5000 | 200 | 566 ms |

Cresce perto do quadrático: 10× de projeto custa ~53× de tempo. O limiar de 500 ms fica em
torno de **5000 instâncias em 200 chapas** — um projeto dez vezes maior que o caso pesado, que
já é uma cozinha inteira e meia. `MAX_QUANTITY` é 999 por lote, então a entrada é alcançável no
papel; na prática ela não é um serviço de marcenaria.

### Nada no repo mudou

O script de medição viveu no scratchpad da sessão e não foi commitado. Nenhum teste novo (spec,
decisão 3): benchmark não é teste.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 1 e 13).

Resolvido: medição feita, faixa 1 (`< 500 ms`). O escopo da leva continua em oito tickets — o
nono, de worker thread, não entra. Os três números e o limiar de 500 ms vão para a emenda do
ADR-0003 no ticket 07, como manda a última linha da ramificação pré-comprometida ("o número
medido vai para a emenda do ADR em qualquer uma das três faixas").
