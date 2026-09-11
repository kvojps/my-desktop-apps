import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'nav' | 'primary' | 'outline' | 'icon';

const BASE =
  'orca-button orca:inline-flex orca:items-center orca:gap-2 orca:rounded-md orca:text-sm orca:font-medium orca:disabled:opacity-50';

const INTERACTIVE = 'orca:hover:bg-accent orca:hover:text-foreground';

/**
 * `nav` é o item da lateral: largura cheia, ícone à esquerda e o estado de tela
 * ativa vindo do `aria-current` que o `NavLink` já escreve. As demais são os
 * controles das telas — a hierarquia do design system, sem MUI.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  nav: `orca:h-9 orca:w-full orca:gap-3 orca:px-3 orca:text-muted-foreground ${INTERACTIVE} orca:aria-[current=page]:bg-accent orca:aria-[current=page]:text-foreground orca:aria-[current=page]:font-semibold`,
  primary:
    'orca:h-9 orca:justify-center orca:bg-primary orca:px-3 orca:text-on-color orca:hover:opacity-90',
  outline: `orca:h-9 orca:justify-center orca:border orca:border-border orca:px-3 orca:text-foreground ${INTERACTIVE}`,
  icon: `orca:h-8 orca:w-8 orca:justify-center orca:text-muted-foreground ${INTERACTIVE}`,
};

// Composição shadcn/Radix: o link mantém sua semântica e recebe o mesmo controle.
export function Button({
  asChild = false,
  variant,
  className = '',
  ...props
}: ComponentProps<'button'> & { asChild?: boolean; variant: ButtonVariant }) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      type={asChild ? undefined : 'button'}
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
