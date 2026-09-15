Status: resolved
Type: task
Blocked by: 04

# Configurações

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [x] Migrar Empresa, Backup e Sobre para navegação interna com uma seção visível por vez e seletor compacto em espaço reduzido.
- [x] Preservar seleção e dados digitados ao trocar seção/redimensionar; sinalizar falhas na navegação e manter recuperação por seção.
- [x] Migrar formulário da empresa, exportação, confirmação de restauração, versão e caminho copiável do banco.
- [x] Preservar formato de backup e contratos existentes; manter feedback e bloqueio de ações concorrentes durante operações.
- [x] Manter tema no rodapé da lateral com identificação acessível, conforme exceção local aprovada.
- [x] Verificável por máquina: `grep -rl "@mui" apps/meu-negocio-app/src/renderer/src/pages/settings` retorna vazio; citar o resultado em Comments antes de marcar os critérios acima.
- [x] Tipografia na escala documentada em `docs/orca-theme.md` (12/18, 14/20, 16/24, 20/28, 24/32; pesos 400/500/600): verificável por `grep -n "font-size" apps/meu-negocio-app/src/renderer/src/styles.css` sem valor fora da lista e sem `fontSize`/`variant` de MUI nas telas migradas.

## Validação enxuta

- [x] Executar `npm run typecheck`, `npm run lint`, `npm test` e
      `npm run build -w meu-negocio-app`.
- [x] Editar empresa e trocar seção sem perder campos; exportar/restaurar dados descartáveis e conferir resultado, registrando eventual limitação do diálogo nativo.
- [x] Registrar em Comments resultados e limitações, atualizar Status e marcar
      somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
      ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).

Implementado e resolvido em 2026-09-14. Configurações saiu do MUI: Empresa,
Backup e Sobre viraram uma navegação interna por abas (`SettingsNav`, lista
`tablist`/`tab`/`tabpanel`, só a aba ativa na ordem de tabulação, setas nas
duas direções e `Home`/`End`), com uma seção visível por vez. Os três painéis
(`SettingsSection`) ficam montados e escondidos com `hidden`, então o que foi
digitado na empresa sobrevive à troca de seção; a lista é a mesma nos dois
arranjos — coluna de 208px à esquerda a partir de 1000px de conteúdo, seletor
compacto em cima abaixo disso —, por isso a seleção sobrevive ao
redimensionamento sem estado extra. A falha de uma seção aparece na aba
(glifo em `danger` mais ", falhou ao carregar" no nome acessível) e dentro
dela como `ErrorState` denso com recuperação própria. Formulário da empresa
em `Field`/`TextInput`/`TextArea` com `aria-invalid` e nota de erro;
exportação e restauração em `BackupPanel`; confirmação de restauração no
`ConfirmDialog` local; versão e caminho do banco em `<dl>` mono, selecionáveis,
com botão de copiar o caminho. O tema segue só no rodapé da lateral, com o modo
atual no nome do controle. Lógica pura com teste antes: `moveSection` (6
casos). A composição, a exceção do tema e o motivo de a regra "seção que
falhou se abre sozinha" não valer aqui estão em `docs/orca-theme.md`
(Configurações) e na seção de transição do design system; README §1.6 cita a
navegação interna.

Verificação por máquina, citada antes de marcar: `grep -rl "@mui"
apps/meu-negocio-app/src/renderer/src/pages/settings` retorna vazio;
`grep -n "font-size" apps/meu-negocio-app/src/renderer/src/styles.css` só tem
12/14/16/20/24px; as únicas ocorrências de `variant=` em settings são a prop
do `Button` local, não MUI. Restam consumidores de `@mui` só em `theme/`
(o tema que a issue 06 retira).

Defeito preexistente corrigido no caminho do critério de tipografia: o
`styles.css` usava `font: 500 14px/20px inherit` em botão, item da lateral,
grupo de alternância, chip, menu e filtro. O shorthand `font` não aceita
`inherit` como família e o Chromium descartava a declaração inteira — medido
no Electron: todos esses controles renderizavam em Arial 13,33px com peso 400,
e o título de diálogo em peso 700 do agente de usuário. As sete ocorrências
viraram longhands (`font-family: inherit` + tamanho/linha/peso) e o `h2` do
diálogo ganhou peso 600; medição depois: Geist 14px/20px, 500/600. Isso muda
o visual das telas já migradas (para o que a escala sempre disse).

