Status: ready-for-agent

# Git Dlog — migração incremental do design inspirado no Orca

## Problem Statement

O usuário acompanha aproximadamente 10 repositórios e quer aproximar o Git Dlog
da aparência do aplicativo desktop Orca. A interface atual usa MUI, uma barra de
ícones e cartões de alturas variáveis que misturam visão geral e detalhes. O
redesign precisa facilitar identificar quais repositórios precisam de atenção,
entender os motivos e investigar cada um sem perder o contexto da lista.

O Git Dlog será o piloto de uma identidade visual para os demais apps. A norma
visual comum atual exige uniformidade, portanto a transição precisa ser explícita
e documentada para não transformar o piloto em uma divergência acidental.

## Solution

Migrar diretamente o aplicativo real, em etapas revisáveis, para uma linguagem
visual próxima do Orca: base neutra, fonte Geist, bordas discretas, controles
compactos e navegação lateral recolhível com nomes e ícones. Manter claro e escuro
desde a primeira etapa.

Na tela de Repositórios, apresentar uma lista compacta com severidade e pendências,
acompanhada dos detalhes do repositório selecionado. Em janelas estreitas, alternar
entre lista e detalhes preservando o contexto ao voltar. Migrar também Diretórios
e Configurações, preservando as funcionalidades existentes. Não haverá protótipo
separado; o usuário avaliará o resultado no uso real a cada incremento.

## User Stories

1. Como usuário do Git Dlog, quero uma aparência próxima do Orca, para ter a linguagem visual que prefiro em minha ferramenta de acompanhamento.
2. Como usuário, quero cores neutras e controles compactos, para ler informações sem excesso de decoração.
3. Como usuário, quero temas claro e escuro em todas as telas, para usar o app em diferentes condições de iluminação.
4. Como usuário, quero alternar o tema pela navegação e manter minha preferência ao reabrir o app, para não repetir essa configuração.
5. Como usuário, quero uma lateral com nomes e ícones, para reconhecer Repositórios, Diretórios e Configurações.
6. Como usuário, quero recolher a lateral, para ganhar espaço quando necessário.
7. Como usuário que acompanha cerca de 10 repositórios, quero uma lista compacta, para comparar suas pendências rapidamente.
8. Como usuário, quero ver nome, branch atual, severidade e contagens de pendências em cada item, para decidir o que investigar.
9. Como usuário, quero distinguir repositórios com nomes iguais por um trecho do caminho, para selecionar o correto.
10. Como usuário, quero repositórios ordenados por risco, atenção e limpo, com ordem alfabética dentro de cada grupo, para encontrar primeiro o que merece atenção.
11. Como usuário, quero que o repositório selecionado continue selecionado após uma atualização, para acompanhar seu estado mesmo quando ele muda de posição.
12. Como usuário, quero buscar por nome ou caminho, para localizar um repositório.
13. Como usuário, quero preservar os filtros atuais e suas contagens, para restringir a lista ao tipo de pendência que procuro.
14. Como usuário, quero limpar busca e filtros, para recuperar a visão geral.
15. Como usuário, quero lista e detalhes lado a lado quando houver espaço, para investigar sem perder a visão dos demais repositórios.
16. Como usuário em janela estreita, quero abrir detalhes e voltar à mesma posição e filtro da lista, para navegar sem recomeçar minha busca.
17. Como usuário, quero resumo e pendências no início dos detalhes, para entender primeiro o que exige atenção.
18. Como usuário, quero consultar PRs, branches e último commit em seções roláveis, para aprofundar a investigação.
19. Como usuário, quero recolher seções extensas mantendo problemas visíveis por padrão, para reduzir informação sem ocultar pendências relevantes.
20. Como usuário, quero consultar working tree, conflitos, staged, modificados, não rastreados e stashes, para identificar trabalho local.
21. Como usuário, quero consultar sincronia, upstream e contagens ahead/behind, incluindo HEAD detached e ausência de commits, para entender a situação da branch atual.
22. Como usuário, quero identificar branches nunca publicadas, branches gone e branches com PR mergeado, para reconhecer trabalho local e candidatas à limpeza.
23. Como usuário, quero consultar contagens de branches e seu agrupamento por commit, para entender as relações já mostradas pelo app.
24. Como usuário, quero consultar hash, assunto, autor e idade do último commit, para reconhecer o trabalho recente.
25. Como usuário, quero consultar título, número, rascunho, revisão, CI e atualização dos PRs, para entender quais pedem ação.
26. Como usuário, quero distinguir o PR da branch atual e consultar origem e destino, para relacionar o PR ao meu contexto.
27. Como usuário, quero abrir remoto, site publicado e PRs nos links existentes, para continuar a investigação fora do app.
28. Como usuário, quero manter Atualizar como leitura local e Buscar do remoto como ação manual de rede, para saber o alcance de cada operação.
29. Como usuário, quero ver última leitura, último fetch e progresso das fases Git e PRs, para saber a atualidade dos dados e o andamento da operação.
30. Como usuário, quero distinguir carregamento, ausência de diretórios-base, nenhum repositório encontrado e nenhum resultado dos filtros, para saber como prosseguir.
31. Como usuário, quero mensagens de erro e tentativa novamente, para recuperar o uso após falhas.
32. Como usuário, quero cadastrar um diretório-base pelo seletor nativo, para escolher onde o app procura repositórios.
33. Como usuário, quero consultar e remover diretórios-base com confirmação de que arquivos não serão apagados, para controlar o escopo da varredura.
34. Como usuário, quero consultar disponibilidade e detalhes das integrações de PRs e redetectá-las, para usar minhas ferramentas autenticadas.
35. Como usuário, quero configurar, validar, salvar e remover um token do GitHub com feedback, para usar a integração quando necessário.
36. Como usuário, quero manter o campo de token protegido e os links e orientações existentes, para configurar a integração com clareza.
37. Como usuário, quero consultar aplicativo, versão e finalidade em Sobre, para reconhecer a instalação em uso.
38. Como usuário de teclado, quero navegar pelos controles e diálogos com foco visível, para operar todas as telas sem depender do mouse.
39. Como usuário, quero severidade indicada por texto e ícones além de cores, para reconhecer risco, atenção e limpo nos dois temas.
40. Como usuário, quero legibilidade e navegação na janela mínima de 960 × 640 e em janelas maiores, para usar o app no espaço disponível.
41. Como usuário, quero receber a migração em etapas funcionais, para avaliar as mudanças no app real e poder reverter incrementos quando necessário.

