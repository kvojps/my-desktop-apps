import type { ComponentType } from 'react';
import { type TileAccent, tileColors } from '@/theme/orca';

interface IconTileProps {
  /**
   * O componente do ícone, sem props: quem dimensiona é o CSS do ladrilho.
   * É o que deixa o mesmo ladrilho receber um ícone Lucide das telas migradas
   * e um Material das que ainda não migraram.
   */
  icon: ComponentType;
  /** Sem accent o ladrilho fica neutro. */
  accent?: TileAccent;
}

/**
 * O ladrilho quadrado que dá rosto a um indicador ou a uma seção: preenchido
 * com a cor de identidade e com o rótulo que o tema declara para ela (§1.3).
 *
 * Quadrado e não círculo de propósito — um raio de 50% não existe em nenhum
 * outro lugar do app.
 */
export function IconTile({ icon: Icon, accent }: IconTileProps) {
  const colors = accent && tileColors(accent);

  return (
    <span
      className="money-tile"
      style={colors ? { background: colors.fill, color: colors.label } : undefined}
    >
      <Icon />
    </span>
  );
}
