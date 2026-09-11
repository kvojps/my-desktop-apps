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
      <h3 className="orca:m-0 orca:text-sm orca:font-semibold orca:text-foreground">{title}</h3>
      {meta && (
        <span className="orca:ml-auto orca:truncate orca:text-xs orca:text-muted-foreground">
          {meta}
        </span>
      )}
    </>
  );

  return (
    <section className="orca:rounded-lg orca:border orca:border-border orca:bg-paper">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="orca-button orca:flex orca:w-full orca:items-center orca:gap-2 orca:rounded-lg orca:px-3 orca:py-2.5 orca:hover:bg-accent"
        >
          {heading}
          <ChevronDown
            aria-hidden
            className={`orca:shrink-0 orca:text-muted-foreground orca:transition-transform ${
              open ? 'orca:rotate-180' : ''
            }`}
          />
        </button>
      ) : (
        <div className="orca:flex orca:items-center orca:gap-2 orca:px-3 orca:py-2.5">
          {heading}
        </div>
      )}

      <div
        id={panelId}
        hidden={collapsible && !open}
        className="orca:border-t orca:border-border orca:px-3 orca:py-3"
      >
        {children}
      </div>
    </section>
  );
}
