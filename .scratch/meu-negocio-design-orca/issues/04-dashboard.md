Status: open
Type: task
Blocked by: 03

# Dashboard e gráficos

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [ ] Migrar os três blocos e todos os indicadores inventariados na spec, com indicadores compactos nos cabeçalhos.
- [ ] Oferecer Gráfico/Tabela por bloco com os mesmos dados, incluindo contagens hoje restritas às dicas; dar nomes acessíveis aos gráficos.
- [ ] Manter filtro de período, ranking de cinco produtos e posição de hoje das contas a receber com quatro faixas, inclusive zeradas.
- [ ] Centralizar cores e medidas de gráficos no tema local; medir contraste nas superfícies reais e respeitar movimento reduzido nas séries Recharts.
- [ ] Adaptar grade ao conteúdo e altura disponível; skeleton reserva a caixa real e espaço insuficiente permite rolagem sem comprimir informação.
- [ ] Verificável por máquina: `grep -rl "@mui" apps/meu-negocio-app/src/renderer/src/pages/dashboard apps/meu-negocio-app/src/renderer/src/theme/chartTheme.ts` retorna vazio; citar o resultado em Comments antes de marcar os critérios acima.

## Validação enxuta

- [ ] Executar `npm run typecheck`, `npm run lint`, `npm test` e
      `npm run build -w meu-negocio-app`.
- [ ] Comparar Gráfico/Tabela em um período com vendas; conferir conta antiga fora do período ainda presente e as quatro faixas. Conferir teclado e movimento reduzido.
- [ ] Registrar em Comments resultados e limitações, atualizar Status e marcar
      somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
      ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).
Implementação não iniciada; critérios permanecem desmarcados.
