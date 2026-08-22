import { z } from 'zod';

/**
 * O material é rótulo livre (`MDF 15 mm branco`) e não uma escolha de lista: a
 * lista seria de quem escreveu o app, não de quem tem as chapas na parede. Livre
 * não é opcional — é ele que separa um projeto de 15 mm de um de 6 mm, e sem ele
 * a lista de projetos não distingue dois serviços do mesmo cliente.
 */
export const projectInputSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120, 'Nome muito longo'),
  material: z.string().trim().min(1, 'Material é obrigatório').max(120, 'Material muito longo'),
});
