import type { ButtonHTMLAttributes, Ref } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  /**
   * A ação destrutiva pinta o botão primário de `danger`. É condição, não
   * identidade (§1.5): só quem apaga alguma coisa pede a cor.
   */
  'data-tone'?: 'danger' | 'neutral';
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`money-button money-button-${variant} ${className}`}
      {...props}
    />
  );
}
