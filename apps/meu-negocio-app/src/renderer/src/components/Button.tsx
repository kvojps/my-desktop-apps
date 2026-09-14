import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  tone?: 'danger' | 'neutral';
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  className = '',
  variant = 'secondary',
  tone,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      className={`negocio-button negocio-button-${variant} ${className}`}
      data-tone={tone}
      {...props}
    />
  );
}
