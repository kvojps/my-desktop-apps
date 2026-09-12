import type { ReactElement } from 'react';
import { type TileAccent, tileColors } from '@/theme/orca';

interface StatusChipProps {
  label: string;
  /**
   * `default` é o marcador sem estado — contorno e texto neutro. As demais
   * preenchem com a cor de identidade, que é o que permite ao âmbar existir
   * aqui: como preenchimento ele é legível, como texto não (§1.4).
   */
  color: Extract<TileAccent, 'success' | 'warning' | 'error' | 'info'> | 'default';
  /** Cor nunca é o único canal: o ícone precisa bastar sozinho (§1.7). */
  icon?: ReactElement;
}

export function StatusChip({ label, color, icon }: StatusChipProps) {
  if (color === 'default') {
    return (
      <span className="money-chip" data-variant="outline">
        {icon}
        {label}
      </span>
    );
  }

  const colors = tileColors(color);

  return (
    <span
      className="money-chip"
      data-variant="fill"
      style={{ background: colors.fill, color: colors.label }}
    >
      {icon}
      {label}
    </span>
  );
}
