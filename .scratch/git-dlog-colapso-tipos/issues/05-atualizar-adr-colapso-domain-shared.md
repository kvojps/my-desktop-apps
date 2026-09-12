Status: done

# Atualizar ADR-0005 com a auditoria do git-dlog

Blocked by: 01, 02, 03, 04 (só faz sentido depois de todo o colapso técnico
estar concluído e verificado)

## O que fazer

Editar `docs/adr/0005-colapso-domain-shared-quando-identico.md`: a seção
final hoje lista `git-dlog` (junto com `meu-movel-planejado`) como "ainda
não auditado". Atualizar essa passagem para registrar que `git-dlog` foi
auditado e colapsado nas quatro áreas (Pull Request, Repositório,
Diretório-base, `ThemeMode`), e nomear a exceção confirmada:
`EncryptedGithubTokenEntity` e as funções de domínio de `settings.ts`
(`isThemeModeEntity`, `resolveThemeMode`) não colapsam — pelos mesmos
motivos já nomeados no ADR para `stock_applied` (campo interno que não deve
cruzar IPC) e para `Month`/`MonthEntity` (lógica real, não cópia pura).

Não é uma decisão nova — só confirma o critério já escrito com um caso
real. Não criar ADR separado.

## Checklist

- [x] Atualizada a passagem final do ADR-0005 que citava `git-dlog` como
      pendente de auditoria — removido da lista de apps pendentes, e
      acrescentada a seção "Auditoria do `git-dlog`" registrando as quatro
      áreas colapsadas.
- [x] Registrada a exceção de `settings.ts` (token + funções de domínio)
      como confirmação do critério existente, não como decisão nova.
- [x] Confirmado que `CONTEXT.md` do git-dlog não precisa de nenhuma
      mudança — colapso estrutural, vocabulário de domínio não muda.
