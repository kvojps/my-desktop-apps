import { ChartColumn, Table } from 'lucide-react';

export type SectionView = 'chart' | 'table';

interface ViewToggleProps {
  /** Como o grupo se anuncia: "Exibição de Cobranças". */
  label: string;
  value: SectionView;
  onChange: (value: SectionView) => void;
}

/**
 * Gráfico ou tabela, para o mesmo bloco e os mesmos dados. É o mesmo grupo de
 * alternância do recorte de período: dois recortes mutuamente exclusivos, e a
 * forma diz que só um vale. A tabela é o caminho de teclado para os números
 * que o gráfico só entrega ao ponteiro (§5.5).
 */
export function ViewToggle({ label, value, onChange }: ViewToggleProps) {
  return (
    <div className="negocio-toggle-group" role="group" aria-label={label}>
      <button type="button" aria-pressed={value === 'chart'} onClick={() => onChange('chart')}>
        <ChartColumn aria-hidden="true" />
        Gráfico
      </button>
      <button type="button" aria-pressed={value === 'table'} onClick={() => onChange('table')}>
        <Table aria-hidden="true" />
        Tabela
      </button>
    </div>
  );
}
