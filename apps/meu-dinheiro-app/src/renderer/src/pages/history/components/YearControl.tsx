import { ChevronDown } from 'lucide-react';
import { type FocusEvent, useEffect, useId, useRef, useState } from 'react';
import { Field, SelectInput } from '@/components/Field';

/** Quantos anos ficam como atalho antes de o resto cair no painel. */
const SHORTCUT_YEARS = 3;

interface YearControlProps {
  /** Anos com mês cadastrado, do mais recente para o mais antigo. */
  years: number[];
  value: number;
  onChange: (year: number) => void;
}

/**
 * O recorte do Histórico, no `PageHeader` e no mesmo vocabulário do
 * `PeriodRangeControl` da Visão Geral: os anos são opções exclusivas, que é o
 * que um grupo de botões com `aria-pressed` diz e um seletor com setas ao redor
 * não.
 *
 * Os atalhos saem em ordem **ascendente**, mesmo com `years` vindo do mais
 * recente: a linha do tempo cresce para a direita no gráfico logo abaixo, e um
 * seletor que cresce para a esquerda contradiz o eixo que ele controla.
 */
export function YearControl({ years, value, onChange }: YearControlProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstField = useRef<HTMLSelectElement>(null);
  const panelId = useId();

  const shortcuts = years.slice(0, SHORTCUT_YEARS).reverse();
  const hasMore = years.length > SHORTCUT_YEARS;
  const isShortcut = shortcuts.includes(value);

  // O painel é aberto pelo teclado tanto quanto pelo ponteiro: sem devolver o
  // foco ao botão ao fechar, o Tab recomeçaria do topo da página (§5.5).
  useEffect(() => {
    if (!open) return;

    firstField.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    }

    function handlePointerDown(event: PointerEvent) {
      if (!anchor.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  /** Sair do painel pelo Tab o fecha — ele não é modal e não prende o foco. */
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.relatedTarget || !anchor.current?.contains(event.relatedTarget)) setOpen(false);
  }

  return (
    <div className="money-anchored" ref={anchor} onBlur={handleBlur}>
      <div className="money-segmented" role="group" aria-label="Ano exibido">
        {shortcuts.map((year) => (
          <button
            key={year}
            type="button"
            aria-pressed={value === year}
            onClick={() => onChange(year)}
          >
            {year}
          </button>
        ))}
        {hasMore && (
          <button
            type="button"
            ref={trigger}
            aria-label="Outro ano"
            title="Outro ano"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            // Ano fora dos atalhos deixa marcado o botão do painel — ele é a
            // representação de "um ano mais antigo" dentro do grupo.
            aria-pressed={!isShortcut}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {open && (
        <div className="money-popover money-panel" id={panelId}>
          <Field label="Ano">
            <SelectInput
              ref={firstField}
              value={value || ''}
              onChange={(event) => {
                onChange(Number(event.target.value));
                setOpen(false);
              }}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      )}
    </div>
  );
}
