Status: ready-for-agent

# Atualizar ADR-0005 com a auditoria do meu-negocio-app

Blocked by: 01, 02 (só faz sentido depois de todo o colapso técnico estar
concluído e verificado)

## O que fazer

Editar `docs/adr/0005-colapso-domain-shared-quando-identico.md`: a seção "O
caso que esta regra não cobre: `stock_applied`" hoje trata o
`meu-negocio-app` inteiro como fora de qualquer piloto, numa granularidade
de app, não de entidade — escrita antes de o `git-dlog` provar (na sua
própria seção "Auditoria do `git-dlog`") que a granularidade certa é por
entidade.

Acrescentar uma seção final "Auditoria do `meu-negocio-app`", no mesmo
formato da seção "Auditoria do `git-dlog`" já existente, registrando que
Produto e Modo de tema foram auditados e colapsados
(`.scratch/meu-negocio-colapso-tipos/issues/01` e `02`), e reconfirmando
`OrderItemEntity.stockApplied` como a exceção que continua de pé — não é uma
decisão nova, só um caso real confirmando o critério já escrito, no mesmo
papel de `EncryptedGithubTokenEntity` e das funções de domínio de
`settings.ts` no `git-dlog`.

Não é uma decisão nova — só confirma o critério já escrito com um caso real.
Não criar ADR separado.

## Checklist

- [ ] Acrescentada a seção "Auditoria do `meu-negocio-app`" ao final do
      ADR-0005, registrando Produto e Modo de tema como colapsados.
- [ ] Confirmado, na nova seção, que `OrderItemEntity.stockApplied` continua
      sendo o caso que o critério não cobre — a seção existente sobre
      `stock_applied` não é apagada nem contradita, só passa a valer para
      `Order` especificamente, não para o app inteiro.
- [ ] Confirmado que `CONTEXT.md` do `meu-negocio-app` não precisa de
      nenhuma mudança — colapso estrutural, vocabulário de domínio não muda.
