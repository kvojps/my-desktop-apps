Status: open
Type: task
Blocked by: 05

# Retirada de MUI e fechamento

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [ ] Confirmar ausência de consumidores antes de remover MUI, Emotion, Material Icons e Inter do app; atualizar lockfile e avisos de terceiros pelo gerador.
- [ ] Verificável por máquina: `grep -rl "@mui\|@emotion\|@fontsource/inter" apps/meu-negocio-app/src apps/meu-negocio-app/package.json` retorna vazio; citar o resultado em Comments antes de marcar o critério acima.
- [ ] Declarar na base local os estilos necessários que vinham do CssBaseline, incluindo caixa, fonte, números tabulares, foco de documento e movimento reduzido.
- [ ] Alinhar README do app ao Dashboard atual, bloqueio por estoque insuficiente e Total já pago; atualizar documentação normativa e tokens para o estado efetivamente implementado.
- [ ] Conferência cruzada dos tokens: a tabela de `docs/orca-theme.md`, `getThemeVariables` em `theme/index.ts` e `BACKGROUND` em `main/infra/gateways/system/themeMode.ts` têm os mesmos valores por modo. Só então a seção "Transição em andamento: Meu Negócio" do design system passa a "implementada". Foi a falta desta conferência que deixou a paleta MUI passar como Orca na issue 01.
- [ ] Tipografia na escala documentada em `docs/orca-theme.md` (12/18, 14/20, 16/24, 20/28, 24/32; pesos 400/500/600): verificável por `grep -n "font-size" apps/meu-negocio-app/src/renderer/src/styles.css` sem valor fora da lista e sem `fontSize`/`variant` de MUI nas telas migradas.
- [ ] Dicas alcançáveis pelo teclado: as telas migradas usam `title` nativo (cabeçalho, `StatCard`, período personalizado) e a dica por CSS da lateral recolhida; `title` não chega ao teclado. Adotar um `Tooltip` local em portal, visível no foco além do hover, como pendência herdada da issue 02 (o Meu Dinheiro resolveu o mesmo ponto na etapa 03 dele).
- [ ] Fazer revisão final dirigida das cinco telas em claro/escuro, janela mínima, lateral aberta/recolhida e teclado nos componentes afetados pela retirada. Esta passagem cobre os itens manuais que as issues 01, 02 e 03 deixaram desmarcados (navegação/tema/redimensionamento; criar e editar produto pelo teclado; concluir/reabrir pedido, recusa por estoque e Total já pago de R$ 100 para R$ 150 com dados descartáveis). Ao executá-la, marcar aqueles itens nas issues de origem.
- [ ] Atualizar status e checklists das issues executadas, spec e mapa; registrar limitações reais sem transformar capturas ou comparações extensas em requisito.

## Validação enxuta

- [ ] Executar `npm run typecheck`, `npm run lint`, `npm test` e
      `npm run build -w meu-negocio-app`.
- [ ] Rodar checks e build do app; percorrer navegação e superfícies após retirada da base antiga. Repetir outros fluxos apenas se houver mudança ou risco concreto.
- [ ] Registrar em Comments resultados e limitações, atualizar Status e marcar
      somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
      ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).
Implementação não iniciada; critérios permanecem desmarcados.
