import { CalendarRange } from 'lucide-react';
import { type FocusEvent, useEffect, useId, useMemo, useRef, useState } from 'react';

export interface MonthOption {
  label: string;
  /** Competência no formato "AAAA-MM", que ordena como string. */
  value: string;
}

/** Quantos meses o atalho "3 meses" cobre, contando do mais recente para trás. */
const LAST_N = 3;

type Preset = 'last3' | 'year' | 'all';

interface PeriodRangeControlProps {
  /** Meses existentes, em ordem ascendente. */
  options: MonthOption[];
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

/** O intervalo de cada atalho, ou `null` quando ele não alcança mês nenhum. */
export function resolvePresets(options: MonthOption[]) {
  if (options.length === 0) return { last3: null, year: null, all: null };

  const first = options[0].value;
  const last = options[options.length - 1].value;

  const yearOptions = options.filter((opt) => opt.value.startsWith(`${new Date().getFullYear()}`));

  return {
    last3: { from: options[Math.max(0, options.length - LAST_N)].value, to: last },
    year:
      yearOptions.length > 0
        ? { from: yearOptions[0].value, to: yearOptions[yearOptions.length - 1].value }
        : null,
    all: { from: first, to: last },
  };
}

/**
 * O recorte de meses da tela, nas ações do cabeçalho e não numa faixa própria
 * (§4): ele governa tudo que está abaixo, e ali custa zero de altura.
 *
 * Os atalhos são exclusivos entre si, e é isso que `aria-pressed` diz. "De/Até"
 * só aparece no painel, para quem precisa de um recorte que os atalhos não dão;
 * sem atalho correspondente, quem fica marcado é o botão do painel — ele é a
 * representação de "personalizado" dentro do grupo.
 */
export function PeriodRangeControl({ options, from, to, onChange }: PeriodRangeControlProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstField = useRef<HTMLSelectElement>(null);
  const panelId = useId();

  const presets = useMemo(() => resolvePresets(options), [options]);

  const active: Preset | null =
    (Object.keys(presets) as Preset[]).find(
      (key) => presets[key]?.from === from && presets[key]?.to === to,
    ) ?? null;

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

  function applyPreset(preset: Preset) {
    const range = presets[preset];
    if (range) onChange(range.from, range.to);
  }

  // Trocar um extremo para além do outro inverteria o intervalo e esvaziaria a
  // tabela sem explicar por quê; o extremo oposto acompanha.
  function handleFromChange(value: string) {
    onChange(value, value > to ? value : to);
  }

  function handleToChange(value: string) {
    onChange(value < from ? value : from, value);
  }

  return (
    <div className="money-anchored" ref={anchor} onBlur={handleBlur}>
      <div className="money-segmented" role="group" aria-label="Período exibido">
        <button
          type="button"
          aria-pressed={active === 'last3'}
          disabled={!presets.last3}
          onClick={() => applyPreset('last3')}
        >
          3 meses
        </button>
        <button
          type="button"
          aria-pressed={active === 'year'}
          disabled={!presets.year}
          onClick={() => applyPreset('year')}
        >
          Este ano
        </button>
        <button
          type="button"
          aria-pressed={active === 'all'}
          disabled={!presets.all}
          onClick={() => applyPreset('all')}
        >
          Tudo
        </button>
        <button
          type="button"
          ref={trigger}
          aria-label="Período personalizado"
          title="Período personalizado"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-pressed={active === null}
          onClick={() => setOpen((current) => !current)}
        >
          <CalendarRange size={18} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="money-popover money-panel" id={panelId}>
          <label className="money-field">
            De
            <select
              ref={firstField}
              className="money-select"
              value={from}
              onChange={(event) => handleFromChange(event.target.value)}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="money-field">
            Até
            <select
              className="money-select"
              value={to}
              onChange={(event) => handleToChange(event.target.value)}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
