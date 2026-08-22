# Issue tracker: Markdown local

Issues e specs deste repo vivem como arquivos markdown em `.scratch/`. Não há
fluxo de GitHub Issues, mesmo o remote apontando para o GitHub.

## Convenções

- Uma feature por diretório: `.scratch/<feature-slug>/`
- A spec é `.scratch/<feature-slug>/spec.md`
- Issues de implementação são um arquivo por ticket em
  `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numerados a partir de `01`,
  nunca um único arquivo combinado
- Estado de triagem é uma linha `Status:` no topo do arquivo
- Comentários e histórico de conversa vão no fim do arquivo, sob um heading
  `## Comments`
- Quando a feature toca um app só, cite o app no slug
  (`.scratch/negocio-relatorio-mensal/`)

## Quando uma skill diz "publish to the issue tracker"

Criar um arquivo novo em `.scratch/<feature-slug>/`, criando o diretório se
ainda não existir.

## Quando uma skill diz "fetch the relevant ticket"

Ler o arquivo no caminho referenciado. Normalmente o usuário passa o caminho ou
o número da issue direto.

## Operações de wayfinding

Usadas pelo `/wayfinder`. O **mapa** é um arquivo, com um arquivo **filho** por
ticket.

- **Mapa**: `.scratch/<effort>/map.md` (corpo com Notes / Decisions-so-far / Fog).
- **Ticket filho**: `.scratch/<effort>/issues/NN-<slug>.md`, numerado a partir de
  `01`, com a pergunta no corpo. Uma linha `Type:` registra o tipo do ticket
  (`research`/`prototype`/`grilling`/`task`); uma linha `Status:` registra
  `claimed`/`resolved`.
- **Bloqueio**: uma linha `Blocked by: NN, NN` no topo. Um ticket está
  desbloqueado quando todo arquivo que ele lista está `resolved`.
- **Frontier**: varrer `.scratch/<effort>/issues/` atrás de arquivos abertos,
  desbloqueados e não reivindicados; o menor número vence.
- **Claim**: definir `Status: claimed` e salvar antes de qualquer trabalho.
- **Resolve**: acrescentar a resposta sob um heading `## Answer`, definir
  `Status: resolved`, e então acrescentar um ponteiro de contexto (gist + link)
  ao Decisions-so-far do `map.md`.
