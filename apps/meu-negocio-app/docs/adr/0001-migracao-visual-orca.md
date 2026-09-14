# Migrar o Meu Negócio para a direção visual inspirada no Orca

Status: accepted

O Meu Negócio adotará Tailwind sem Preflight, componentes locais, Geist e
Lucide, substituindo MUI/Emotion conforme Q1 da [entrevista](../../../../.scratch/meu-negocio-design-orca/map.md).
Customizar MUI preservaria a base atual, mas escolhemos a nova base para a
reformulação integral, aceitando o custo de substituir controles e conferir
teclado, foco, formulários e gráficos.

A decisão é específica deste app e não cria código compartilhado. As escolhas
visuais confirmadas e a validação enxuta estão na [spec](../../../../.scratch/meu-negocio-design-orca/spec.md);
a sequência de implementação foi confirmada em Q8. O design system deve
registrar a exceção local e os tokens antes de qualquer alteração de UI.
