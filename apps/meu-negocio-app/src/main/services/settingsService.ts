import type { CompanySettings } from '@shared/types/settings';
import { THEME_MODE_KEY, type ThemeModeEntity } from '../domain/theme';
import type { Repositories } from '../infra/database';
import type { ThemeModeGateway } from '../infra/gateways/system/themeMode';

/**
 * As preferências do app: os dados da empresa e o modo de tema.
 *
 * O gateway de tema chega por parâmetro, não por import: ele fala Electron
 * (`nativeTheme`, `BrowserWindow`), e o service que o importasse direto o
 * conheceria por transitividade — que é o que a camada existe para impedir
 * (README §2.2). Mesmo motivo dos gateways de `system/` no `git-dlog`.
 */
export function makeSettingsService(repos: Repositories, themeMode: ThemeModeGateway) {
  return {
    getSettings(): CompanySettings {
      return repos.settings.getSettings();
    },

    updateSettings(data: CompanySettings): CompanySettings {
      return repos.settings.updateSettings(data);
    },

    /**
     * O modo em vigor nesta sessão. Depois do boot é o que a moldura nativa já
     * tem aplicado — não relê o banco, pelo motivo em `themeMode.currentMode`.
     */
    getThemeMode(): ThemeModeEntity {
      return themeMode.currentMode();
    },

    /** Persiste a escolha e aplica: a janela e a moldura nativa acompanham. */
    saveThemeMode(mode: ThemeModeEntity): void {
      repos.appSettings.setAppSetting(THEME_MODE_KEY, mode);
      themeMode.apply(mode);
    },
  };
}

export type SettingsService = ReturnType<typeof makeSettingsService>;
