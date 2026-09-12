# Domain e Shared colapsam num tipo só quando são idênticos, nunca por padrão

O ADR-0002 fixou `domain/` como camada sempre presente, com `XEntity`
separado do `X` de `shared/types/` e o mapper `entity → response` como trava
obrigatória (`README.md` §2.5). Investigação no `meu-dinheiro-app` mostrou que,
para Despesa, Entrada, Conta bancária e Categoria/CategoryTotal, `XEntity` e
`X` são **estruturalmente idênticos** — mesmos campos, mesmos tipos — e o
`xToResponse` correspondente só copia valor por valor, sem transformação
nenhuma. A trava continuava obrigatória mesmo onde não protegia nada:
ceremônia sem efeito, mantida só porque o `README.md` a descrevia como
incondicional.

## O critério: idêntico hoje, sem campo à vista para filtrar

Colapsar `XEntity` e `X` num tipo só, que passa a viver apenas em
`shared/types/`, sempre que hoje as duas formas forem idênticas e **não
houver, nem se preveja, campo que precise ser filtrado antes do IPC**. Nesse
caso o repositório (`rowToX`) devolve esse tipo único direto, o arquivo de
`domain/` e o mapper de `controllers/responses/` deixam de existir, e o
controller consome o retorno do service sem mapear de novo.

A divisão em `Entity` + `Response` com mapper explícito continua sendo o
padrão para qualquer entidade que tenha campo interno — ela só deixa de ser
**obrigatória por padrão** quando não protege nada. No dia em que uma
entidade colapsada precisar de um campo que não deve atravessar o IPC, ela
volta a se dividir: o colapso é condicional ao estado atual dos campos, não
uma decisão definitiva.

A fronteira `Row → Entity/Shared` (banco) não muda: `interface XRow` e
`rowToX` continuam existindo exatamente como hoje, convertendo snake_case
para camelCase e valores como `is_paid` (0/1) para boolean. O que colapsa é só
a segunda travessia — `entity → response` —, nunca a primeira.

Exceção pontual: quando o campo condicional de JOIN (`bankAccountName` e
afins, ausente — não `undefined` — nas consultas sem JOIN) já era filtrado
pelo mapper `entity → response` que deixa de existir, essa filtragem passa a
ser do próprio `rowToX`, porque não sobra mais nenhuma travessia depois dela
para fazer o trabalho. Não é a primeira travessia ganhando responsabilidade
nova — é a mesma regra de "ausente quando não veio do JOIN" migrando de
mapper para mapper, porque um dos dois deixou de existir.

## O risco aceito: o `tsc` para de avisar sozinho

