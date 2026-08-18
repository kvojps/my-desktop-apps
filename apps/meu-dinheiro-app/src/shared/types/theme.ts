/**
 * O modo de tema atravessa o IPC, então mora aqui e não no renderer: o processo
 * main precisa dele para pintar a janela antes de existir renderer. É o
 * `PaletteMode` do MUI reescrito à mão de propósito — `shared/` não importa
 * React nem Electron.
 */
export type ThemeMode = 'light' | 'dark';
