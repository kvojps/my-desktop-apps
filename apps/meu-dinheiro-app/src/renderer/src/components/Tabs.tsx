import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react';

interface TabOption<V extends string> {
  value: V;
  label: string;
}

interface TabsProps<V extends string> {
  /** Como o grupo se anuncia: "Itens do mês". */
  label: string;
  value: V;
  options: TabOption<V>[];
  onChange: (value: V) => void;
  /** A ação que vale para a aba visível — fica ao lado dela, não no rodapé. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * As abas da tela e o painel delas.
 *
 * O painel mora aqui dentro junto da fileira porque é o que dá o
 * `aria-labelledby` de graça: separados, cada tela teria de inventar os ids e
 * ligá-los à mão, e um painel sem rótulo é a metade que costuma faltar.
 *
 * Seleção automática pelas setas, com tabulação em um alvo só (o `tabIndex`
 * rotativo): quem chega pelo Tab entra na aba atual, e as setas trocam de aba
 * sem gastar mais paradas na ordem de tabulação.
 */
export function Tabs<V extends string>({
  label,
  value,
  options,
  onChange,
  actions,
  children,
}: TabsProps<V>) {
  const baseId = useId();
  const list = useRef<HTMLDivElement>(null);
  const tabId = (option: V) => `${baseId}-${option}`;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;

    event.preventDefault();
    const index = options.findIndex((option) => option.value === value);
    const next = options[(index + step + options.length) % options.length];
    onChange(next.value);
    list.current?.querySelector<HTMLElement>(`#${CSS.escape(tabId(next.value))}`)?.focus();
  }

  return (
    <>
      <div className="money-tablist">
        <div
          ref={list}
          className="money-segmented"
          role="tablist"
          aria-label={label}
          onKeyDown={handleKeyDown}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              id={tabId(option.value)}
              role="tab"
              aria-selected={option.value === value}
              aria-controls={`${baseId}-panel`}
              tabIndex={option.value === value ? 0 : -1}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {actions}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={tabId(value)}
        className="money-tabpanel"
      >
        {children}
      </div>
    </>
  );
}
