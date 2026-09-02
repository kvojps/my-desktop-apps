# Quatro camadas no processo principal, e nenhuma delas pulável

`src/main` não tinha separação de responsabilidade, e a regra de negócio acabou
morando em três lugares diferentes conforme o app: dentro do repositório
(`db/ordersRepository.ts` do Meu Negócio, 349 linhas com baixa e estorno de
estoque; `db/monthsRepository.ts` do Meu Dinheiro, 312 linhas de competência,
defaults e cascata), dentro do handler de IPC (`ipc/registerIpc.ts` do Git Dlog,
onde `repos:fetch` orquestra quatro módulos inline) ou numa pasta de domínio
ad-hoc que o `README.md` §2.2 sancionava sem nomear camada (`git/`, `pr/`,
`files/`, e no Meu Móvel Planejado `backup/`, `export/` e `print/` — camada de
serviço em tudo menos no nome). Decidimos fixar quatro camadas de fluxo —
controller → service → repositório | gateway —, mais `domain/` ao lado delas.

O objetivo é legibilidade estrutural: que a árvore de pastas conte sozinha como
o app funciona, sem que seja preciso abrir três arquivos para descobrir onde a
regra caiu desta vez. A árvore e a responsabilidade de cada pasta estão no
`README.md` §2.2; o que este ADR registra é o porquê das escolhas que a árvore
não explica.

## `domain/` não é camada de fluxo

As camadas de fluxo se empilham: o controller chama o service, o service chama o
repositório e o gateway. `domain/` não tem "acima" nem "abaixo" — é o
vocabulário que as camadas trocam entre si, e por isso é a única pasta que
qualquer uma delas pode importar sem inverter a pilha. Entidade é anêmica
(`type` mais funções puras, sufixo `Entity`, nome no singular) exatamente por
isso: se ela carregasse comportamento com dependência, importá-la de duas
camadas voltaria a espalhar a regra, que é o problema que este ADR fecha.

## Unidade de trabalho: `makeRepositories(db)`

O service recebe `repos`, nunca `db`. `makeRepositories(db)` devolve os
repositórios já ligados à conexão mais um `transaction()`, e é assim que uma
regra que escreve em duas tabelas continua atômica sem que o service saiba o que
é uma conexão SQLite.

O service não pode importar `better-sqlite3` por duas razões que se somam. A
primeira é a costura de teste: `repos` é um objeto que um teste monta à mão, e
`db.transaction(...)` não é — trocar a assinatura por `db` é o mesmo que exigir
um arquivo `.db` para exercitar uma regra de negócio. A segunda é que o import
seria a porta pela qual o SQL volta a vazar para fora de `infra/database/`: quem
tem a conexão na mão acaba escrevendo um `SELECT` "só desta vez".

## O repositório devolve `null`; o 404 é do service

Repositório expõe `list` / `findById` / `create` / `update` / `delete`, e
`findById` de id inexistente devolve `null` em vez de lançar. Quem transforma
`null` em `AppError` é o service, porque "não existe" só vira erro à luz do que
se ia fazer com a linha: buscar para exibir é 404, buscar para conferir se já
existe é o caminho feliz. Se o repositório lançasse, o segundo caso teria de
capturar a exceção que ele mesmo provocou — controle de fluxo por `try`.

## Nenhuma camada é pulável

Nem quando o service só repassa uma linha ao repositório. A tentação é óbvia e a
resposta é que estrutura com exceção não conta história: se o controller às
vezes fala com o repositório, ninguém mais consegue responder "onde está a
regra?" olhando a árvore — a resposta vira "depende", e o ganho inteiro do
desenho vai embora. Um repasse de uma linha custa um arquivo de quatro linhas; a
exceção custa a propriedade que motivou o refactor.

Vale o mesmo para o mapeamento sempre explícito nas duas travessias
(`README.md` §2.5): o mapper trivial não se lê, mas é ele que garante que nada
atravessa o IPC sem alguém ter decidido que atravessa.

## Carve-out do bootstrap

