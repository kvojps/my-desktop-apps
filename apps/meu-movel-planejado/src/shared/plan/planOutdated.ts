/**
 * A regra de **plano desatualizado**: o plano foi gerado antes da última
 * alteração do projeto que o originou.
 *
 * Detecção por carimbo de tempo, e é uma decisão, não uma economia: hash do
 * conteúdo diria "mudou o quê", ao custo de o app precisar saber comparar
 * projetos — e o que o aviso promete não é enumerar a diferença, é dizer que o
 * papel na bancada ficou para trás. Um carimbo responde exatamente isso.
 *
 * Pura e no `shared` pelo mesmo motivo do empacotador: é a regra do contrato
 * que atravessa o IPC, sem React nem Electron dentro.
 */
import type { Plan } from '../types/plan';
import type { Project } from '../types/project';

/**
 * O plano ficou para trás? Recebe só os dois carimbos que a regra lê, e não o
 * plano e o projeto inteiros: nada mais entra na conta, e o tipo é onde isso
 * fica dito.
 *
 * A comparação é estritamente **depois**, e sobre instantes. Carimbos iguais
 * são o caso normal de reabrir um projeto intocado, e acusar aí faria o aviso
 * aparecer sempre — que é o mesmo que não aparecer nunca. Carimbo de projeto
 * *anterior* ao do plano é relógio da máquina para trás: o plano é o mais novo
 * dos dois, e mandar gerar de novo o que já está em dia seria pior que calar.
 */
export function isPlanOutdated(
  plan: Pick<Plan, 'projectUpdatedAt'>,
  project: Pick<Project, 'updatedAt'>,
): boolean {
  // `Date.parse`, e não `>` entre as cadeias: o mesmo instante noutro fuso se
  // escreve de outro jeito, e a comparação de texto o leria como diferente.
  return Date.parse(project.updatedAt) > Date.parse(plan.projectUpdatedAt);
}
