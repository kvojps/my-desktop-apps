import { CircleAlert } from 'lucide-react';
import { type KeyboardEvent, useRef } from 'react';
import { moveSection } from '../utils/sectionNavigation';
import { SECTIONS, SECTION_IDS, type SectionId, sectionIds } from '../sections';

interface SettingsNavProps {
  /** Prefixo dos ids de aba e painel, o mesmo que os painéis usam. */
  idBase: string;
  active: SectionId;
  onChange: (id: SectionId) => void;
  /** Seções que falharam ao carregar: a falha fica visível daqui, e não só dentro. */
  failed: Partial<Record<SectionId, boolean>>;
}

/**
 * A navegação interna de Configurações: uma lista de abas, uma seção visível
 * por vez. Na faixa de conteúdo larga ela é a coluna à esquerda do painel; na
 * estreita vira o seletor compacto em cima dele — a mesma lista, os mesmos
 * botões, só o CSS muda, e é por isso que a seleção sobrevive ao
 * redimensionamento sem que ninguém precise guardá-la.
 *
 * Só a aba ativa entra na ordem de tabulação; as setas circulam pelas outras e
 * já selecionam ao chegar (os painéis ficam todos montados, então a troca não
 * custa nada). Uma seção que falhou ganha o glifo de alerta e o texto "falhou
 * ao carregar" no nome da aba: é o que torna a falha visível sem entrar nela.
 */
export function SettingsNav({ idBase, active, onChange, failed }: SettingsNavProps) {
  const tabs = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = moveSection(SECTION_IDS, active, event.key);
    if (!next) return;
    event.preventDefault();
    onChange(next);
    tabs.current[next]?.focus();
  }

  return (
    <div
      className="negocio-settings-nav"
      role="tablist"
      aria-label="Seções de Configurações"
      onKeyDown={handleKeyDown}
    >
      {SECTION_IDS.map((id) => {
        const { label, icon: Icon } = SECTIONS[id];
        const ids = sectionIds(idBase, id);
        const selected = id === active;
        return (
          <button
            key={id}
            ref={(element) => {
              tabs.current[id] = element;
            }}
            type="button"
            role="tab"
            id={ids.tab}
            className="negocio-settings-tab"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {failed[id] && (
              <>
                <CircleAlert className="negocio-settings-tab-alert" aria-hidden="true" />
                <span className="negocio-sr-only">, falhou ao carregar</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
