Status: resolved
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

- [x] Registrar apps/meu-dinheiro-app/docs/orca-theme.md antes de mudar UI, com revisão fixa da referência, origem dos tokens, valores por modo, Geist, raios, espaçamento, dimensões e critérios de adaptação por largura de conteúdo.
- [x] Conferir a exceção local no design system e README §2.4; documentar qualquer valor ou regra visual local antes de aplicá-lo, mantendo os demais apps sob suas normas.
- [x] Adicionar Tailwind sem Preflight, Geist empacotada e Lucide locais; controlar estilos globais durante coexistência e evitar imports entre apps.
- [x] Implementar lateral com Visão Geral, Histórico e Configurações, nomes e ícones por padrão, recolhimento e alternância de tema no rodapé; identificar destino ativo por mais de cor e disponibilizar nomes acessíveis quando recolhida.
- [x] Manter a preferência de tema no banco, modo inicial antes do primeiro render e pintura da janela/moldura antes da abertura e após alternância, inclusive ao redimensionar e reabrir.
- [x] Preparar componentes básicos de uso imediato e adaptar notificações, erro, vazio, carregamento e rota inexistente; migrar componentes específicos nas issues consumidoras, sem criar biblioteca especulativa.
- [x] Garantir que as telas ainda MUI continuem utilizáveis e coerentes nos dois temas; preservar fachada API, broadcast e arquitetura.
- [x] Medir contraste sobre superfícies novas, incluindo foco, rótulos, hover e seleção; registrar tokens de gráficos a detalhar na issue 04.
- [x] Verificar navegação entre todas as rotas, recolhimento, tema persistido, teclado e ausência de interferência nas telas ainda não migradas.
- [x] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [x] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [x] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Implementação concluída em 2026-09-12. Tokens registrados antes do código em
[orca-theme.md](../../../apps/meu-dinheiro-app/docs/orca-theme.md), com revisão
fixa do Orca, origem e adaptações locais. Tailwind sem Preflight e prefixo `ui`;
Geist e Lucide empacotados. MUI permanece nas telas consumidoras com seus tokens
normativos; não houve mudança de domínio, banco, API, IPC ou broadcast.

Validação:

- `npm run typecheck`, `npm run lint`, `npm test` e
  `npm run build -w meu-dinheiro-app` aprovados. São 238 testes em 24 arquivos;
  lint com zero erros e dois avisos de hooks preexistentes no Meu Negócio.
- Mudanças de apresentação e integração React/Electron, sem alteração de regra
  pura; nenhum teste artificial de CSS/tokens ou infraestrutura E2E foi criado.
- Electron real com perfil isolado em `/tmp/dinheiro-orca-profile`: cinco rotas
  (Visão Geral, Histórico, Configurações, Mês e desconhecida), dois modos, dois
  viewports e lateral aberta/recolhida: 40 combinações sem overflow horizontal.
  [Relatório da matriz](../evidence/01/report.json).
- Tab/Shift+Tab, Enter e Espaço operam links, tema e recolhimento; foco de 2px
  visível nos dois modos, nomes acessíveis na lateral recolhida. Tema restaurado
  ao reabrir, com fundo nativo e `nativeTheme.themeSource` correspondentes.
- Formulário MUI de conta: foco inicial, contenção de foco, Escape, retorno ao
  acionador e submissão por Enter conferidos. Três contas criadas apenas na base
  de teste; notificações com pausa sob foco, Escape fora do aviso, fila e timer
  de 4s passaram. [Relatório dos estados](../evidence/01/states.json).
- Falha de leitura simulada apenas no processo de validação: ErrorState local
  em claro/escuro, Tentar novamente e acesso a Configurações apesar da falha.
  [Relatório de erro](../evidence/01/states-error.json).
- Contraste WCAG nas superfícies novas: texto secundário mínimo 5,27:1;
  foco mínimo 4,16:1; ícone de erro sobre paper mínimo 6,57:1;
  botão primário 18,97:1. Medições completas nos tokens locais.

Capturas inspecionadas:
[Configurações clara, 960 aberta](../evidence/01/light-960-open-settings.png),
[Visão Geral escura, 960 aberta](../evidence/01/dark-960-open-dashboard.png),
[rota inexistente](../evidence/01/dark-960-open-missing.png),
[Configurações escura, 1280 recolhida](../evidence/01/dark-1280-closed-settings.png),
[erro](../evidence/01/error-dark.png) e
[notificação](../evidence/01/notification-dark.png).

Limitações: o gerenciador de janelas impôs 1004 × 684 ao solicitar janela externa
960 × 640. O viewport 960 × 640 foi aplicado via DevTools do Electron; 1280 × 800
foi aplicado à janela normalmente. A aparência nativa da moldura no Windows
não foi conferida; suas propriedades e fundo foram. Execução com `--no-sandbox`
pelo helper SUID do ambiente, sem mudança no app distribuído. Fluxos financeiros
com dados extensos, arquivos e backup ficam para as issues consumidoras.
Skeletons específicos dos cards e tabelas ainda MUI preservam suas dimensões;
esta etapa migrou os blocos de carregamento das telas. A origem e restauração
completa da consulta do Mês continuam nas issues 02–04.

Revisão em dois agentes conforme `code-review`, base
`7c331e90fdd7294c75451e7193a97586bcec9eb2`:

- Standards: um achado, Escape limitado ao foco na notificação. Corrigido com
  listener no documento que respeita eventos consumidos; nova revisão confirmou.
- Spec: zero achados no escopo da issue 01.

## Answer

Base visual local, navegação recolhível, estados transversais e pintura nativa
implementados e validados com as limitações acima. Issue 02 desbloqueada.
