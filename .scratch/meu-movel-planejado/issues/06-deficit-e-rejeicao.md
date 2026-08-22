# 06: Déficit, peças de fora e rejeição

**What to build:** o que o briefing original pediu e é a razão de o app existir em vez de uma conta de cabeça: quando o estoque não cobre o serviço, o app não falha em silêncio. Ele mostra quais peças ficaram de fora, quanto material falta em metro quadrado, e traduz isso em número de chapas para que a compra possa ser feita antes de o corte começar. E o plano parcial continua servindo: o que dá para cortar hoje aparece desenhado.

Separado disso está a **rejeição**: peça maior que qualquer chapa do projeto não é falta de estoque. Comprar mais chapas não resolveria, e tratá-las igual faria o app recomendar uma compra inútil.

**Blocked by:** 05.

**Status:** ready-for-agent

- [ ] As peças não alocadas aparecem listadas com quantidade e identificação.
- [ ] O déficit aparece em metro quadrado.
- [ ] O déficit aparece também traduzido em número de chapas, dizendo **qual formato** foi usado na conta.
- [ ] A contagem é apresentada como **"pelo menos N chapas"**, porque a conta por área ignora encaixe e é limite inferior. Prometer o número exato faria o usuário descobrir na hora do corte que a conta era otimista.
- [ ] Peça maior que qualquer chapa do projeto é barrada no cadastro, com mensagem própria que a distingue de falta de estoque.
- [ ] Peça rejeitada não entra no déficit nem na contagem de chapas a comprar.
- [ ] Um plano com estoque insuficiente continua mostrando as chapas que dá para cortar, em vez de recusar-se a existir.
