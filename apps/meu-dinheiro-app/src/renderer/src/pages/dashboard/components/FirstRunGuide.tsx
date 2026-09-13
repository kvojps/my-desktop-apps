import { Landmark, type LucideIcon, Receipt, Settings, Tag } from 'lucide-react';
import { Button } from '@/components/Button';
import { IconTile } from '@/components/IconTile';
import type { SettingsSection } from '@/routes';
import type { TileAccent } from '@/theme/orca';

interface Step {
  icon: LucideIcon;
  accent: TileAccent;
  title: string;
  description: string;
  /** Onde o passo se faz. É ele que o botão do passo abre. */
  section: SettingsSection;
}

const STEPS: Step[] = [
  {
    icon: Landmark,
    accent: 'primary',
    title: 'Cadastre suas contas',
    description: 'É de onde saem os pagamentos e para onde entram os recebimentos.',
    section: 'bank-accounts',
  },
  {
    icon: Tag,
    accent: 'warning',
    title: 'Ajuste as categorias',
    description: 'Dez já vêm prontas; renomeie ou troque a cor das que você usa.',
    section: 'categories',
  },
  {
    icon: Receipt,
    accent: 'secondary',
    title: 'Cadastre as despesas e entradas fixas',
    description: 'Elas são criadas automaticamente em todo mês novo.',
    section: 'default-expenses',
  },
];

interface FirstRunGuideProps {
  onGoToSection: (section: SettingsSection) => void;
}

/**
 * A primeira tela de quem ainda não tem mês nenhum. Não é uma lista vazia: é a
 * ordem em que os três cadastros precisam acontecer para o app montar os meses
 * sozinho, com a saída para onde eles são feitos (§5.4).
 *
 * Cada passo abre a **sua** seção de Configurações, e não a tela: desde a
 * issue 05 a seção é um destino com endereço, e mandar os três para o mesmo
 * lugar deixaria a orientação parando uma porta antes do que ela pede.
 */
export function FirstRunGuide({ onGoToSection }: FirstRunGuideProps) {
  return (
    <section className="money-panel money-guide">
      <h2>Nenhum mês cadastrado</h2>
      <p>Três passos em Configurações e o app já monta os meses para você.</p>

      <ol>
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <IconTile icon={step.icon} accent={step.accent} />
            <div>
              <strong>
                {index + 1}. {step.title}
              </strong>
              <p>{step.description}</p>
            </div>
            {/* O rótulo visível é curto porque a linha inteira já diz o
                passo; o nome acessível repete o passo, porque três botões
                chamados "Abrir" não distinguem nada (§5.5). */}
            <Button
              aria-label={`Abrir — ${step.title}`}
              onClick={() => onGoToSection(step.section)}
            >
              Abrir
            </Button>
          </li>
        ))}
      </ol>

      <div className="money-guide-actions">
        <Button variant="primary" onClick={() => onGoToSection(STEPS[0].section)}>
          <Settings size={18} aria-hidden="true" />
          Ir para Configurações
        </Button>
      </div>
    </section>
  );
}
