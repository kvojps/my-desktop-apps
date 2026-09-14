import { describe, expect, it, vi } from 'vitest';
import type { Repositories } from '../infra/database';
import type { AppInfoGateway } from '../infra/gateways/system/appInfo';
import type { ThemeModeGateway } from '../infra/gateways/system/themeMode';
import { makeSettingsService } from './settingsService';

describe('settingsService theme preference', () => {
  it('persists the selected mode and applies it to the live windows', () => {
    const setAppSetting = vi.fn();
    const apply = vi.fn();
    const repos = {
      appSettings: { setAppSetting },
    } as unknown as Repositories;
    const themeMode = {
      apply,
      currentMode: vi.fn(() => 'light' as const),
    } satisfies ThemeModeGateway;
    const appInfo = {} as AppInfoGateway;

    makeSettingsService(repos, themeMode, appInfo).saveThemeMode('dark');

    expect(setAppSetting).toHaveBeenCalledWith('theme.mode', 'dark');
    expect(apply).toHaveBeenCalledWith('dark');
  });
});
