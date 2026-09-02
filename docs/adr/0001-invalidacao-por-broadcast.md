# Invalidação de dados por aviso do main, e não por `reload` à mão

Os dados do renderer vivem em Contexts montados acima do router, que carregam uma
vez no boot; a regra era que quem gravasse chamasse o `reload` do domínio afetado.
A regra era "não esqueça", e foi esquecida em quatro lugares do Meu Dinheiro — os
totais da Visão Geral depois de mexer numa despesa, o saldo em contas depois de
pagar, a lista de meses depois de importar backup e o mês corrente criado no foco
da janela —, sempre em silêncio e sempre mostrando dinheiro errado na tela.
Decidimos trocar a regra por um mecanismo: o wrapper `handle` do main, por onde
**todo** IPC passa, dispara `data:changed` ao fim de qualquer canal de escrita, e
quem guarda dado no renderer assina esse evento com `useDataChanged(reload)`.

## Por que enumerar as leituras, e não as escritas

`READ_ONLY_CHANNELS` lista as leituras; escrita é tudo o que sobra. É a direção
segura do erro: esquecer de classificar um canal novo custa uma recarga a mais —
com SQLite local e agregados em milissegundos, invisível —, enquanto a lista
inversa devolveria exatamente o bug que este mecanismo fecha. Pelo mesmo motivo o
evento não tem payload de domínio: granularidade seria uma otimização que
reintroduz a chance de errar o mapeamento.

## Alternativas consideradas

- **Espalhar `reload()` nos call sites**, como a regra antiga mandava. Consertaria
  os quatro buracos e preservaria a fábrica que os produziu.
- **TanStack Query.** É boa nas coisas que estes apps não têm — rede, latência,
  dedup de request, retry, cache com TTL. O que falta aqui é só invalidação. E ela
  não enxerga mutação iniciada pelo main, então o mês criado no foco continuaria
  invisível: seria dependência nova e reescrita da camada de dados para resolver
  metade do problema. Se um dia fizer sentido, compõe com o aviso em vez de
  competir com ele.

## Consequências

O preload deixa de ser só `ipcRenderer.invoke`: ganha `onDataChanged`, a única
entrada baseada em evento. Isso contraria a descrição antiga do `README.md` §2.3 e
não é descuido — sem um canal main → renderer, mudança que nasce no main (o mês
corrente no foco) não teria como chegar à tela.

A recarga acontece por baixo do conteúdo já visível porque `reload` nunca levanta
`loading` (`docs/design-system.md`, §5.3). Um context que use `retry` no lugar de
`reload` faria a tela piscar a cada gravação.

## Emenda: nem todo dado mora num context (setembro de 2026)

A primeira frase deste ADR — "os dados do renderer vivem em Contexts montados
acima do router" — descreve os apps que existiam quando ele foi escrito, não a
regra do repo. O `meu-movel-planejado` tem **zero contexts de domínio**, e defende
a escolha em comentário, em
`apps/meu-movel-planejado/src/renderer/src/hooks/projects/useProjects.ts`:

> Ainda é hook de tela e não context: projeto é consumido por uma tela só, e a
> regra do repo é que o context nasce quando a segunda precisa (README, §2.4).

O código segue o §2.4 e contradiz este ADR. **O código está certo; o ADR está
estreito** — daí a emenda em vez da reescrita, e daí ela estar escrita: exceção
escrita é exceção que alguém pode contestar; exceção implícita é precedente
silencioso ([`0003-logica-de-dominio-no-main.md`](0003-logica-de-dominio-no-main.md)).

Onde o dado mora segue a regra de promoção do
[`0004-estrutura-do-renderer.md`](0004-estrutura-do-renderer.md):

- **Domínio consumido por uma tela** vive no hook da própria tela, que assina
  `useDataChanged(reload)` direto.
- **Domínio consumido por duas ou mais** vira context montado acima do router,
  com hook fino em `hooks/<domínio>/` que só o repassa.

**O mecanismo não muda.** Quem guarda dado assina o aviso; o que muda é só _quem_
guarda. Um hook de tela que assina `useDataChanged` está tão coberto quanto um
context — a garantia deste ADR é que nenhuma gravação precisa lembrar de
recarregar nada, e ela não depende de onde o estado está montado. A distinção
`reload` / `retry` (`docs/design-system.md`, §5.3) vale igual dos dois lados: o
aviso do main chama `reload`, e só o `ErrorState` chama `retry`.

O contrário — declarar o Meu Móvel Planejado em erro e criar `ProjectsContext` e
`PlanContext` — cria provider para domínio de uma tela só e seria a única exceção
à regra de promoção no repo, sem motivo medido.
