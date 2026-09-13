import { CircleAlert } from 'lucide-react';
import { Field, SelectInput } from '@/components/Field';
import { Skeleton } from '@/components/Skeleton';
import type { SettingsSection } from '@/routes';

export interface SectionEntry {
  id: SettingsSection;
  title: string;
  /** Quantos registros a seção guarda. Ausente nas seções que não são lista. */
  count?: number;
  loading?: boolean;
  failed?: boolean;
}

interface SectionNavProps {
  sections: SectionEntry[];
  value: SettingsSection;
  onChange: (section: SettingsSection) => void;
}

/** O que a falha de uma seção diz na navegação, por extenso. */
const FAILED_NOTE = 'não foi possível carregar';

/**
 * A navegação entre os seis assuntos de Configurações — a coluna, e o seletor
 * que a substitui quando a faixa de conteúdo não comporta as duas colunas.
 *
 * Os dois existem no DOM e quem escolhe é o CSS, por largura de **conteúdo**
 * (§2.2): a seção selecionada é estado da tela, então redimensionar a janela
 * troca a forma da navegação sem trocar o que está aberto. Só um dos dois está
 * visível de cada vez, e `display: none` tira o outro da árvore de acessibilidade
 * — não há dois controles concorrentes para o mesmo estado.
 *
 * A falha de uma seção aparece **aqui**, e não só dentro dela: com uma seção
 * visível por vez, um erro na seção oculta não existiria para quem está noutra.
 */
export function SectionNav({ sections, value, onChange }: SectionNavProps) {
  return (
    <>
      <nav className="money-section-nav" aria-label="Seções de configurações">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            // `page` seria mentira: a rota é a mesma, e o que muda é o assunto
            // exibido dentro dela.
            aria-current={section.id === value ? 'true' : undefined}
            onClick={() => onChange(section.id)}
          >
            <span className="money-section-nav-title">{section.title}</span>
            {section.failed ? (
              <>
                <CircleAlert className="money-section-nav-failed" aria-hidden="true" />
                <span className="money-visually-hidden">, {FAILED_NOTE}</span>
              </>
            ) : section.loading ? (
              <Skeleton variant="rounded" width={24} height={18} />
            ) : (
              section.count !== undefined && (
                <span className="money-chip" data-variant="outline">
                  {section.count}
                </span>
              )
            )}
          </button>
        ))}
      </nav>

      {/* O seletor compacto. Nativo, como os demais desta base: a lista dele é
          desenhada pelo sistema, e nesta largura ela é justamente o que não
          precisa caber na tela. */}
      <div className="money-section-select">
        <Field label="Seção">
          <SelectInput
            value={value}
            onChange={(event) => onChange(event.target.value as SettingsSection)}
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {optionLabel(section)}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
    </>
  );
}

/**
 * O mesmo que a coluna mostra, em texto: um `<option>` não recebe marcador nem
 * ícone, então contagem e falha entram no rótulo ou não existem.
 */
function optionLabel(section: SectionEntry): string {
  if (section.failed) return `${section.title} — ${FAILED_NOTE}`;
  if (section.loading || section.count === undefined) return section.title;
  return `${section.title} (${section.count})`;
}
