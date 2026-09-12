import { ChevronDown } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

/**
 * Uma seção do painel de detalhes. Recolher é opcional e é escolha de quem
 * compõe a tela: seção extensa recolhe, seção que carrega problema fica aberta
 * (ver `RepoDetails`).
 *
 * O painel continua montado quando fechado, escondido pelo `hidden`, para que o
 * `aria-controls` do cabeçalho aponte sempre para um elemento que existe.
 */
export function DetailsSection({
  title,
  meta,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: string;
  /** Contagem ou resumo que se lê com a seção fechada. */
  meta?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  const heading = (
    <>
      <h3 className="ui:m-0 ui:text-sm ui:font-semibold ui:text-foreground">{title}</h3>
      {meta && (
        <span className="ui:ml-auto ui:truncate ui:text-xs ui:text-muted-foreground">
          {meta}
        </span>
      )}
    </>
  );

  return (
    <section className="ui:rounded-lg ui:border ui:border-border ui:bg-paper">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="ui-button ui:flex ui:w-full ui:items-center ui:gap-2 ui:rounded-lg ui:px-3 ui:py-2.5 ui:hover:bg-accent"
        >
          {heading}
          <ChevronDown
            aria-hidden
            className={`ui:shrink-0 ui:text-muted-foreground ui:transition-transform ${
              open ? 'ui:rotate-180' : ''
            }`}
          />
        </button>
      ) : (
        <div className="ui:flex ui:items-center ui:gap-2 ui:px-3 ui:py-2.5">
          {heading}
        </div>
      )}

      <div
        id={panelId}
        hidden={collapsible && !open}
        className="ui:border-t ui:border-border ui:px-3 ui:py-3"
      >
        {children}
      </div>
    </section>
  );
}
