import { describe, expect, it } from 'vitest';
import { buildMonthOptions, last3MonthsRange, monthRangeToISO, thisYearRange } from './monthRange';

describe('buildMonthOptions', () => {
  it('inclui o mês corrente mesmo sem pedido nenhum', () => {
    const options = buildMonthOptions([], new Date(2026, 8, 14));
    expect(options).toEqual([{ value: '2026-09', label: 'Setembro de 2026' }]);
  });

  it('ordena os meses e não repete o mesmo mês', () => {
    const dates = [
      new Date(2026, 6, 20).toISOString(),
      new Date(2025, 11, 2).toISOString(),
      new Date(2026, 6, 3).toISOString(),
    ];
    expect(buildMonthOptions(dates, new Date(2026, 8, 14)).map((o) => o.value)).toEqual([
      '2025-12',
      '2026-07',
      '2026-09',
    ]);
  });
});

describe('monthRangeToISO', () => {
  it('abre no primeiro dia do mês inicial e fecha no último do final', () => {
    expect(monthRangeToISO('2026-01', '2026-02')).toEqual({
      from: '2026-01-01',
      to: '2026-02-28',
    });
  });

  it('respeita fevereiro de ano bissexto', () => {
    expect(monthRangeToISO('2024-02', '2024-02')).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    });
  });
});

describe('last3MonthsRange', () => {
  it('pega os três últimos meses disponíveis', () => {
    const options = buildMonthOptions(
      [
        new Date(2026, 3, 1).toISOString(),
        new Date(2026, 5, 1).toISOString(),
        new Date(2026, 6, 1).toISOString(),
        new Date(2026, 7, 1).toISOString(),
      ],
      new Date(2026, 8, 14),
    );
    expect(last3MonthsRange(options)).toEqual({ from: '2026-07', to: '2026-09' });
  });

  it('não existe sem mês nenhum', () => {
    expect(last3MonthsRange([])).toBeNull();
  });
});

describe('thisYearRange', () => {
  it('vai do primeiro ao último mês do ano corrente', () => {
    const options = buildMonthOptions(
      [new Date(2025, 10, 1).toISOString(), new Date(2026, 2, 1).toISOString()],
      new Date(2026, 8, 14),
    );
    expect(thisYearRange(options, new Date(2026, 8, 14))).toEqual({
      from: '2026-03',
      to: '2026-09',
    });
  });

  it('não existe quando nenhum mês é do ano corrente', () => {
    const options = [{ value: '2025-11', label: 'Novembro de 2025' }];
    expect(thisYearRange(options, new Date(2026, 8, 14))).toBeNull();
  });
});
