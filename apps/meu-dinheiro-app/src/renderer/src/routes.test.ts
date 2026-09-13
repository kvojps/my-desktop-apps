import { describe, expect, it } from 'vitest';
import {
  ROUTES,
  monthDetailPath,
  originPath,
  resolveSettingsSection,
  settingsPath,
  staysInMonthVisit,
} from './routes';

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

describe('settingsPath', () => {
  it('abre Configurações na seção pedida', () => {
    expect(settingsPath('backup')).toBe('/settings?section=backup');
  });

  it('abre Configurações sem escolher seção quando nenhuma é pedida', () => {
    expect(settingsPath()).toBe(ROUTES.SETTINGS);
  });
});

describe('resolveSettingsSection', () => {
  it('abre em contas bancárias quando a rota não pede seção', () => {
    expect(resolveSettingsSection(null)).toBe('bank-accounts');
  });

  it('abre na seção que a rota pede', () => {
    expect(resolveSettingsSection('default-incomes')).toBe('default-incomes');
  });

  it('ignora seção que não existe, em vez de mostrar a tela vazia', () => {
    expect(resolveSettingsSection('appearance')).toBe('bank-accounts');
  });
});
