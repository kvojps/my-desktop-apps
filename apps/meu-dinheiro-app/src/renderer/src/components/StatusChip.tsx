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
  /**
   * O detalhe que não cabe no rótulo — a data do pagamento, o valor em atraso.
   * Ele entra no texto do marcador, fora da tela, e é isso que o torna legível
   * sem ponteiro. A dica que o repete no hover é, por isso, `redundant`.
   */
  description?: string;
}

export function StatusChip({ label, color, icon, description }: StatusChipProps) {
  const detail = description && <span className="money-visually-hidden">, {description}</span>;

  if (color === 'default') {
    return (
      <span className="money-chip" data-variant="outline">
        {icon}
        {label}
        {detail}
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
      {detail}
    </span>
  );
}
