Status: todo

# 06: Atualizar ADR-0005 com a auditoria do meu-movel-planejado

Blocked by: 01, 02, 03, 04, 05 (só faz sentido depois de todo o colapso
técnico estar concluído e verificado)

## O que fazer

Editar `docs/adr/0005-colapso-domain-shared-quando-identico.md`: a seção
"O caso que esta regra não cobre" e o parágrafo final hoje listam
`meu-movel-planejado` como pendente de auditoria, nomeando `sheet.ts`,
`project.ts`, `plan.ts` e `piece.ts` como candidatos ainda não auditados.
Atualizar essa passagem para registrar que `meu-movel-planejado` foi
auditado e colapsado nas cinco áreas — Projeto, Peça, Chapa, a árvore de
Plano de corte e `ThemeMode` —, e nomear as duas exceções confirmadas:

- As funções de domínio de `theme.ts` (`isThemeMode`, `resolveThemeMode`)
  não colapsam — mesmo motivo já nomeado no ADR para `Month`/`MonthEntity`
  e para as funções equivalentes do `git-dlog`/`meu-negocio-app`: lógica
  real, não cópia pura.
- `PlanInput`, em `domain/plan.ts`, não colapsa e não é apagado — é um
  terceiro tipo de exceção, diferente de `stock_applied` (campo que nunca
  deve cruzar o IPC) e de `Month`/`isThemeMode` (mapper com lógica real):
  teve par em `shared/types/plan.ts` até um ticket anterior mover a
  geração do plano para o main, e hoje só é construído dentro dele. Vale a
  pena registrar esse terceiro caso como uma frase própria no ADR, não só
  dobrar um dos dois já existentes — é um padrão que outra entidade
  colapsada, neste ou em outro app, pode repetir no futuro (um tipo que
  *foi* contrato e deixou de ser por uma decisão de produto, não por
  filtragem de campo sensível).

Não é uma decisão nova nas outras quatro áreas — só confirma o critério já
escrito com mais um caso real. Não criar ADR separado.

## Checklist

- [ ] Atualizada a passagem do ADR-0005 que citava `meu-movel-planejado`
      como pendente de auditoria — removido da lista de apps pendentes
      (a seção "O caso que esta regra não cobre" e o parágrafo final que
      nomeia `sheet.ts`/`project.ts`/`plan.ts`/`piece.ts`).
- [ ] Acrescentada a seção "Auditoria do `meu-movel-planejado`",
      registrando as cinco áreas colapsadas.
- [ ] Registrada a exceção de `theme.ts` como confirmação do critério já
      existente (mesmo papel de `isThemeMode` no `git-dlog`/
      `meu-negocio-app`).
- [ ] Registrado o caso novo do `PlanInput` como terceiro tipo de exceção,
      com frase própria explicando a diferença em relação a
      `stock_applied` e a `Month`/`isThemeMode`.
- [ ] Confirmado que `CONTEXT.md` do meu-movel-planejado não precisa de
      nenhuma mudança — colapso estrutural, vocabulário de domínio não
      muda.