`index.ts` fica fora das camadas e lê o tema direto do repositório. É deliberado
e é o único carve-out: a preferência de tema pertence ao banco justamente porque
o processo main precisa dela para pintar a janela **antes de existir renderer**
(`docs/design-system.md`, §5.1). Nesse instante não há canal de IPC, não há
controller e não há request para validar — a pilha de camadas existe para
atender o renderer, e aqui ainda não há um. Fazer o bootstrap atravessar um
controller seria inventar um caller falso para preservar a simetria.

O carve-out é do bootstrap, não do tema: trocar o tema em runtime é escrita
vinda da tela e passa pelas quatro camadas como qualquer outra.

## Testes: adiamento, não omissão

**Nenhum `.test.ts` novo entra nesta leva.** Isto é adiamento deliberado, e
precisa estar escrito: sem dizê-lo, a camada de serviço passa a ser lida como
decoração — um arquivo a mais no caminho, sem nada que dependa de ele existir —
e a regra volta para o repositório na primeira pressa.

O desenho preserva a costura: o service recebe `repos`, não `db`, e é essa
assinatura que torna o teste um arquivo em vez de um projeto. O vitest **já está
configurado na raiz** (`vitest.config.ts` inclui `apps/*/src/**/*.test.ts`, e há
`npm run test` no `package.json` da raiz) e já cobre os quatro apps. O Meu Móvel
Planejado é o único com testes porque é o único que escreveu arquivos
`.test.ts`, não porque tenha infraestrutura que os outros não têm. Escrever o
primeiro teste de service depois é criar um arquivo, sem instalar nada.

## Alternativas consideradas

- **Organização vertical, por feature** (`repos/` com controller, service e
  repositório dentro). Agrupa o que muda junto, mas some com a propriedade que
  se quer: a árvore deixa de responder "que camadas existem" e volta a esconder
  em que altura a regra de cada feature caiu. Com quatro apps que precisam se
  parecer, a repetição da camada é o que faz mexer em um ensinar os outros.
- **Manter a regra no repositório** e só extrair gateways. É o estado do Meu
  Negócio e do Meu Dinheiro, e é barato porque não é migração nenhuma. Mas é
  exatamente o arranjo em que um repositório chega a 349 linhas, e nele
  transação e regra ficam no mesmo arquivo que o SQL — não há onde exercitar a
  regra sem banco.
- **Uma camada só de "serviços"**, sem controller, com o `registerIpc` chamando
  o service direto. Economiza a camada mais fina, e é quase o que o Git Dlog faz
  hoje. Cai porque a validação e o `xToResponse` precisam morar em algum lugar:
  sem controller, o service passa a conhecer zod e os tipos de `shared`, e o
  contrato de IPC volta a se misturar com a regra.

## Consequências

`controllers/registerIpc.ts` acumula duas funções — compor as camadas e
registrar os canais. Aceito por decisão, com a ressalva de vigiar o tamanho
quando os apps maiores chegarem; se doer, o que sai é a composição, não o
registro.

A migração é por app e nesta ordem: `git-dlog`, depois `meu-negocio-app`, e os
dois restantes planejados depois. O Git Dlog prova `gateways/` melhor que
qualquer outro app — tem `git/`, `pr/`, `exec` e `safeStorage`, a superfície de
mundo externo mais rica do repo — e **não** prova transação nem entidade de
banco: tem zero `db.transaction` nas repositories, contra quatro do Meu Negócio.
Por isso o segundo app não é opcional; `transaction()` e a entidade separada do
response só ganham call site real lá.

Enquanto a fila não anda, app não convertido está divergindo do `README.md`
§2.2, que é normativo — e divergência entre documento e código é bug do código.

O maior item isolado do trabalho é o mapper de `RepoScanResult`:
`apps/git-dlog/src/shared/types/repoScan.ts` são 122 linhas de árvore aninhada
(`RepoBranch`, `RepoHead`, `RepoSync`, `RepoCommitGroup`, `RepoWorktree`,
`RepoCommit`), e com mapeamento sempre explícito cada nó ganha entidade e
mapper.

A decisão de trazer **toda** a lógica de domínio para o main é peça separada:
ver [`0003-logica-de-dominio-no-main.md`](0003-logica-de-dominio-no-main.md).
