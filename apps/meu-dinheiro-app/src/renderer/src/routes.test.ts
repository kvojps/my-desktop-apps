import { describe, expect, it } from 'vitest';
import { ROUTES, monthDetailPath, originPath, staysInMonthVisit } from './routes';

describe('monthDetailPath', () => {
  it('monta a rota do Mês a partir do id', () => {
    expect(monthDetailPath(7)).toBe('/months/7');
  });
});

describe('originPath', () => {
  it('volta para a tela de onde o Mês foi aberto', () => {
    expect(originPath('dashboard')).toBe(ROUTES.DASHBOARD);
    expect(originPath('history')).toBe(ROUTES.HISTORY);
  });

  it('usa a Visão Geral quando não há origem conhecida', () => {
    expect(originPath(null)).toBe(ROUTES.DASHBOARD);
  });
});

describe('staysInMonthVisit', () => {
  it('continua na visita ao andar de Mês em Mês', () => {
    expect(staysInMonthVisit('history', monthDetailPath(7))).toBe(true);
  });

  it('continua na visita ao chegar na origem, que é quem restaura a consulta', () => {
    expect(staysInMonthVisit('history', ROUTES.HISTORY)).toBe(true);
    expect(staysInMonthVisit('dashboard', ROUTES.DASHBOARD)).toBe(true);
  });

  it('encerra a visita em qualquer outro destino', () => {
    expect(staysInMonthVisit('history', ROUTES.DASHBOARD)).toBe(false);
    expect(staysInMonthVisit('history', ROUTES.SETTINGS)).toBe(false);
    expect(staysInMonthVisit('dashboard', ROUTES.HISTORY)).toBe(false);
  });
});
