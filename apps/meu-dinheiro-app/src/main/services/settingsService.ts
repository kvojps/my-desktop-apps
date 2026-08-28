import { THEME_MODE_KEY, type ThemeModeEntity } from '../domain/theme';
import type { Repositories } from '../infra/database';
import type { ThemeModeGateway } from '../infra/gateways/system/themeMode';

/**
 * A preferência de tema em runtime, pelas quatro camadas: `domain/theme.ts`
 * decide, `infra/gateways/system/themeMode.ts` fala com `nativeTheme` e a moldura
 * nativa, e a leitura/escrita de `THEME_MODE_KEY` passa por `repos.appSettings`.
 *
 * O gateway chega por parâmetro pelo motivo de sempre nos de `system/`: importa
 * Electron, e o service que o importasse o conheceria por transitividade.
 */
export function makeSettingsService(repos: Repositories, themeMode: ThemeModeGateway) {
  return {
    /**
     * O modo em vigor nesta sessão — o que a moldura nativa já tem aplicado. Não
     * relê o banco, pelo motivo em `themeMode.currentMode`.
     */
    getThemeMode(): ThemeModeEntity {
      return themeMode.currentMode();
    },

    /** Persiste a escolha e aplica: a janela e a moldura nativa acompanham. */
    setThemeMode(mode: ThemeModeEntity): ThemeModeEntity {
      repos.appSettings.setAppSetting(THEME_MODE_KEY, mode);
      themeMode.apply(mode);
      return mode;
    },
  };
}

export type SettingsService = ReturnType<typeof makeSettingsService>;
