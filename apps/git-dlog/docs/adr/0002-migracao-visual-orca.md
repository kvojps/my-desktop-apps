# Migrar a interface para Tailwind e componentes locais shadcn/Radix

O redesign das três telas do Git Dlog adota a linguagem visual do Orca e substitui
gradualmente MUI por Tailwind e componentes locais shadcn/Radix. Manter MUI e
customizá-lo também permitiria reproduzir a aparência, mas escolhemos uma base
próxima da referência para a reformulação, aceitando o custo de migrar controles,
diálogos, notificações e revisar seus comportamentos de foco e teclado.

A migração ocorre diretamente no app, em etapas, com claro e escuro desde o
início. MUI pode coexistir temporariamente com a nova base até não haver
consumidores. A decisão é local ao Git Dlog e não introduz código compartilhado
entre apps. O escopo e a sequência estão no [plano](../orca-design-plan.md).

A regra de contraste do [ADR-0001](0001-status-chip-warning-sempre-filled.md)
continua aplicável: a troca de biblioteca não autoriza usar o âmbar atual como
texto sem contraste adequado. Novos tokens precisam ser verificados nas
superfícies dos dois temas.