Duas mudanças de comportamento, não só migração, registradas de propósito:
as duas ações de backup ficam bloqueadas enquanto qualquer uma roda (antes cada
uma só bloqueava a si mesma) — é o "bloqueio de ações concorrentes" do
critério; e o caminho do banco ganhou botão de copiar com aviso.

Validação aprovada: `npm run typecheck`, `npm run lint` (os dois avisos
preexistentes em `OrdersContext` e `ProductsContext`), `npm test` (41
arquivos, 354 testes) e `npm run build -w meu-negocio-app`.

Conferência no Electron real (build de produção, perfil isolado por
`XDG_CONFIG_HOME`, dois produtos descartáveis; viewport emulada por CDP porque
o Wayland ignora `setSize`): a 1280×800 a faixa de conteúdo tem 1008px e a
navegação é coluna (`grid 208px 776px`); a 960×640 com lateral aberta (688px)
vira o seletor compacto em fileira, sem rolagem da faixa. Digitado "Ateliê da
Ana" por `Input.insertText`, trocado para Backup e de volta, e depois
redimensionado: valor e botão Salvar habilitado preservados nos dois casos.
Teclado por `Input.dispatchKeyEvent` na aba ativa: ArrowRight → Backup, End →
Sobre, ArrowRight circula para Empresa, ArrowUp → Sobre, Home → Empresa, cada
uma já selecionada e com anel de foco; Tab da aba entra no primeiro campo.
Salvar com Enter: CNPJ e telefone chegam mascarados, Salvar volta a
desabilitar, `settings.get()` confirma; nome vazio recusado com
`aria-invalid` e nota "Nome da empresa é obrigatório" em `danger`. Backup com
o diálogo nativo respondido pelo driver (limitação: `dialog.showSaveDialog`/
`showOpenDialog` substituídos por um caminho descartável; o resto do fluxo é
o real): exportar gera o arquivo com `version/exportedAt/products/orders/
settings` e o aviso de sucesso; com o diálogo atrasado 1,5s os dois botões
ficam desabilitados e o rótulo vira "Exportando..."; importar abre a
confirmação com foco em Cancelar, Escape fecha, confirmar de novo restaura e
recarrega com os dois produtos e a empresa. Falha de seção simulada removendo
o handler IPC `app:getInfo`: a aba Sobre ganha o glifo e o nome ", falhou ao
carregar", o painel mostra o `ErrorState` denso; devolvido o handler, "Tentar
novamente" recupera e o glifo some. Sobre no escuro: `dl` em mono 12px,
`user-select: text`, papel `#171717`, aba ativa `#262626`; copiar põe o
caminho na área de transferência (lido pelo `clipboard` do main) e avisa.

Revisão de código (padrões e spec, em paralelo) antes do commit. Foi ela que
apontou o shorthand `font` inválido, corrigido acima. Também: nome do
arranjo no teste renomeado para não colidir com o `SECTIONS` do catálogo,
ícone do cabeçalho passado como nas outras telas, README §1.6 reduzido ao
que é produto. Sem ação, registradas: o CSS do seletor compacto repete a
forma do grupo de alternância (semântica diferente, `aria-selected` vs
`aria-pressed`); `useAnchoredPopup` tem o mesmo circular de setas inline e
poderia consumir `moveSection` (fora do escopo desta tela).

Limitações: a conferência foi dirigida por script e capturas, não por uso
manual; o `ErrorState` de uma seção escondida não é anunciado ao falhar
(o `role="alert"` e o foco no título ficam dentro de um painel `hidden`) — a
falha é anunciada pelo nome da aba, e o painel anuncia ao ser aberto; dicas
por teclado continuam a pendência herdada, registrada na issue 06.
