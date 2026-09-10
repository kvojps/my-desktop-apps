# 01: Tema Orca e navegação funcional

**What to build:** Navegar pelas três telas do Git Dlog com lateral recolhível, fonte Geist e temas claro/escuro persistidos, introduzindo a nova base visual sem interromper as telas ainda em MUI.

**Blocked by:** Nenhum (pode começar imediatamente).

**Status:** resolved

- [x] Registrar uma revisão fixa da referência Orca e documentar os tokens concretos do piloto antes de aplicá-los: superfícies neutras, bordas discretas, controles compactos e cores semânticas legíveis.
- [x] Introduzir Tailwind e componentes locais shadcn/Radix junto da base existente. Isolar efeitos de estilos globais para que as telas MUI continuem funcionais durante a transição.
- [x] Exibir lateral com ícones e nomes de Repositórios, Diretórios e Configurações, expandida por padrão e recolhível; indicar a tela ativa e permitir navegação por teclado.
- [x] Manter o alternador de tema na navegação, usando a persistência existente e restaurando a preferência ao reabrir o app.
- [x] Aplicar Geist e o novo tema à navegação; manter ambos os sistemas visuais acompanhando o modo selecionado durante a coexistência.
- [x] Atualizar as prescrições de MUI e ícones no manual para explicitar a exceção local do piloto, preservando a norma dos demais apps e a independência de código.
- [x] Verificar acesso às três telas e operações existentes após introduzir a nova base. Criar componentes apenas conforme necessários ao fluxo, sem uma refatoração ampla antecipada.
- [x] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [x] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [x] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.

## Answer

Implementado e validado nos commits `03b9286` e `5986f9f`. O piloto agora usa tokens Orca registrados em `apps/git-dlog/docs/orca-theme.md`, Geist, Tailwind v4 sem Preflight, Radix Slot, Lucide e uma lateral acessível expandida por padrão e recolhível. As três telas continuam navegáveis, com tema claro/escuro persistido pelo banco e restaurado ao reabrir.

Typecheck dos quatro apps, build do Git Dlog, lint e suíte completa passaram; a suíte terminou com 187 testes aprovados. A verificação no Electron cobriu os temas, as três rotas, viewports 960 × 640 e 1280 × 800, recolhimento, ativação por Enter, foco visível, diálogo de token e retorno de foco. A revisão de Standards encontrou zero violações documentadas; a revisão de Spec não encontrou defeitos.

Detalhes, medições de contraste e a limitação do gerenciador de janelas durante o redimensionamento estão documentados em `apps/git-dlog/docs/orca-theme.md`.
