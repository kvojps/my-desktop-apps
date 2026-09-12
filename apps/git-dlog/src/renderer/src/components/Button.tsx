import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'nav' | 'primary' | 'outline' | 'icon';

const BASE =
  'ui-button ui:inline-flex ui:items-center ui:gap-2 ui:rounded-md ui:text-sm ui:font-medium ui:disabled:opacity-50';

const INTERACTIVE = 'ui:hover:bg-accent ui:hover:text-foreground';

/**
 * `nav` é o item da lateral: largura cheia, ícone à esquerda e o estado de tela
 * ativa vindo do `aria-current` que o `NavLink` já escreve. As demais são os
 * controles das telas — a hierarquia do design system, sem MUI.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  nav: `ui:h-9 ui:w-full ui:gap-3 ui:px-3 ui:text-muted-foreground ${INTERACTIVE} ui:aria-[current=page]:bg-accent ui:aria-[current=page]:text-foreground ui:aria-[current=page]:font-semibold`,
  primary:
    'ui:h-9 ui:justify-center ui:bg-primary ui:px-3 ui:text-on-color ui:hover:opacity-90',
  outline: `ui:h-9 ui:justify-center ui:border ui:border-border ui:px-3 ui:text-foreground ${INTERACTIVE}`,
  icon: `ui:h-8 ui:w-8 ui:justify-center ui:text-muted-foreground ${INTERACTIVE}`,
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
