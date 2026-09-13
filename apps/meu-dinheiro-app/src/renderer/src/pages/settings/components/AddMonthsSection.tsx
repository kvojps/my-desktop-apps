import { CalendarPlus, ListPlus } from 'lucide-react';
import { type ReactNode, useId } from 'react';
import { Button } from '@/components/Button';
import { rangeHint } from '@/hooks/months/monthBatch';
import type { useMonthRangeCreator } from '@/hooks/months/useMonthRangeCreator';
import { MonthYearPicker } from './MonthYearPicker';
import { SectionHeader } from './SectionHeader';

interface AddMonthsSectionProps {
  titleId: string;
  /**
   * O intervalo e a criação, de fora: a seção desmonta ao trocar de assunto, e
   * o `De`/`Até` escolhido — ou um lote em andamento — pertence à visita, não
   * a esta montagem.
   */
  creator: ReturnType<typeof useMonthRangeCreator>;
  /** O que a seção diz quando não há padrão nenhum para os meses copiarem. */
  emptyDefaultsNote?: ReactNode;
}

/**
 * A criação de meses em lote: o intervalo, o botão e a legenda que explica o
 * que ele vai fazer.
 *
 * Os meses nascem com uma cópia dos padrões de hoje — alterá-los depois não
 * muda mês nenhum já criado —, e por isso a seção avisa quando não há padrão
 * a copiar, apontando para onde se cadastra.
 */
export function AddMonthsSection({ titleId, creator, emptyDefaultsNote }: AddMonthsSectionProps) {
  const { range, setRange, creating, createRange, monthsCount, rangeValid } = creator;
  const hintId = useId();

  return (
    <>
      <SectionHeader
        icon={CalendarPlus}
        title="Adicionar Meses"
        description="Cria um intervalo de meses com uma cópia das despesas e entradas padrão."
        titleId={titleId}
      />

      {emptyDefaultsNote}

      <div className="money-range">
        <MonthYearPicker
          label="De"
          month={range.fromMonth}
          year={range.fromYear}
          onMonthChange={(month) => setRange((previous) => ({ ...previous, fromMonth: month }))}
          onYearChange={(year) => setRange((previous) => ({ ...previous, fromYear: year }))}
        />
        <MonthYearPicker
          label="Até"
          month={range.toMonth}
          year={range.toYear}
          onMonthChange={(month) => setRange((previous) => ({ ...previous, toMonth: month }))}
          onYearChange={(year) => setRange((previous) => ({ ...previous, toYear: year }))}
        />
        {/* Botão desabilitado não diz por quê; a legenda abaixo diz, e o
            `aria-describedby` é o que a entrega junto com ele (§5.5). */}
        <Button
          variant="primary"
          onClick={createRange}
          disabled={creating || !rangeValid}
          aria-describedby={hintId}
        >
          <ListPlus size={18} aria-hidden="true" />
          {creating ? 'Criando...' : 'Adicionar Meses'}
        </Button>
      </div>

      <p id={hintId} className="money-field-note" data-invalid={!rangeValid}>
        {rangeHint(monthsCount)}
      </p>
    </>
  );
}
