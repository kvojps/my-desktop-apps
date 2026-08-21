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
