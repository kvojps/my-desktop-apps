/**
 * As medidas da folha. Elas moram aqui, e não no CSS, porque o desenho precisa
 * delas em **pixel** para decidir a escala e o degrau do rótulo: dois lugares
 * declarando a altura da caixa dariam um desenho de um tamanho e um rótulo
 * medido contra outro.
 *
 * A4 deitada, porque a chapa é deitada: uma folha em pé desenharia a mesma
 * chapa com pouco mais da metade do tamanho. O `@page` do `styles.css` e a
 * opção passada ao Electron dizem o mesmo, e precisam continuar dizendo.
 */

/** Em mídia paginada um pixel de CSS é 1/96 de polegada, e não um ponto da tela. */
const PX_PER_MM = 96 / 25.4;

function mmToPx(mm: number): number {
  return mm * PX_PER_MM;
}

/**
 * A caixa do desenho dentro da página da chapa. A folha tem 277 × 190 mm de área
 * de conteúdo (A4 deitada menos os 10 mm de margem do `@page`); dela saem ~11 mm
 * do cabeçalho corrente e ~9 mm do cabeçalho da unidade, e o desenho fica com o
 * resto — é ele que a folha existe para carregar.
 *
 * Ela é o teto, não a medida do desenho: a proporção nunca é esticada (§5.3),
 * então quem cede é a largura, e o desenho centraliza no que sobrar.
 */
export const PRINT_DRAWING_MM = { width: 277, height: 165 } as const;

export const PRINT_DRAWING_PX = {
  width: mmToPx(PRINT_DRAWING_MM.width),
  height: mmToPx(PRINT_DRAWING_MM.height),
} as const;
