import type { ComponentType } from 'react';

/**
 * Cor de identidade do ladrilho. Como ele é preenchido, qualquer cor da paleta
 * serve — inclusive `warning`, que é âmbar e só é legível como preenchimento,
 * nunca como texto (§1.4).
 */
export type TileAccent = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

interface IconTileProps {
  /**
   * `className` é a única prop que os ícones do Lucide e os do MUI têm em comum,
   * e as duas bases convivem até a retirada do MUI. Quem manda no tamanho é o
   * CSS do ladrilho, então nenhuma chamada precisa repetir a medida.
   */
  icon: ComponentType<{ className?: string }>;
  /** Sem accent o ladrilho fica neutro. */
  accent?: TileAccent;
}

/**
 * O ladrilho quadrado que dá rosto a um indicador ou a uma seção: 38px, raio de
 * controle (um degrau abaixo do raio das superfícies), preenchido com a cor de
 * identidade e com o ícone no par de contraste dela.
 *
 * Quadrado e não círculo de propósito — 50% de raio não existe em nenhum outro
 * lugar do app (§3.1).
 */
export function IconTile({ icon: Icon, accent }: IconTileProps) {
  return (
    <span className="negocio-tile" data-accent={accent} aria-hidden="true">
      <Icon />
    </span>
  );
}
