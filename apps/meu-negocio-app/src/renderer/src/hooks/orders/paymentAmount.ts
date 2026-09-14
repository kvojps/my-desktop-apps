/**
 * O valor que o campo de pagamento vai gravar. O campo é o **total já pago**,
 * não uma parcela: quem tinha R$ 100 e digita 150 fica com R$ 150 pagos, e não
 * com R$ 250. O serviço grava o número recebido por cima do anterior, então é
 * aqui que ele precisa chegar já dentro dos limites.
 *
 * Fora dos limites o campo não recusa nem apaga o que foi digitado — ele
 * registra o valor possível: nada abaixo de zero, nada acima do total do pedido.
 */
export function clampPaymentAmount(raw: string, total: number): number {
  return Math.min(Math.max(Number(raw) || 0, 0), total);
}
