import { z } from 'zod';

/**
 * Os bytes do PNG que o renderer rasterizou.
 *
 * A validação parece formalidade — o payload não foi digitado por ninguém, veio
 * do canvas do próprio app —, e ela existe pela mesma razão que a do plano: a
 * fronteira de confiança é o processo, não a boa-fé do código do outro lado.
 * Sem ela, um `undefined` vindo de um caminho novo do renderer viraria um
 * arquivo de zero byte no computador do usuário, que é a falha que não avisa.
 */
export const pngBytesSchema = z
  .instanceof(Uint8Array, { message: 'Imagem inválida' })
  .refine((bytes) => bytes.byteLength > 0, 'Imagem vazia');
