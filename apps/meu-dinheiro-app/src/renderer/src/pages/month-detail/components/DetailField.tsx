import type { ReactNode } from 'react';

/** Um campo do detalhe: rótulo pequeno em cima, valor embaixo. */
export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="money-detail-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
