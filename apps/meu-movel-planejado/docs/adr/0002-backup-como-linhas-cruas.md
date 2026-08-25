# Backup como linhas cruas das tabelas, com identidade e versão de formato

O ticket 10 pede que o arquivo de backup "carregue as linhas cruas das tabelas,
mantendo a convenção do monorepo — é o que mantém backups antigos importáveis".
Decidimos exatamente isso, e mais duas coisas que o ticket não pedia mas que a
promessa dele exige para valer: um campo de **identidade** e uma **versão de
formato**.

O arquivo é `{ app, version, exported_at, <tabela>: [linhas...] }`, com as chaves
de cada linha em `snake_case`, como o SQLite as guarda.

## Por que linhas cruas, e não objetos de domínio

O `meu-negocio-app` exporta objetos de domínio (`Product`, `Order`), e cada
renomeação de campo obrigou o schema de importação a carregar um `optional()`
com default para traduzir arquivos antigos. O `meu-dinheiro-app` exporta
`SELECT *` e absorve as mesmas mudanças sem tradutor.

A linha crua acompanha a tabela. Uma coluna acrescentada por migração entra
sozinha na exportação; num arquivo anterior a ela, a coluna não aparece em linha
nenhuma, fica de fora da gravação e o default da tabela vale. A conciliação está
em `src/main/backup/backupRows.ts`, e a regra que a sustenta é que **nome de
coluna sai da tabela viva (`PRAGMA table_info`), nunca do arquivo** — o arquivo
decide quais das colunas conhecidas serão gravadas, jamais quais existem.

## Por que o campo `app`

Sem ele, a recusa de um arquivo estranho seria acidental — dependeria de a forma
não bater por acaso. E há um arquivo que bate quase todo: o backup do
`meu-dinheiro-app` também é um JSON com `version: 1` e `exported_at`. Como a
importação apaga tudo antes de gravar, um falso positivo esvaziaria o banco para
só então descobrir que não havia o que pôr no lugar.

A conferência pergunta na ordem em que as perguntas fazem sentido — identidade,
versão, forma — e cada resposta tem mensagem própria, porque cada uma manda o
usuário a um lugar diferente: outro arquivo, outra versão do app, outra cópia do
mesmo arquivo. Sem a pergunta da versão, um backup truncado da versão corrente
receberia "atualize o app", que é o conselho errado para dano de arquivo.

## O que o backup não carrega

A tabela `settings`, onde mora a preferência de tema. O ticket diz "todos os
dados", e esta é uma divergência deliberada da palavra: o tema é da máquina, não
do serviço, e restaurar um backup em outro computador não deve trocar o modo
daquele computador. A linha seguinte do próprio ticket confirma o escopo real —
"restaura projetos, peças, chapas e planos".

## Consequências

- Acrescentar uma tabela de dados exige declará-la em `BACKUP_TABLES`
  (`src/main/db/backupRepository.ts`) e no `backupSchema`
  (`src/main/schemas/backup.schema.ts`). O `tsc` cobra a segunda a partir da
  primeira, e um teste compara as duas listas.
- `BACKUP_VERSION` sobe só quando o arquivo deixar de ser legível como está —
  coluna a mais ou a menos já é absorvida. Versões antigas continuam aceitas por
  **acréscimo** à união de versões, nunca por substituição: um backup que já foi
  para o pen drive do usuário não pode deixar de ser importável.
- A importação roda numa transação só, com as chaves estrangeiras ligadas. Um
  arquivo inconsistente é recusado pelo banco e nada é alterado — é essa
  promessa que permite oferecer uma ação irreversível.
