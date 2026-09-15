/**
 * O modo de tema atravessa o IPC, então mora aqui e não no renderer: o processo
 * main precisa dele para pintar a janela antes de existir renderer. É uma
 * união de literais escrita à mão de propósito — `shared/` não importa React,
 * Electron nem biblioteca de tema.
 */
export type ThemeMode = 'light' | 'dark';
