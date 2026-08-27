Status: resolvido

# Meu Dinheiro: CONTEXT.md

O `meu-dinheiro-app` não tem `CONTEXT.md` — e a ausência é o estado normal
(`CONTEXT-MAP.md`: "glossário se escreve sob demanda, quando um termo de fato precisa ser
resolvido"). A migração de camadas é esse momento: o vocabulário do domínio vira nome de
entidade (`MonthEntity`), de service (`ensureCurrentMonth`) e de função (`competencyKey`), e
não há glossário contra o qual conferir se `padrão` ou `default`, `competência` ou `período`.

Este ticket cria `apps/meu-dinheiro-app/CONTEXT.md` no formato de
`.claude/skills/domain-modeling/CONTEXT-FORMAT.md`: `# Meu Dinheiro`, uma ou duas frases de
descrição, depois `## Language` com `**Termo**` / definição do que o termo **é** (não do que
faz) / `_Avoid_: sinônimos`.

## Termos

| Termo | Definição (o que é) | `_Avoid_` |
|---|---|---|
| **Competência** | A que mês um fato financeiro pertence, dado por ano + mês. Onde é preciso uma string, representa-se como `AAAA-MM`. A string é a representação, não o conceito | período, mês de referência, competency |
| **Mês** | O contêiner ano-mês em torno do qual o app inteiro se organiza; guarda as despesas e as entradas daquela Competência | período |
| **Mês corrente** | O Mês cuja Competência é a de hoje. O app garante que ele existe ao abrir e sempre que a janela volta ao foco | mês atual, current month |
| **Despesa padrão / Entrada padrão** | Modelo do que se repete todo mês (nome, valor, dia de vencimento ou previsão, categoria ou conta). Todo Mês novo nasce com uma cópia das vigentes no momento da criação | default, recorrente, template, assinatura |
| **Cópia / fotografia** | A relação entre um item de um Mês e o padrão de onde veio: um retrato tirado na criação, não uma referência viva. Editar o padrão depois nunca mexe nos meses já criados | vínculo, referência |
| **Cascata** | A propagação da exclusão de um Mês para as suas despesas e entradas, feita pelo banco. Reservado para exclusão — a cópia de padrões não é cascata | — |
| **Realizado** | `recebido − pago`. O dinheiro que de fato entrou e saiu até agora. O número de destaque | saldo real, efetivo |
| **Previsto** | `entradas − despesas`. Onde o mês termina se tudo for cumprido. A projeção | orçado, estimado |
| **Comprovante** | A imagem ou PDF anexada a uma despesa no momento do pagamento. Apagada junto com a despesa e ao desmarcar o pagamento | anexo, recibo |
| **Valor variável** | Uma despesa padrão sem valor fixo, preenchido na hora do pagamento (água, luz) | valor em aberto |
| **Conta bancária** | O elo entre uma despesa ou entrada e o dinheiro real: pagar debita, receber credita. Excluir uma não desfaz movimentos passados | carteira |
| **Categoria** | Classifica despesas para o Histórico. Excluir uma deixa as despesas "sem categoria", nunca as apaga. Distinta de `categoria` no Meu Negócio | etiqueta, tag, grupo |

## O que NÃO entra

Nenhum vocabulário de arquitetura (camada, controller, service, repositório, entidade,
gateway, unit of work). `CONTEXT.md` é glossário de domínio e nada mais.

## Verificação

`npm run format`, `npm run typecheck`, `npm run lint`, `npm run test` — só markdown novo, tudo
deve passar sem tocar em nada mais. Conferir contra `CONTEXT-FORMAT.md`: definições apertadas
(o que É), termo canônico único por conceito, `_Avoid_` listando os sinônimos rejeitados.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisão 4 e Q11 do plano).

Resolvido: `apps/meu-dinheiro-app/CONTEXT.md` criado com os 12 termos da tabela,
no formato de `CONTEXT-FORMAT.md` (`# Meu Dinheiro` → descrição → `## Language`
com `**Termo**:` / definição do que É / `_Avoid_`). `Cascata` fica sem linha
`_Avoid_` (nada a rejeitar). `CONTEXT-MAP.md` passou a linkar o novo arquivo em
vez de registrar a ausência. Nenhum vocabulário de arquitetura entrou.
`npm run typecheck`, `lint` e `test` passam; `prettier --check` limpo no arquivo
novo (o `npm run format` global mexe em `.scratch` legado não formatado, fora
do escopo deste ticket).
