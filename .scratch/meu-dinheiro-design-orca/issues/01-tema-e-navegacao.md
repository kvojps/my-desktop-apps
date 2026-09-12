Status: ready-for-agent
Type: task
Blocked by: Nenhum

# 01: Tema Orca, componentes básicos e navegação

## What to build

Estabelecer a base visual local e a lateral recolhível, mantendo todas as rotas funcionais durante a coexistência com MUI.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

theme/, components/Layout.tsx, components/ e styles.css no renderer; src/main/index.ts e src/main/domain/theme.ts para a janela.

## Critérios de aceite

- [ ] Registrar apps/meu-dinheiro-app/docs/orca-theme.md antes de mudar UI, com revisão fixa da referência, origem dos tokens, valores por modo, Geist, raios, espaçamento, dimensões e critérios de adaptação por largura de conteúdo.
- [ ] Conferir a exceção local no design system e README §2.4; documentar qualquer valor ou regra visual local antes de aplicá-lo, mantendo os demais apps sob suas normas.
- [ ] Adicionar Tailwind sem Preflight, Geist empacotada e Lucide locais; controlar estilos globais durante coexistência e evitar imports entre apps.
- [ ] Implementar lateral com Visão Geral, Histórico e Configurações, nomes e ícones por padrão, recolhimento e alternância de tema no rodapé; identificar destino ativo por mais de cor e disponibilizar nomes acessíveis quando recolhida.
- [ ] Manter a preferência de tema no banco, modo inicial antes do primeiro render e pintura da janela/moldura antes da abertura e após alternância, inclusive ao redimensionar e reabrir.
- [ ] Preparar componentes básicos de uso imediato e adaptar notificações, erro, vazio, carregamento e rota inexistente; migrar componentes específicos nas issues consumidoras, sem criar biblioteca especulativa.
- [ ] Garantir que as telas ainda MUI continuem utilizáveis e coerentes nos dois temas; preservar fachada API, broadcast e arquitetura.
- [ ] Medir contraste sobre superfícies novas, incluindo foco, rótulos, hover e seleção; registrar tokens de gráficos a detalhar na issue 04.
- [ ] Verificar navegação entre todas as rotas, recolhimento, tema persistido, teclado e ausência de interferência nas telas ainda não migradas.
- [ ] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [ ] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [ ] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação ainda não iniciada.