O motivo de existir a segunda travessia, no ADR-0002 (seção "Nenhuma camada é
pulável") e no `README.md` §2.5, é que um mapper trivial não se lê, mas é ele
que garante que nenhum campo atravessa o IPC sem alguém ter escrito a linha
que o deixa passar. Colapsando `Entity` e `Response` num tipo só, essa trava
desaparece: o `tsc` para de reclamar quando um campo novo do domínio precisa
parar antes do renderer, porque não há mais dois tipos que possam divergir
entre si — há um tipo só, e ele atravessa inteiro por definição.

Esse é o risco que esta decisão aceita conscientemente: nas entidades
colapsadas, impedir que um campo interno futuro vaze pro IPC volta a ser
disciplina de quem escreve o código, não algo que o compilador força. O
ganho é ceremônia a menos nos casos de hoje; o preço é revisão manual sempre
que um campo novo entrar numa entidade colapsada.

## O caso que esta regra não cobre: `stock_applied`

`OrderItemEntity`, no `meu-negocio-app`, é o motivo original da trava
`entity → response` incondicional: carrega `stockApplied`, a baixa de estoque
já aplicada ao item — escrituração interna que precisa ficar de fora do
`OrderItem` que atravessa o IPC —, e sem o mapper explícito quem defendia
essa exclusão era só um comentário.

É exatamente o caso que este critério não cobre: `OrderItemEntity` e
`OrderItem` **não são idênticos**, e a diferença é o próprio campo que a
regra existe para filtrar. Por isso o `meu-negocio-app` fica fora deste
piloto — não por precaução, mas porque ele já é o caso em que a resposta do
critério é "não colapsa".

## Alternativas consideradas

- **Manter a separação sempre, como o ADR-0002 fixou.** Não custa migração
  nenhuma e preserva a trava do `tsc` em toda entidade, inclusive nas que hoje
  não precisam dela. Cai porque o preço é ceremônia permanente em código que
  não protege nada — várias entidades com um mapper que só copia campo por
  campo, para sempre, porque uma outra entidade (em geral de outro app)
  precisa da mesma estrutura.
- **Colapsar também a fronteira `Row` (banco).** Levaria a simplificação um
  nível abaixo, direto do SQL para o tipo de `shared/types/`. Descartado por
  ser escopo bem maior — tocaria toda `SELECT` do repositório com aliases, ou
  introduziria conversão implícita de driver — e reabriria o mesmo risco do
  `stock_applied` um nível abaixo, sem mapper nenhum para nomear a exclusão.
- **Detectar identidade estrutural automaticamente (lint ou script), em vez
  de auditoria manual por entidade.** Resolveria o risco do `tsc` por outro
  caminho, mas é infraestrutura nova para um julgamento barato de fazer por
  inspeção — um punhado de entidades por app, auditadas uma vez por rodada de
  migração.

## Consequências

`README.md` §2.2 e §2.5 deixam de descrever `domain/` e o mapper
`entity → response` como incondicionais. Uma entidade só precisa de arquivo
em `domain/` quando carrega campo que não deve atravessar o IPC (o caso
`stockApplied`) ou função pura de domínio; puro contêiner de dados idêntico
ao contrato mora só em `shared/types/`, sem par em `domain/` e sem mapper.

Este ADR não colapsa código nenhum sozinho — só registra o critério; quem
colapsa de fato são os tickets que ele desbloqueia
(`.scratch/meu-dinheiro-colapso-tipos/issues/02` a `05`), restritos ao piloto
do `meu-dinheiro-app`: Despesa, Entrada, Conta bancária e
Categoria/CategoryTotal, já auditadas como idênticas. Até esses tickets
rodarem, o próprio `meu-dinheiro-app` diverge do critério que este ADR acaba
de tornar normativo; pelo mesmo princípio do ADR-0002 ("a divergência é do
código, nunca do documento"), essa divergência é aceita como fila de
migração, não como bug a corrigir na hora deste ADR.

`meu-negocio-app` e `meu-movel-planejado` ficam fora desta rodada. O
`meu-negocio-app` porque já não qualifica — `stock_applied` acima. O outro
porque tem pares `Entity`/`Shared` hoje comentados como "estruturalmente
idênticos" (`apps/meu-movel-planejado/src/main/domain/sheet.ts`,
`apps/meu-movel-planejado/src/main/domain/project.ts`,
`apps/meu-movel-planejado/src/main/domain/plan.ts` e
`apps/meu-movel-planejado/src/main/domain/piece.ts`) que ainda não foram
auditados um a um sob este critério — fica para uma rodada futura, entidade
por entidade, e até lá também não conta como bug: a auditoria em si é o
trabalho pendente, não uma escolha de manter a duplicação.

## Auditoria do `git-dlog` (rodada seguinte a este ADR)

O `git-dlog` foi auditado e colapsado por completo
(`.scratch/git-dlog-colapso-tipos/issues/01` a `04`): Pull Request,
Repositório (a árvore de varredura inteira — Commit, Branch, Worktree, Head,
Sync, CommitGroup, ScanResult, FetchFailure, FetchResult, FetchProgress,
Severidade, FetchPhase), Diretório-base (`ScanPath`) e `ThemeMode`
colapsaram no critério deste ADR — todos hoje vivem só em `shared/types/`.

Duas exceções confirmam o critério em vez de contradizê-lo — o mesmo
raciocínio de `stock_applied` e de `Month`/`MonthEntity`, aplicado a casos
reais do `git-dlog`:

- `EncryptedGithubTokenEntity` (`apps/git-dlog/src/main/domain/settings.ts`)
  não colapsa: é o token do GitHub cifrado, nunca atravessa o IPC, e não tem
  par em `shared/types/` — o mesmo papel de `stock_applied` no
  `meu-negocio-app`.
- `isThemeMode`/`resolveThemeMode`, no mesmo arquivo, também não colapsam:
  são funções de domínio de verdade (a segunda resolve a preferência do
  sistema operacional quando não há escolha gravada, e é lida pelo bootstrap
  do main antes de existir camada IPC), não cópia pura de tipo — o mesmo
  papel de `Month`/`MonthEntity` no `meu-dinheiro-app`. Por isso
  `domain/settings.ts` continua existindo, mesmo com `ThemeModeEntity`
  colapsado.