## Implementation Decisions

- Substituir gradualmente MUI e Emotion por Tailwind e componentes locais shadcn/Radix. A troca foi escolhida pela proximidade com a base da referência, aceitando o trabalho de migrar controles e revisar comportamentos; reproduzir a aparência em MUI foi considerado possível.
- Adotar Geist, superfícies neutras, bordas discretas e controles compactos. Reservar cores fortes para severidade e ações relevantes, com identificação textual e por ícones.
- Registrar a revisão da referência Orca consultada ao extrair tokens. Documentar valores concretos do tema antes de aplicá-los. Dimensões e pontos de mudança de layout serão ajustados durante a implementação e uso real dentro da direção aprovada.
- Migrar nesta ordem: tema e navegação; Repositórios; Diretórios; Configurações; revisão final. Cada etapa contempla claro e escuro e permanece revisável.
- Permitir coexistência temporária com MUI, controlando estilos globais para evitar interferência nas telas ainda não migradas. Retirar dependências e ícones antigos quando não houver consumidores.
- Modificar tema, navegação, componentes de apresentação comuns e as três telas. Preservar a organização horizontal do renderer e vertical dentro de cada tela, exportações nomeadas e ausência de barrels; adaptar componentes incorporados às convenções do projeto.
- Preservar a fachada de API existente como acesso único ao preload, os contratos IPC, a invalidação por broadcast, a persistência do tema, o domínio e o armazenamento. Não há alteração de schema ou novo contrato de backend previsto.
- Lateral recolhível com nomes visíveis por padrão. Repositórios usa lista e painel; em larguras menores, selecionar abre detalhes e voltar preserva filtro e posição.
- Ordenar por severidade e alfabeticamente dentro do grupo. Preservar seleção por identidade do repositório após atualização, independentemente da posição.
- Preservar filtros de todos, só nesta máquina, fora de sincronia, PR pedindo ação, com PR aberto, sincronizados e com erro, e contagens relativas à busca atual.
- Detalhes em uma tela rolável: resumo e pendências, PRs, branches e último commit. Seções extensas recolhíveis; problemas visíveis por padrão.
- Diretórios mantém cadastro e remoção de diretórios-base. Configurações organiza integrações de PRs, token e Sobre. Alternância de tema permanece na navegação.
- Preservar estados de operações em andamento, prevenção de submissões duplicadas, sucesso, erro recuperável, confirmações e mensagens de ausência de integração.
- Implementar um estado final explícito para nenhum repositório encontrado após varredura concluída, sem manter carregamento indefinido.
- A exceção do piloto na norma visual comum está aprovada. Atualizar também prescrições normativas de MUI e ícones no manual para explicitar o alcance local da migração. Demais apps continuam sob a norma vigente.
- Respeitar o ADR de contraste dos indicadores de atenção: a troca de biblioteca não torna o âmbar atual adequado como texto. Verificar qualquer novo par de cores nas superfícies reais dos dois temas.
- Após validar o piloto, incorporar as convenções aprovadas à norma comum; código compartilhado e migração dos demais apps exigem decisão posterior.

