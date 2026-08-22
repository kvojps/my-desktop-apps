# 03: Peças e chapas do projeto

**What to build:** a tela do projeto de corte, onde o serviço é descrito. O usuário cadastra as peças que precisa — comprimento, largura, quantidade e um rótulo opcional para reconhecer o pedaço depois de cortado — e as chapas de que dispõe, em quantos tamanhos diferentes forem necessários, porque o estoque real é chapa inteira misturada com retalho. Também define o material do projeto, o kerf da fresa e o refile.

Ao fim deste ticket o projeto está completamente descrito, ainda sem plano.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Adicionar, editar e excluir peça com comprimento, largura, quantidade e rótulo opcional.
- [ ] Adicionar, editar e excluir chapa com comprimento, largura e quantidade.
- [ ] Vários tamanhos de chapa convivem no mesmo projeto.
- [ ] Kerf e refile são campos do projeto, com kerf partindo de 0,3 mm e refile de 0.
- [ ] Material é rótulo livre do projeto; peça e chapa não declaram material.
- [ ] Medidas são digitadas e exibidas em milímetro com uma casa decimal, e persistidas em décimos de milímetro.
- [ ] A tela mostra a área total das peças cadastradas e a área total disponível em chapas.
- [ ] Qualquer alteração em projeto, peça ou chapa atualiza o carimbo de alteração do projeto — é dele que o aviso de plano desatualizado vai depender.
- [ ] Cada seção tem seu estado vazio próprio.
