import type { Plan } from '@shared/types/plan';

/**
 * O plano de corte tinha a sua própria árvore de entidades aqui até este
 * arquivo colapsar em `@shared/types/plan` (as duas eram estruturalmente
 * idênticas nó a nó). Sobrevive só `PlanInput`: o plano pronto para gravar, sem
 * os três campos que o banco atribui. Era tipo de contrato até um ticket
 * anterior mover a geração para o main; hoje é construído só dentro do main,
 * por `planSnapshot.toPlanInput`, e consumido só por
 * `plansRepository.replaceForProject` — nunca atravessa o IPC como está, e por
 * isso não tem par em `@shared/types/`.
 */
export type PlanInput = Omit<Plan, 'id' | 'projectId' | 'generatedAt'>;
