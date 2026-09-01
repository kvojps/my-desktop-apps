/**
 * O texto técnico de uma falha qualquer, para entrar como detalhe numa mensagem
 * escrita para ser lida.
 *
 * O `catch` do JavaScript pega qualquer coisa, não só `Error` — e um `String(err)`
 * seco num objeto devolve `[object Object]`, que é detalhe nenhum.
 */
export function errorReason(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
