Status: done

# 01: Documentar critério de colapso Domain + Shared

**What to build:** Registrar, em documentação normativa, quando é permitido
colapsar `XEntity` (domain) e `X` (shared/types) num tipo só — e quando não é.
Sem mudança de código.

**Blocked by:** Nenhum (pode começar imediatamente)

- [x] `README.md` §2.2 passa a dizer que uma entidade só precisa de arquivo em
      `main/domain/` quando tem campo que não deve atravessar o IPC, ou
      função pura de domínio; puro contêiner de dados idêntico ao contrato
      mora só em `shared/types/`.
- [x] `README.md` §2.5 ("Nomes na fronteira") deixa de descrever a trava
      `entity → response` como incondicional — passa a valer só quando há
      campo a filtrar. A regra de `row → entity` (`rowToX`) permanece sem
      alteração.
- [x] Novo `docs/adr/0005-colapso-domain-shared-quando-identico.md`, no
      formato dos ADRs existentes (problema, decisão, alternativas
      consideradas, consequências).
- [x] O ADR referencia `docs/adr/0002-camadas-do-processo-principal.md`
      (seção "Nenhuma camada é pulável") e nomeia o risco aceito: perda do
      aviso automático do `tsc` quando um campo interno futuro precisar
      parar de atravessar o IPC numa entidade colapsada.
- [x] O ADR cita o caso `stock_applied` (`OrderItem` do `meu-negocio-app`)
      como o cenário que esta regra não cobre, explicando por que aquele app
      fica fora do piloto.
