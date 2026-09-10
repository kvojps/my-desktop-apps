# Redesign do Git Dlog inspirado no Orca

Decisões das rodadas de planejamento consolidadas e pontos de teste confirmados.
A especificação foi publicada no tracker local como `ready-for-agent`, em
`.scratch/git-dlog-design-orca/spec.md`, a partir da raiz do repositório.

## Direção confirmada

- A referência é o aplicativo desktop Orca (https://www.onorca.dev/), com
  proximidade em cores, tipografia, espaçamentos, bordas e controles. A composição
  será adaptada às tarefas do Git Dlog.
- A navegação e a disposição das informações podem ser reorganizadas quando isso
  melhorar o uso. As funcionalidades atuais devem ser preservadas.
- O Git Dlog será o piloto de uma identidade visual para os demais apps.
  As convenções reutilizáveis serão documentadas após validação no piloto;
  eventual extração de componentes compartilhados fica para decisão posterior.
- Repositórios terá lista compacta com severidade e pendências visíveis e painel
  de detalhes do repositório selecionado.
- A migração cobrirá todas as telas: Repositórios, Diretórios e Configurações,
  incluindo a navegação comum.
- Os temas claro e escuro serão avaliados desde a primeira etapa.
- O volume habitual informado é de aproximadamente 10 repositórios. O tamanho
  habitual da janela não foi informado.
- Navegação lateral recolhível com ícones e nomes, expandida por padrão.
- Cada item da lista mostra nome, branch atual, severidade e resumo das pendências
  com contagens. Nomes repetidos são distinguidos por trecho do caminho. Caminho
  completo, commits, branches adicionais e PRs ficam no painel de detalhes.
- Ordem: risco, atenção e limpo; alfabética dentro de cada grupo. Atualizações
  preservam o repositório selecionado mesmo quando ele muda de posição.
- Lista e detalhes aparecem juntos quando houver espaço confortável. Em janelas
  estreitas, selecionar abre os detalhes; voltar preserva filtro e posição da lista.
- O Git Dlog será uma exceção temporária documentada durante o piloto. Os demais
  apps seguem a norma atual até a validação; depois, as convenções aprovadas serão
  incorporadas à norma comum e a migração dos demais será planejada.
- MUI será substituído gradualmente por Tailwind e componentes locais
  shadcn/Radix. A migração inclui revisão de foco, teclado, diálogos e notificações.
- A base visual será neutra, com fonte Geist, controles compactos e bordas
  discretas. Cores fortes ficam reservadas para severidade e ações relevantes;
  texto e ícones também identificam risco, atenção e limpo.
- Detalhes em página rolável: resumo e pendências, PRs, branches e último commit.
  Seções extensas podem recolher; problemas ficam visíveis por padrão.
- Diretórios mantém lista compacta de caminhos e ações de adicionar e remover.
  Configurações se organiza em integrações de PRs, configuração do token e Sobre.
  O alternador de tema continua na navegação.
- A migração será incremental no aplicativo real, sem protótipo separado.
  O usuário prefere avaliar as mudanças conforme entram e recorrer a rollback
  caso necessário. Todas as telas continuam no escopo final.
- Critérios de sucesso: proximidade visual com Orca; identificar repositórios que
  precisam de atenção e os motivos; acessar detalhes sem perder contexto;
  preservar funcionalidades, navegação por teclado e legibilidade nos dois temas
  e na janela mínima atual.

## Contexto e restrições encontradas

- O propósito definido em `../CONTEXT.md` é mostrar, de uma vez só, o que precisa
  de atenção nos repositórios. Severidade, Atualizar e Buscar do remoto têm
  significados distintos que a apresentação precisa preservar.
- `../../../docs/design-system.md` é hoje a norma visual comum e considera
  divergências locais de paleta, tipografia, raios e superfícies como bugs.
  A exceção temporária do piloto está documentada na abertura dessa norma.
- `../../../CONTEXT-MAP.md` estabelece independência de código entre apps.
  Identidade visual comum não implica aprovação de um pacote compartilhado.
- A interface atual tem telas de Repositórios, Diretórios e Configurações,
  temas claro e escuro e janela mínima de 960 × 640.

## Sequência de implementação

Cada etapa será implementada diretamente no app, em incrementos revisáveis,
contemplando claro e escuro. Não haverá protótipo separado.

1. **Tema e navegação:** registrar os valores concretos do tema do piloto a partir
   da referência Orca; introduzir Tailwind e componentes locais; aplicar Geist,
   superfícies neutras e lateral recolhível. Durante a coexistência, limitar estilos
   globais para não quebrar telas ainda em MUI.
2. **Repositórios:** implementar lista e painel, resumos, ordenação e adaptação à
   largura. Preservar busca, filtros, contagens, seleção e contexto ao voltar.
3. **Diretórios:** migrar lista, seletor nativo e confirmação de remoção.
4. **Configurações:** migrar integrações, token e Sobre, com seus diálogos e feedback.
5. **Revisão final:** verificar cobertura funcional e visual; retirar MUI, Emotion
   e ícones antigos quando não houver consumidores; consolidar convenções validadas.

Dimensões exatas, pontos de mudança de layout e valores de tokens serão definidos
e registrados durante a primeira etapa e ajustados no uso real, dentro da direção
aprovada. A referência deve ter sua revisão registrada ao extrair os valores.

## Verificação e funcionalidades a preservar

- Validar cada etapa com typecheck, build e verificações direcionadas aos fluxos
  alterados; conferir visualmente os dois temas, janela mínima de 960 × 640 e uma
  janela maior. Verificar foco visível, teclado, diálogos e legibilidade.
- Preservar a distinção entre Atualizar (leitura local) e Buscar do remoto (rede),
  última leitura, progresso Git/PRs, erros e tentativa novamente.
- Preservar os filtros atuais, links de remoto/site/PR, sincronia e contagens,
  working tree, stashes, branches, último commit e informações de revisão/CI dos PRs.
- Distinguir carregamento, nenhum diretório, nenhum repositório encontrado e
  nenhum resultado dos filtros. Exibir erro recuperável quando aplicável.
- Preservar adição por seletor nativo e confirmação de remoção de diretório-base,
  deixando explícito que remover o cadastro não apaga arquivos do disco.
- Preservar redetecção de provedores, disponibilidade das integrações, validação,
  salvamento e remoção do token e os respectivos estados de sucesso e erro.
- A migração cobre apresentação e navegação das funcionalidades existentes.
  Operações Git adicionais não fazem parte deste plano.
- A extração de código comum e a ordem de migração dos outros apps serão decisões
  posteriores à validação do piloto.

## Referências técnicas consultadas

- [Tema do Orca](https://github.com/stablyai/orca/blob/main/src/renderer/src/assets/main.css):
  Tailwind, fonte Geist e tokens semânticos para temas claro e escuro.
- [Botão do Orca](https://github.com/stablyai/orca/blob/main/src/renderer/src/components/ui/button.tsx):
  componente local com Radix Slot, variantes e classes Tailwind.
- [Configuração de componentes](https://github.com/stablyai/orca/blob/main/components.json):
  convenção shadcn, adotada como base para a migração.

O glossário permanece dedicado a conceitos do domínio. Este plano não redefine
seus termos nem substitui a norma visual vigente.
