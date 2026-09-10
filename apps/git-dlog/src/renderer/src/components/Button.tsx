import { Slot } from '@radix-ui/react-slot';
import type { ComponentProps } from 'react';

// Composição shadcn/Radix: o link mantém sua semântica e recebe o mesmo controle.
export function Button({
  asChild = false,
  className = '',
  ...props
}: ComponentProps<'button'> & { asChild?: boolean }) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      type={asChild ? undefined : 'button'}
      className={`orca-button orca:flex orca:h-9 orca:w-full orca:items-center orca:gap-3 orca:rounded-md orca:px-3 orca:text-sm orca:font-medium orca:text-muted-foreground orca:hover:bg-accent orca:hover:text-foreground orca:aria-[current=page]:bg-accent orca:aria-[current=page]:text-foreground orca:aria-[current=page]:font-semibold ${className}`}
      {...props}
    />
  );
}
