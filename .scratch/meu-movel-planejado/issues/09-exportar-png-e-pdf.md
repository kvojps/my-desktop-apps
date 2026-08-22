# 09: Exportar PNG e PDF

**What to build:** o plano como arquivo. O PNG existe porque o combinado com o ajudante acontece pelo celular; o PDF existe porque o plano costuma ser arquivado junto com o orçamento do serviço. O usuário escolhe onde salvar, para organizar por cliente do jeito dele.

**Blocked by:** 08 (o PDF reaproveita o mesmo layout de impressão).

**Status:** ready-for-agent

- [ ] Exportar o plano como PNG.
- [ ] Exportar o plano como PDF, com o mesmo layout da impressão — resumo primeiro, uma chapa por página.
- [ ] O diálogo de salvar é modal da janela, nunca solto.
- [ ] Cancelar o diálogo devolve um resultado de cancelamento, não uma exceção — é o padrão de exportação que já existe no monorepo.
- [ ] A gravação do arquivo acontece no processo principal; o renderer apenas invoca.
- [ ] O nome de arquivo sugerido identifica o projeto e a data.
- [ ] Falha de escrita chega ao usuário como mensagem legível, com código de erro preservado através do IPC.
