import { describe, expect, it } from 'vitest';
import {
  MAX_BATCH_MONTHS,
  batchSummary,
  clampRange,
  countMonths,
  isRangeValid,
  rangeHint,
} from './monthBatch';

const jan2026 = { fromYear: 2026, fromMonth: 1, toYear: 2026, toMonth: 1 };

describe('countMonths', () => {
  it('conta as duas pontas do intervalo', () => {
    expect(countMonths({ fromYear: 2026, fromMonth: 1, toYear: 2026, toMonth: 12 })).toBe(12);
  });

  it('conta um mês quando as pontas são a mesma Competência', () => {
    expect(countMonths(jan2026)).toBe(1);
  });

  it('atravessa a virada do ano', () => {
    expect(countMonths({ fromYear: 2025, fromMonth: 11, toYear: 2026, toMonth: 2 })).toBe(4);
  });
});

describe('isRangeValid', () => {
  it('aceita de um mês até o limite do lote', () => {
    expect(isRangeValid(jan2026)).toBe(true);
    expect(isRangeValid({ fromYear: 2026, fromMonth: 1, toYear: 2030, toMonth: 12 })).toBe(true);
  });

  it('recusa o intervalo invertido', () => {
    expect(isRangeValid({ fromYear: 2026, fromMonth: 5, toYear: 2026, toMonth: 4 })).toBe(false);
  });

  it('recusa o intervalo acima do limite do lote', () => {
    expect(isRangeValid({ fromYear: 2026, fromMonth: 1, toYear: 2031, toMonth: 1 })).toBe(false);
  });
});

describe('clampRange', () => {
  it('empurra o fim quando o início passa dele', () => {
    expect(clampRange(jan2026, { ...jan2026, fromMonth: 6 })).toEqual({
      fromYear: 2026,
      fromMonth: 6,
      toYear: 2026,
      toMonth: 6,
    });
  });

  it('puxa o início quando o fim recua antes dele', () => {
    const range = { fromYear: 2026, fromMonth: 6, toYear: 2026, toMonth: 9 };
    expect(clampRange(range, { ...range, toMonth: 2 })).toEqual({
      fromYear: 2026,
      fromMonth: 2,
      toYear: 2026,
      toMonth: 2,
    });
  });

  it('deixa passar o intervalo que continua em ordem', () => {
    const next = { fromYear: 2026, fromMonth: 3, toYear: 2027, toMonth: 3 };
    expect(clampRange(jan2026, next)).toEqual(next);
  });
});

describe('rangeHint', () => {
  it('anuncia quantos meses o lote vai criar, avisando que os existentes são ignorados', () => {
    expect(rangeHint(12)).toBe(
      'Isso vai criar até 12 meses (meses já existentes serão ignorados).',
    );
  });

  it('concorda o singular', () => {
    expect(rangeHint(1)).toBe('Isso vai criar até 1 mês (meses já existentes serão ignorados).');
  });

  it('explica o intervalo invertido, que não cria nada', () => {
    expect(rangeHint(0)).toBe('Selecione um intervalo válido.');
  });

  it('diz qual é o limite quando o intervalo o ultrapassa', () => {
    expect(rangeHint(MAX_BATCH_MONTHS + 1)).toContain(
      `O intervalo não pode ultrapassar ${MAX_BATCH_MONTHS} meses.`,
    );
  });
});

describe('batchSummary', () => {
  it('resume o lote em que tudo foi criado', () => {
    expect(batchSummary(3, [])).toEqual({ message: '3 meses adicionados', severity: 'success' });
  });

  it('concorda o singular do criado', () => {
    expect(batchSummary(1, []).message).toBe('1 mês adicionado');
  });

  it('conta os ignorados ao lado dos criados', () => {
    expect(batchSummary(2, ['Janeiro/2026 já existe', 'Março/2026 já existe'])).toEqual({
      message: '2 meses adicionados · 2 ignorados, que já existiam',
      severity: 'warning',
    });
  });

  it('diz que nada foi criado quando o intervalo inteiro já existia', () => {
    expect(batchSummary(0, ['Janeiro/2026 já existe'])).toEqual({
      message: 'Nenhum mês adicionado · 1 ignorado, que já existia',
      severity: 'warning',
    });
  });
});
