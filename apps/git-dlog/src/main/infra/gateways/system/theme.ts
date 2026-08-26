import { BrowserWindow, nativeTheme } from 'electron';
import type { ThemeModeEntity } from '../../../domain/settings';

/**
 * O que só o processo main controla no tema: a moldura nativa (`nativeTheme`) e
 * o fundo das janelas. É o destino da lógica de tema que estava solta no
 * `index.ts` — o `git-dlog` era o único dos quatro apps sem um lugar para ela.
 *
 * As cores são `background.default` do tema do renderer, por modo
 * (docs/design-system.md §1.2/§5.1). Sem elas a janela nasce branca, o que
 * aparece como flash ao redimensionar/maximizar em modo escuro, mesmo com
 * `show: false` + `ready-to-show`.
 */
const BACKGROUND: Record<ThemeModeEntity, string> = {
  light: '#F4F6FB',
  dark: '#10131C',
};

/**
 * O que o `settingsService` precisa, e só isso: um duble de teste para
 * `saveThemeMode` implementa um método, não quatro.
 */
export interface ThemeGateway {
  /** Aplica o modo à moldura nativa e às janelas vivas. */
  apply(mode: ThemeModeEntity): void;
}

/**
 * O gateway inteiro. O que sobra além de `apply` é do bootstrap, que pinta a
 * janela antes de existir camada para atravessar — não há service que peça
 * cor de fundo.
 */
export interface ThemeSystemGateway extends ThemeGateway {
  /** A cor de fundo da janela, para quem a constrói. */
  windowBackgroundFor(mode: ThemeModeEntity): string;
  systemPrefersDarkColors(): boolean;
  currentMode(): ThemeModeEntity;
}

export const theme: ThemeSystemGateway = {
  /**
   * O `setBackgroundColor` é o que impede a faixa branca de voltar quando o
   * usuário alterna o tema: `backgroundColor` é fixado na construção da janela
   * e não acompanharia a troca sozinho.
   */
  apply(mode: ThemeModeEntity): void {
    nativeTheme.themeSource = mode;
    for (const window of BrowserWindow.getAllWindows()) {
      window.setBackgroundColor(BACKGROUND[mode]);
    }
  },

  windowBackgroundFor(mode: ThemeModeEntity): string {
    return BACKGROUND[mode];
  },

  /**
   * O que o sistema operacional prefere. Só vale enquanto `themeSource` for
   * `'system'`, ou seja: **antes** do primeiro `apply`. Depois disso o
   * `nativeTheme` responde o que fixamos, não a preferência do usuário — por
   * isso a leitura acontece uma vez só, na resolução inicial do bootstrap.
   */
  systemPrefersDarkColors(): boolean {
    return nativeTheme.shouldUseDarkColors;
  },

  /**
   * O modo em vigor nesta sessão. O próprio `nativeTheme` é a fonte: `apply` o
   * fixa em `light`/`dark` e nunca o deixa em `system`, então ler de volta é ler
   * a última escolha aplicada — sem uma segunda cópia do estado para
   * dessincronizar.
   */
  currentMode(): ThemeModeEntity {
    return nativeTheme.themeSource === 'dark' ? 'dark' : 'light';
  },
};
