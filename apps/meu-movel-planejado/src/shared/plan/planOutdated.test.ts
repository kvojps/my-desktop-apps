import { describe, expect, it } from 'vitest';
import { isPlanOutdated } from './planOutdated';

/**
 * A regra de plano desatualizado, que é uma comparação de dois carimbos e nada
 * mais: sem hash e sem comparar conteúdo. O que se testa aqui é o **sentido**
 * da comparação — errá-lo daria um app que acusa desatualizado ao reabrir um
 * projeto intocado, e é assim que um aviso vira ruído que se aprende a ignorar.
 */

const PROJECT_UPDATED_AT = '2026-08-22T14:32:00.000Z';

describe('isPlanOutdated', () => {
  it('acusa desatualizado quando o projeto foi alterado depois da geração', () => {
    expect(
      isPlanOutdated(
        { projectUpdatedAt: PROJECT_UPDATED_AT },
        { updatedAt: '2026-08-22T15:00:00.000Z' },
      ),
    ).toBe(true);
  });

  it('não acusa nada quando o projeto não foi tocado depois da geração', () => {
    expect(
      isPlanOutdated({ projectUpdatedAt: PROJECT_UPDATED_AT }, { updatedAt: PROJECT_UPDATED_AT }),
    ).toBe(false);
  });

  it('compara instantes, e não o texto do carimbo', () => {
    // O mesmo instante escrito noutro fuso. Comparar as duas cadeias diria que
    // um é maior que o outro, e o plano nasceria desatualizado de si mesmo.
    expect(
      isPlanOutdated(
        { projectUpdatedAt: PROJECT_UPDATED_AT },
        { updatedAt: '2026-08-22T11:32:00.000-03:00' },
      ),
    ).toBe(false);
  });

  it('não acusa nada quando o carimbo do projeto é anterior ao do plano', () => {
    // Relógio da máquina para trás entre uma coisa e outra. O plano é o mais
    // novo dos dois, e avisar aqui mandaria gerar de novo o que já está em dia.
    expect(
      isPlanOutdated(
        { projectUpdatedAt: PROJECT_UPDATED_AT },
        { updatedAt: '2026-08-22T14:00:00.000Z' },
      ),
    ).toBe(false);
  });
});
