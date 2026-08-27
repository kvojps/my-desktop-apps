import type { AppInfo } from '@shared/types/appInfo';
import type { CompanySettings } from '@shared/types/settings';
import { THEME_MODE_KEY, type ThemeModeEntity } from '../domain/theme';
import type { Repositories } from '../infra/database';
import type { AppInfoGateway } from '../infra/gateways/system/appInfo';
import type { ThemeModeGateway } from '../infra/gateways/system/themeMode';

/**
 * As preferências do app: os dados da empresa, o modo de tema e a informação de
 * build (`app:getInfo`).
 *
 * Os gateways chegam por parâmetro, não por import: `themeMode` fala Electron
 * (`nativeTheme`, `BrowserWindow`) e `appInfo` fala `app.getVersion()` — o
 * service que os importasse direto os conheceria por transitividade, que é o que
 * a camada existe para impedir (README §2.2). Mesmo motivo dos gateways de
 * `system/` no `git-dlog`.
 */
export function makeSettingsService(
  repos: Repositories,
  themeMode: ThemeModeGateway,
  appInfo: AppInfoGateway,
) {
  return {
    getSettings(): CompanySettings {
      return repos.settings.getSettings();
    },

    updateSettings(data: CompanySettings): CompanySettings {
      return repos.settings.updateSettings(data);
    },

    /** Versão e caminho do banco — o que a tela de Configurações exibe. */
    getAppInfo(): AppInfo {
      return { version: appInfo.version(), dbPath: appInfo.dbPath() };
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
