Status: open
Type: task
Blocked by: 04

# Configurações

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [ ] Migrar Empresa, Backup e Sobre para navegação interna com uma seção visível por vez e seletor compacto em espaço reduzido.
- [ ] Preservar seleção e dados digitados ao trocar seção/redimensionar; sinalizar falhas na navegação e manter recuperação por seção.
- [ ] Migrar formulário da empresa, exportação, confirmação de restauração, versão e caminho copiável do banco.
- [ ] Preservar formato de backup e contratos existentes; manter feedback e bloqueio de ações concorrentes durante operações.
- [ ] Manter tema no rodapé da lateral com identificação acessível, conforme exceção local aprovada.

## Validação enxuta

- [ ] Executar `npm run typecheck`, `npm run lint`, `npm test` e
  `npm run build -w meu-negocio-app`.
- [ ] Editar empresa e trocar seção sem perder campos; exportar/restaurar dados descartáveis e conferir resultado, registrando eventual limitação do diálogo nativo.
- [ ] Registrar em Comments resultados e limitações, atualizar Status e marcar
  somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
  ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).
Implementação não iniciada; critérios permanecem desmarcados.
