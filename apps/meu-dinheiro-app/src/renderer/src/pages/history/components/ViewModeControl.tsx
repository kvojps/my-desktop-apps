import { BarChart3, Table2 } from 'lucide-react';

export type ViewMode = 'chart' | 'table';

/** O modo guardado pela sessão volta como texto; qualquer outra coisa é gráfico. */
export function toViewMode(value: string | undefined): ViewMode {
  return value === 'table' ? 'table' : 'chart';
}

interface ViewModeControlProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

/**
 * Gráfico ou tabela, para a aba visível.
 *
 * O controle é um só na tela, mas a escolha é **de cada aba** — é o que o
 * produto documenta ("duas abas, cada uma alternável entre gráfico e tabela") e
 * o que as duas abas pedem: o Comparativo em tabela é o caminho de teclado para
 * abrir um Mês, enquanto a distribuição por categoria se lê melhor em barras.
 * Quem guarda a escolha é a tela; o retorno de um Mês traz de volta a aba e o
 * modo dela.
 *
 * Os dois botões levam rótulo escrito além do ícone: um par de ícones sozinho
 * obriga a adivinhar qual é qual, e "Gráfico"/"Tabela" cabem na faixa.
 */
export function ViewModeControl({ value, onChange }: ViewModeControlProps) {
  return (
    <div className="money-segmented" role="group" aria-label="Forma de leitura">
      <button type="button" aria-pressed={value === 'chart'} onClick={() => onChange('chart')}>
        <BarChart3 size={18} aria-hidden="true" />
        Gráfico
      </button>
      <button type="button" aria-pressed={value === 'table'} onClick={() => onChange('table')}>
        <Table2 size={18} aria-hidden="true" />
        Tabela
      </button>
    </div>
  );
}
