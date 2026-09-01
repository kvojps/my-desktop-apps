import { THEME_MODE_KEY, type ThemeModeEntity } from '../domain/theme';
import type { Repositories } from '../infra/database';
import type { ThemeModeGateway } from '../infra/gateways/system/themeMode';

/**
 * A preferência de tema em runtime, pelas quatro camadas: `domain/theme.ts`
 * decide (no boot), `infra/gateways/system/themeMode.ts` fala com `nativeTheme` e
 * a moldura nativa, e a leitura/escrita de `THEME_MODE_KEY` passa por
 * `repos.settings`.
 *
 * O gateway chega por parâmetro pelo motivo de sempre nos de `system/`: importa
 * Electron, e o service que o importasse o conheceria por transitividade. Este
 * service assume o tema por inteiro — a closure `onThemeModeChange` que o
 * `index.ts` passava a `registerIpcHandlers` sumiu, porque ela só existia
 * enquanto não havia camada de serviço (spec, decisão 4). Depois do boot, quem
 * responde o modo em vigor é o `nativeTheme` pelo gateway, não o banco.
 */
export function makeSettingsService(repos: Repositories, themeMode: ThemeModeGateway) {
  return {
    /**
     * Persiste a escolha e aplica: a janela e a moldura nativa acompanham. É o
     * que a closure do `index.ts` fazia.
     */
    setThemeMode(mode: ThemeModeEntity): void {
      repos.settings.set(THEME_MODE_KEY, mode);
      themeMode.apply(mode);
    },
  };
}

export type SettingsService = ReturnType<typeof makeSettingsService>;