## Testing Decisions

- Ponto principal de verificação confirmado pelo usuário: os fluxos completos na interface real do Electron, atravessando as telas e a fachada de API existente. Não criar uma nova fronteira no domínio apenas para este redesign.
- Manter testes automatizados na suíte de lógica pura somente para regras de comportamento alteradas. Não introduzir nesta migração infraestrutura de testes de componentes ou de ponta a ponta.
- Bons testes verificam comportamentos observáveis: seleção preservada após reordenação, busca e filtros, retorno à lista, resultado de ações e feedback. Não testar classes Tailwind, árvore interna de componentes ou cópias dos valores de estilos.
- Verificar tema e navegação, Repositórios, Diretórios e Configurações nos dois temas, na janela mínima de 960 × 640 e em janela maior. Conferir foco, navegação por teclado, abertura e fechamento de diálogos e retorno de foco.
- Usar cenários com cerca de 10 repositórios: nomes repetidos; risco, atenção e limpo; branches nunca publicadas e gone; PR com falha de CI; repositório sem remoto; paths e títulos longos. Conferir todos os estados vazios, carregamento e falhas recuperáveis.
- Verificar preservação da leitura local e do fetch manual, progresso Git/PRs, links externos, integração indisponível e token válido/inválido, sem exibir credenciais nos resultados da verificação.
- Executar typecheck, build e checagens exigidas pelo projeto a cada etapa pertinente. A revisão final confirma ausência de consumidores de MUI antes de retirar dependências.
- O precedente automatizado é a suíte Vitest de lógica pura, incluindo testes de classificação de canais IPC e invalidação. Essa suíte não exercita componentes, DOM ou Electron. Acrescentar testes nela somente quando regras puras de comportamento forem alteradas, usando interfaces existentes e sem testar detalhes de renderização.
- A comparação visual deve usar a referência registrada do Orca e capturas das telas do piloto; proximidade visual não implica identidade pixel a pixel, pois a composição atende às tarefas do Git Dlog.

## Out of Scope

- Protótipo separado, mockup navegável ou etapa de aprovação de protótipo.
- Migração dos outros apps e extração de pacote compartilhado.
- Novas operações Git, como commit, push, pull ou exclusão de branches.
- Recursos do Orca sem correspondência no Git Dlog, como agentes, terminais e workspaces.
- Novos provedores de PR, alterações no armazenamento de credenciais ou mudanças nos contratos de backend.
- Novas opções de varredura, exclusões, profundidade ou preferências sem funcionalidade atual correspondente.
- Redefinição da severidade ou unificação das ações Atualizar e Buscar do remoto.
- Cópia de marca, nome ou identidade de produto do Orca.

## Further Notes

A especificação sintetiza as decisões confirmadas na conversa. A preferência do
usuário é migrar no app real e avaliar incrementos, recorrendo a rollback quando
necessário. Isso não autoriza descartar alterações alheias ou executar reversões
destrutivas automaticamente.

Referências públicas: [Orca](https://www.onorca.dev/),
[tema do renderer](https://github.com/stablyai/orca/blob/main/src/renderer/src/assets/main.css),
[controle de botão](https://github.com/stablyai/orca/blob/main/src/renderer/src/components/ui/button.tsx)
e [configuração shadcn](https://github.com/stablyai/orca/blob/main/components.json).
Esses links acompanham a branch principal; registrar uma revisão fixa na extração
dos tokens evita que a implementação dependa de uma referência mutável.

O glossário de domínio permanece válido. O ADR da migração visual e a exceção na
norma comum já registram as decisões aprovadas; este trabalho não introduz novos
termos de domínio.
