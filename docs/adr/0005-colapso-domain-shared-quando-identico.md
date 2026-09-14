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

`meu-negocio-app` fica fora desta rodada porque já não qualifica —
`stock_applied` acima. `meu-movel-planejado` foi auditado e colapsado numa
rodada posterior — ver "Auditoria do `meu-movel-planejado`" abaixo.

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

## Auditoria do `meu-negocio-app`

Produto e Modo de tema foram auditados e colapsados
(`.scratch/meu-negocio-colapso-tipos/issues/01` e `02`): `ProductEntity`
(`main/domain/product.ts`) e `ThemeModeEntity` (`main/domain/theme.ts`) eram
cópia estrutural pura do `Product` e do `ThemeMode` de `shared/types/` e hoje
vivem só lá. `domain/product.ts` foi apagado por completo — não guardava
nenhuma função de domínio, só o tipo e o comentário sobre o sufixo `Entity`,
movido para `domain/order.ts`. `domain/theme.ts` continua existindo: só o
alias de tipo colapsou, `isThemeMode`/`resolveThemeMode` seguem como funções
de domínio de verdade, mesmo papel de `domain/settings.ts` no `git-dlog`.

Isso reconfirma, com um caso real, que a granularidade certa do critério é por
entidade, não por app: a seção anterior ("O caso que esta regra não cobre:
`stock_applied`") tratou o `meu-negocio-app` inteiro como fora do piloto, mas
foi escrita antes de a auditoria do `git-dlog` (acima) provar que app nenhum
qualifica ou desqualifica em bloco. Com Produto e Modo de tema colapsados,
`stock_applied` deixa de ser "o motivo de o `meu-negocio-app` ficar fora" e
passa a valer só para `Order`: `OrderItemEntity.stockApplied`
(`main/domain/order.ts`) continua carregando a baixa de estoque já aplicada
ao item, que não deve atravessar o IPC, e `OrderEntity`/`OrderItem` continuam
divergindo exatamente nesse campo — não colapsam. Não é uma decisão nova, só
o critério já escrito confirmado por mais um caso real, no mesmo papel de
`EncryptedGithubTokenEntity` e de `isThemeMode`/`resolveThemeMode` no
`git-dlog`.

`CONTEXT.md` do `meu-negocio-app` não precisa de nenhuma mudança: o colapso é
estrutural (`domain/` ↔ `shared/types/`), e o vocabulário de domínio que o
`CONTEXT.md` fixa — Conta a receber, Saldo devedor, Faixa, Escrituração de
estoque — não muda com ele.

## Auditoria do `meu-movel-planejado`

O `meu-movel-planejado` foi auditado e colapsado por completo
(`.scratch/meu-movel-planejado-colapso-tipos/issues/01` a `05`): Projeto, Peça,
Chapa, a árvore de Plano de corte (o `Plan` inteiro, nó a nó) e `ThemeMode`
colapsaram no critério deste ADR — todos hoje vivem só em `shared/types/`, e
`domain/sheet.ts`, `domain/project.ts` e `domain/piece.ts` foram apagados por
completo.

Duas exceções confirmam o critério em vez de contradizê-lo — uma repete um
papel já registrado neste ADR, a outra é um terceiro tipo de exceção:

- `isThemeMode`/`resolveThemeMode` (`apps/meu-movel-planejado/src/main/domain/theme.ts`)
  não colapsam: mesmo papel de `isThemeMode`/`resolveThemeMode` no `git-dlog`
  e de `domain/theme.ts` no `meu-negocio-app` — lógica real de domínio (a
  segunda resolve a preferência do sistema operacional quando não há escolha
  gravada, e é lida pelo bootstrap do main antes de existir camada IPC), não
  cópia pura de tipo. `domain/theme.ts` continua existindo só por causa
  delas, mesmo com `ThemeModeEntity` colapsado.
- `PlanInput` (`apps/meu-movel-planejado/src/main/domain/plan.ts`) não
  colapsa, mas também não é o caso de `stock_applied` nem o de
  `isThemeMode`: é um terceiro tipo de exceção. Não é campo interno que
  precisa ficar de fora do IPC (não há campo nenhum sendo filtrado — `Plan`
  colapsou inteiro), nem função de domínio com lógica real (é só um alias de
  tipo, `Omit<Plan, 'id' | 'projectId' | 'generatedAt'>`). `PlanInput` *foi*
  tipo de contrato, com par em `shared/types/plan.ts`, até um ticket anterior
  mover a geração do plano de corte para o main; hoje é construído só dentro
  dele, por `planSnapshot.toPlanInput`, e consumido só por
  `plansRepository.replaceForProject` — nunca atravessa o IPC como está, e
  por isso não tem mais par no shared. A diferença para `stock_applied` é a
  origem: aqui não é um campo sensível sendo filtrado, é um tipo que deixou
  de ser contrato por decisão de produto (a geração migrou de camada), e o
  que sobrou é a forma que o main usa internamente antes de o banco atribuir
  os três campos que faltam (`id`, `projectId`, `generatedAt`). Vale registrar
  como padrão: outra entidade colapsada, neste ou em outro app, pode repetir
  esse caso — um tipo de contrato que perde o par no shared não por
  filtragem, mas porque a fronteira que ele atravessava deixou de existir.

`CONTEXT.md` do `meu-movel-planejado` não precisa de nenhuma mudança: o
colapso é estrutural (`domain/` ↔ `shared/types/`), e o vocabulário de
domínio que o `CONTEXT.md` fixa não muda com ele.
