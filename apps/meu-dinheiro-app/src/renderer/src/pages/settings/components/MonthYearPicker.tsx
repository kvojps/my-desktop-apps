import { useId } from 'react';
import { Field, SelectInput, TextInput } from '@/components/Field';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface MonthYearPickerProps {
  label: string;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

/**
 * Uma ponta do intervalo: mês e ano.
 *
 * "De" e "Até" nomeiam o **par** de campos, não um campo — daí o `role="group"`
 * com `aria-labelledby`, e daí cada controle levar o seu próprio rótulo dentro.
 * Sem isso o leitor de tela anuncia quatro campos chamados "Mês" e "Ano", sem
 * dizer qual ponta do intervalo é qual.
 */
export function MonthYearPicker({
  label,
  month,
  year,
  onMonthChange,
  onYearChange,
}: MonthYearPickerProps) {
  const labelId = useId();

  return (
    <div className="money-range-side">
      <span id={labelId} className="money-range-label">
        {label}
      </span>
      <div className="money-range-fields" role="group" aria-labelledby={labelId}>
        <Field label="Mês">
          <SelectInput
            value={month}
            onChange={(event) => onMonthChange(Number(event.target.value))}
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Ano">
          <TextInput
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
          />
        </Field>
      </div>
    </div>
  );
}
