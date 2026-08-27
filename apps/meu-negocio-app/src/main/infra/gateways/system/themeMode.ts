import { BrowserWindow, nativeTheme } from 'electron';
import type { ThemeModeEntity } from '../../../domain/theme';

/** Igual a `background.default` do tema do renderer, por modo. */
const BACKGROUND: Record<ThemeModeEntity, string> = {
  light: '#F4F6FB',
  dark: '#10131C',
};

/**
 * O que o `settingsService` precisa do tema, e só isso — um duble de teste
 * para `saveThemeMode`/`getThemeMode` implementa dois métodos, não a
 * superfície inteira.
 */
export interface ThemeModeGateway {
  /** Aplica o modo à moldura nativa e às janelas vivas. */
  apply(mode: ThemeModeEntity): void;
  /** O modo em vigor nesta sessão, lido da moldura nativa já aplicada. */
  currentMode(): ThemeModeEntity;
}

/**
 * O gateway inteiro. O que sobra além do que o service usa é do bootstrap, que
 * pinta a janela antes de existir camada para atravessar — não há service que
 * peça cor de fundo.
 */
export interface ThemeModeSystemGateway extends ThemeModeGateway {
  /** A cor de fundo da janela, para quem a constrói. */
  windowBackgroundFor(mode: ThemeModeEntity): string;
  systemPrefersDark(): boolean;
}

export const themeMode: ThemeModeSystemGateway = {
  /**
   * Aplica o modo ao que só o processo main controla: a moldura nativa (sem
   * isso a barra de título do Windows fica clara com o app escuro) e o fundo
   * das janelas vivas.
   *
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

  /**
   * A fonte é o próprio `nativeTheme`: `apply` o fixa em `light`/`dark` e nunca
   * o deixa em `'system'`, então ler de volta é ler a última escolha aplicada
   * — sem uma segunda cópia de estado para dessincronizar. Só responde certo
   * depois do primeiro `apply` (o do bootstrap).
   */
  currentMode(): ThemeModeEntity {
    return nativeTheme.themeSource === 'dark' ? 'dark' : 'light';
  },

  windowBackgroundFor(mode: ThemeModeEntity): string {
    return BACKGROUND[mode];
  },

  /**
   * O que o sistema operacional prefere. Só vale enquanto `themeSource` for
   * `'system'`, ou seja **antes** do primeiro `apply` — por isso o bootstrap
   * lê uma vez só, na resolução inicial.
   */
  systemPrefersDark(): boolean {
    return nativeTheme.shouldUseDarkColors;
  },
};
