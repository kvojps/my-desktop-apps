import type { CSSProperties } from 'react';

/** Mantém as dimensões já reservadas pela tela, sem anunciar formas decorativas. */
export function Skeleton({
  width,
  height,
  variant = 'text',
}: {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  variant?: 'text' | 'rounded';
}) {
  return (
    <div
      aria-hidden="true"
      className={`money-skeleton money-skeleton-${variant}`}
      style={{ width, height }}
    />
  );
}
