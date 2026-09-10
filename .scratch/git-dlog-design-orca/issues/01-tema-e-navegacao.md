# 01: Tema Orca e navegação funcional

**What to build:** Navegar pelas três telas do Git Dlog com lateral recolhível, fonte Geist e temas claro/escuro persistidos, introduzindo a nova base visual sem interromper as telas ainda em MUI.

**Blocked by:** Nenhum (pode começar imediatamente).

**Status:** ready-for-agent

- [ ] Registrar uma revisão fixa da referência Orca e documentar os tokens concretos do piloto antes de aplicá-los: superfícies neutras, bordas discretas, controles compactos e cores semânticas legíveis.
- [ ] Introduzir Tailwind e componentes locais shadcn/Radix junto da base existente. Isolar efeitos de estilos globais para que as telas MUI continuem funcionais durante a transição.
- [ ] Exibir lateral com ícones e nomes de Repositórios, Diretórios e Configurações, expandida por padrão e recolhível; indicar a tela ativa e permitir navegação por teclado.
- [ ] Manter o alternador de tema na navegação, usando a persistência existente e restaurando a preferência ao reabrir o app.
- [ ] Aplicar Geist e o novo tema à navegação; manter ambos os sistemas visuais acompanhando o modo selecionado durante a coexistência.
- [ ] Atualizar as prescrições de MUI e ícones no manual para explicitar a exceção local do piloto, preservando a norma dos demais apps e a independência de código.
- [ ] Verificar acesso às três telas e operações existentes após introduzir a nova base. Criar componentes apenas conforme necessários ao fluxo, sem uma refatoração ampla antecipada.
- [ ] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [ ] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [ ] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.

