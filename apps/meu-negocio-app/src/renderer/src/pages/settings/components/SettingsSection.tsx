import type { ReactNode } from 'react';
import { IconTile } from '@/components/IconTile';
import { SECTIONS, type SectionId, sectionIds } from '../sections';

interface SettingsSectionProps {
  idBase: string;
  id: SectionId;
  /** A seção visível. As outras continuam montadas, só escondidas. */
  active: boolean;
  children: ReactNode;
}

/**
 * O painel de uma seção de Configurações: ladrilho, título e a linha de
 * explicação no cabeçalho, conteúdo embaixo. É o `tabpanel` da aba de mesmo
 * id — a aba o nomeia, ele aponta de volta para ela.
 *
 * Escondido com `hidden`, não desmontado: o formulário da empresa guarda o
 * que foi digitado, a rolagem e o erro de cada seção ficam onde estavam, e a
 * troca de seção é só trocar o que está à vista.
 */
export function SettingsSection({ idBase, id, active, children }: SettingsSectionProps) {
  const { title, description, icon, accent } = SECTIONS[id];
  const ids = sectionIds(idBase, id);
  return (
    <section
      className="negocio-section"
      role="tabpanel"
      id={ids.panel}
      aria-labelledby={ids.tab}
      hidden={!active}
    >
      <div className="negocio-settings-head">
        <IconTile icon={icon} accent={accent} />
        <div className="ui:min-w-0">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
